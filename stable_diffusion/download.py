def download_file(url: str, path: str):
    import requests

    with requests.get(url, stream=True) as r:
        r.raise_for_status()

        with open(path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)


def ensure_directory(path: str):
    from os import makedirs

    makedirs(path, exist_ok=True)


def download_model():
    from diffusers import StableDiffusionPipeline
    from .config import HF_MODEL_ID
    import torch
    import gc

    ensure_directory("/root/cache/diffusers")

    _ = StableDiffusionPipeline.from_pretrained(
        HF_MODEL_ID,
        torch_dtype=torch.float16,
        cache_dir="/root/cache/diffusers",
        safety_checker=None,
    )
    _ = None

    gc.collect()


def download_realesrgan():
    ensure_directory("/root/cache/realesrgan")

    download_file(
        "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-x4v3.pth",
        "/root/cache/realesrgan/realesr-general-x4v3.pth",
    )
    download_file(
        "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-wdn-x4v3.pth",
        "/root/cache/realesrgan/realesr-general-wdn-x4v3.pth",
    )


def download_embeddings() -> list[str]:
    import os
    from .config import TI_EMBEDDINGS

    ensure_directory("/root/cache/embeddings")

    ret = []

    for name in TI_EMBEDDINGS:
        embeddings_path = os.path.join("/root/cache/embeddings", name)
        if not os.path.exists(embeddings_path):
            download_file(TI_EMBEDDINGS[name], embeddings_path)
        ret.append(embeddings_path)

    return ret
