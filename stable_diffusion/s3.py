import boto3
from botocore.config import Config

from datetime import datetime
from nanoid import generate

import os

S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")
S3_ACCESS_KEY_ID = os.getenv("S3_ACCESS_KEY_ID")
S3_SECRET_ACCESS_KEY = os.getenv("S3_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
S3_PUBLIC_URL = os.getenv("S3_PUBLIC_URL")

if (
    not S3_ENDPOINT_URL
    or not S3_ACCESS_KEY_ID
    or not S3_SECRET_ACCESS_KEY
    or not S3_BUCKET_NAME
    or not S3_PUBLIC_URL
):
    raise NameError("S3 not configured properly via environment variables!")


def get_s3_resource():
    s3 = boto3.resource(
        service_name="s3",
        endpoint_url=S3_ENDPOINT_URL,
        aws_access_key_id=S3_ACCESS_KEY_ID,
        aws_secret_access_key=S3_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
    )
    return s3


def upload_file(content: bytes):
    s3 = get_s3_resource()

    now = datetime.utcnow().strftime("%Y-%m-%d-%H-%M-%S")
    remote_path = f"{now}-{generate(size=8)}.png"

    s3.Object(S3_BUCKET_NAME, remote_path).put(Body=content)

    return f"{S3_PUBLIC_URL}/{remote_path}"
