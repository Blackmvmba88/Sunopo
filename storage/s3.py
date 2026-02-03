from typing import BinaryIO
import boto3
from botocore.exceptions import ClientError

class S3Storage:
    def __init__(self, bucket: str, region: str = 'us-east-1'):
        self.bucket = bucket
        self.s3 = boto3.client('s3', region_name=region)

    def save(self, key: str, data: BinaryIO) -> str:
        try:
            self.s3.upload_fileobj(data, self.bucket, key)
            return f's3://{self.bucket}/{key}'
        except ClientError as e:
            raise

    def exists(self, key: str) -> bool:
        try:
            self.s3.head_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError:
            return False

    def get_url(self, key: str) -> str:
        return f's3://{self.bucket}/{key}'
