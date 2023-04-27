import boto3
from botocore.config import Config

import uuid
import os

S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")
S3_ACCESS_KEY_ID = os.getenv("S3_ACCESS_KEY_ID")
S3_SECRET_ACCESS_KEY = os.getenv("S3_SECRET_ACCESS_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")


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
    remote_path = f"{uuid.uuid4()}.png"

    s3.Object(S3_BUCKET_NAME, remote_path).put(Body=content)

    return f"{S3_ENDPOINT_URL}/{S3_BUCKET_NAME}/{remote_path}"
