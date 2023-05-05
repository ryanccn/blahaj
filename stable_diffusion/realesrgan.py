from realesrgan import RealESRGANer
from realesrgan.archs.srvgg_arch import SRVGGNetCompact
from PIL import Image
import gc
import torch
import numpy as np


def process_image(image: Image.Image) -> Image.Image:
    net = SRVGGNetCompact(
        num_in_ch=3,
        num_out_ch=3,
        num_feat=64,
        num_conv=32,
        upscale=4,
        act_type="prelu",
    )

    upsampler = RealESRGANer(
        scale=4,
        model_path=[
            "/root/cache/realesrgan/realesr-general-x4v3.pth",
            "/root/cache/realesrgan/realesr-general-wdn-x4v3.pth",
        ],
        dni_weight=[0.75, 0.25],
        model=net,
        tile=400,
        tile_pad=10,
        pre_pad=0,
        half=torch.cuda.is_available(),
    )

    image = image.convert("RGB")

    bgr_image = np.array(image, dtype=np.uint8)[..., ::-1]

    output, _ = upsampler.enhance(bgr_image, outscale=2, alpha_upsampler="realesrgan")

    upsampler = None

    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    gc.collect()

    return Image.fromarray(output[..., ::-1])
