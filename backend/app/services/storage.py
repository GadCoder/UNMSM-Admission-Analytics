from __future__ import annotations

import io
from datetime import UTC, datetime, timedelta

import boto3
from botocore.client import BaseClient

from app.core.config import get_settings


class StorageConfigurationError(RuntimeError):
    pass


class StorageService:
    def __init__(self, client: BaseClient | None = None) -> None:
        self.settings = get_settings()
        self.bucket = self.settings.s3_bucket
        self.client = client or boto3.client(
            "s3",
            region_name=self.settings.s3_region,
            endpoint_url=self.settings.s3_endpoint_url,
            aws_access_key_id=self.settings.s3_access_key_id,
            aws_secret_access_key=self.settings.s3_secret_access_key,
        )

    def upload_bytes(
        self, object_key: str, payload: bytes, content_type: str
    ) -> tuple[str, str]:
        if self.bucket is None or self.bucket.strip() == "":
            raise StorageConfigurationError("S3 bucket is not configured")

        self.client.upload_fileobj(
            io.BytesIO(payload),
            self.bucket,
            object_key,
            ExtraArgs={"ContentType": content_type},
        )
        return self.bucket, object_key

    def get_bytes(self, object_key: str) -> bytes:
        if self.bucket is None or self.bucket.strip() == "":
            raise StorageConfigurationError("S3 bucket is not configured")

        result = self.client.get_object(Bucket=self.bucket, Key=object_key)
        return result["Body"].read()

    def delete_object(self, object_key: str) -> None:
        if self.bucket is None or self.bucket.strip() == "":
            raise StorageConfigurationError("S3 bucket is not configured")
        self.client.delete_object(Bucket=self.bucket, Key=object_key)

    def delete_prefix_older_than(self, *, prefix: str, age_hours: int) -> int:
        if self.bucket is None or self.bucket.strip() == "":
            raise StorageConfigurationError("S3 bucket is not configured")

        cutoff = datetime.now(tz=UTC) - timedelta(hours=age_hours)
        paginator = self.client.get_paginator("list_objects_v2")
        deleted = 0

        for page in paginator.paginate(Bucket=self.bucket, Prefix=prefix):
            for obj in page.get("Contents", []):
                last_modified = obj.get("LastModified")
                if last_modified is None:
                    continue
                object_key = obj.get("Key")
                if object_key is None:
                    continue
                object_last_modified = (
                    last_modified.astimezone(UTC)
                    if last_modified.tzinfo
                    else last_modified.replace(tzinfo=UTC)
                )
                if object_last_modified <= cutoff:
                    self.client.delete_object(Bucket=self.bucket, Key=object_key)
                    deleted += 1

        return deleted
