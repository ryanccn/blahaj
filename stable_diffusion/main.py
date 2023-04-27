import modal
from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    status,
    Request,
    responses,
)
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .download import download_model, download_embeddings, download_realesrgan
from .config import HF_MODEL_ID

import io
import os

stub = modal.Stub("blahaj-stable-diffusion")

diffusers_cache_volume = modal.SharedVolume().persist("diffusers_cache_v1")
embeddings_cache_volume = modal.SharedVolume().persist("embedding_cache_v1")
realesrgan_cache_volume = modal.SharedVolume().persist("realesrgan_cache_v1")

sd_image = (
    modal.Image.debian_slim(python_version="3.10")
    .pip_install(
        "diffusers[torch]",
        "compel",
        "safetensors",
        "transformers",
        "accelerate",
        "realesrgan",
        "picklescan",
        "requests",
    )
    .pip_install("xformers", "triton")
    .pip_install("boto3", "botocore")
    .pip_install(
        "torch", "torchvision", extra_index_url="https://download.pytorch.org/whl/cu117"
    )
    .apt_install("ffmpeg", "libsm6", "libxext6")
    .run_function(
        download_model,
        shared_volumes={
            "/root/cache/diffusers": diffusers_cache_volume,
        },
    )
    .run_function(
        download_realesrgan,
        shared_volumes={
            "/root/cache/realesrgan": realesrgan_cache_volume,
        },
    )
    .run_function(
        download_embeddings,
        shared_volumes={"/root/cache/embeddings": embeddings_cache_volume},
    )
)


@stub.function(
    image=sd_image,
    gpu="T4",
    shared_volumes={
        "/root/cache/diffusers": diffusers_cache_volume,
        "/root/cache/embeddings": embeddings_cache_volume,
        "/root/cache/realesrgan": realesrgan_cache_volume,
    },
    secret=modal.Secret.from_name("stable-diffusion-s3"),
)
def generate(
    prompt: str,
    negative_prompt: str | None = None,
    seed: int | None = None,
    upscale=False,
):
    from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
    from compel import Compel
    from .download import download_embeddings
    from .embeddings import TextualInversionManager
    from .s3 import upload_file

    import random
    import torch
    import numpy as np

    embedding_paths = download_embeddings()

    pipe = StableDiffusionPipeline.from_pretrained(
        HF_MODEL_ID,
        torch_dtype=torch.float16,
        cache_dir="/root/cache/diffusers",
        safety_checker=None,
    )
    pipe.to("cuda")
    pipe.enable_vae_tiling()
    pipe.enable_xformers_memory_efficient_attention()

    ti_manager = TextualInversionManager(
        tokenizer=pipe.tokenizer,
        text_encoder=pipe.text_encoder,
    )

    for embedding in embedding_paths:
        ti_manager.load_textual_inversion(embedding)

    pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
    compel = Compel(
        tokenizer=pipe.tokenizer,
        text_encoder=pipe.text_encoder,
        textual_inversion_manager=ti_manager,
    )

    if not seed:
        seed = random.randrange(0, np.iinfo(np.uint32).max)
    generator = torch.Generator("cpu").manual_seed(seed)

    with torch.inference_mode():
        image = pipe(
            prompt_embeds=compel(prompt),
            negative_prompt_embeds=(
                compel(negative_prompt) if negative_prompt is not None else None
            ),
            num_inference_steps=25,
            generator=generator,
        ).images[0]

    if upscale:
        from .realesrgan import process_image

        image = process_image(image)

    with io.BytesIO() as buf:
        image.save(buf, format="PNG")
        img_bytes = buf.getvalue()

    url = upload_file(img_bytes)
    return {
        "url": url,
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "seed": seed,
        "steps": 25,
        "scheduler": "DPMSolverMultistepScheduler",
        "upscaled": upscale,
    }


web_app = FastAPI()


@web_app.post("/start")
async def start_endpoint(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
):
    if credentials.credentials != os.getenv("TOKEN", None):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    data = await request.json()

    prompt = data.get("prompt")
    negative_prompt = data.get("negative_prompt", None)
    upscale = data.get("upscale", None)

    call = generate.spawn(
        prompt, negative_prompt=negative_prompt, upscale=bool(upscale)
    )
    return {"call_id": call.object_id}


@web_app.get("/status/{call_id}")
async def status_endpoint(
    call_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
):
    if credentials.credentials != os.getenv("TOKEN", None):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    function_call = modal.functions.FunctionCall.from_id(call_id)
    try:
        result = function_call.get(timeout=0)
        return responses.JSONResponse({"status": "done", "data": result})
    except TimeoutError:
        return responses.JSONResponse(
            {"status": "working"}, status_code=status.HTTP_202_ACCEPTED
        )


@stub.function(secret=modal.Secret.from_name("stable-diffusion-auth-token"))
@modal.asgi_app()
def fastapi_app():
    return web_app
