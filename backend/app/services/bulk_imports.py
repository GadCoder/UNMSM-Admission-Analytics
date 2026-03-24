from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.core.db import SessionLocal
from app.repositories.bulk_imports import BulkImportRepository
from app.repositories.imports import ResultsImportRepository
from app.schemas.imports import (
    BulkImportBatchCreateResponse,
    BulkImportBatchItemResponse,
    BulkImportBatchItemsResponse,
    BulkImportBatchStatusResponse,
)
from app.services.imports import CsvImportFileError, ResultsImportService
from app.services.storage import StorageConfigurationError, StorageService
from app.utils.csv_import import (
    CsvImportFormatError,
    missing_required_columns,
    parse_csv_rows,
)


class BulkImportValidationError(ValueError):
    pass


class BulkImportNotFoundError(ValueError):
    pass


@dataclass(frozen=True)
class BatchFilePayload:
    filename: str
    content_type: str
    process_id: int
    payload: bytes


class BulkImportService:
    def __init__(
        self,
        repository: BulkImportRepository | None = None,
        import_repository: ResultsImportRepository | None = None,
        import_service: ResultsImportService | None = None,
        storage_service: StorageService | None = None,
        session_factory: sessionmaker | None = None,
    ) -> None:
        self.repository = repository or BulkImportRepository()
        self.import_repository = import_repository or ResultsImportRepository()
        self.import_service = import_service or ResultsImportService(
            repository=self.import_repository
        )
        self.storage_service = storage_service or StorageService()
        self.session_factory = session_factory or SessionLocal
        self.settings = get_settings()

    def create_batch(
        self,
        db: Session,
        *,
        files: list[UploadFile],
        process_id: int | None,
        process_overrides: dict[str, int],
        created_by: str,
    ) -> BulkImportBatchCreateResponse:
        if len(files) == 0:
            raise BulkImportValidationError("At least one file is required")
        if len(files) > self.settings.bulk_max_files_per_batch:
            raise BulkImportValidationError("Too many files for a single batch")

        prepared = self._prepare_files(
            files, process_id=process_id, process_overrides=process_overrides
        )
        for file_payload in prepared:
            if self.repository.get_process_by_id(db, file_payload.process_id) is None:
                raise BulkImportValidationError(
                    f"Unknown admission process for file {file_payload.filename}: {file_payload.process_id}"
                )

        batch = self.repository.create_batch(
            db, created_by=created_by, default_process_id=process_id
        )
        major_map = self.import_repository.get_major_name_map(db)

        for file_payload in prepared:
            columns, rows = self._parse_rows(file_payload.payload)
            missing_columns = missing_required_columns(columns)
            if missing_columns:
                raise BulkImportValidationError(
                    f"File {file_payload.filename} is missing required columns: {', '.join(missing_columns)}"
                )

            major_id = self._derive_major_id(
                major_map=major_map, rows=rows, filename=file_payload.filename
            )
            checksum_sha256 = hashlib.sha256(file_payload.payload).hexdigest()
            object_key = self._object_key(
                created_by=created_by, filename=file_payload.filename
            )
            try:
                bucket, key = self.storage_service.upload_bytes(
                    object_key=object_key,
                    payload=file_payload.payload,
                    content_type=file_payload.content_type,
                )
            except StorageConfigurationError as exc:
                raise BulkImportValidationError(str(exc)) from exc

            source_file = self.repository.create_source_file(
                db,
                s3_bucket=bucket,
                s3_object_key=key,
                original_filename=file_payload.filename,
                content_type=file_payload.content_type,
                size_bytes=len(file_payload.payload),
                checksum_sha256=checksum_sha256,
                admission_process_id=file_payload.process_id,
                major_id=major_id,
                uploaded_by=created_by,
            )
            self.repository.create_batch_item(
                db,
                batch_id=batch.id,
                source_file_id=source_file.id,
                process_id=file_payload.process_id,
                status="queued",
            )

        db.commit()
        counts = self.repository.count_batch_items_by_status(db, batch.id)
        return BulkImportBatchCreateResponse(
            batch_id=batch.id,
            total_items=sum(counts.values()),
            queued_items=counts["queued"],
        )

    def process_batch(self, batch_id: int) -> None:
        with self.session_factory() as db:
            batch = self.repository.get_batch(db, batch_id)
            if batch is None:
                return

            queued_items = self.repository.list_queued_batch_items(
                db, batch_id=batch.id
            )
            item_limit = min(
                self.settings.bulk_max_items_per_run,
                self.settings.bulk_max_import_workers,
            )
            for item in queued_items[:item_limit]:
                self._process_item(db, item.id)

    def cleanup_temporary_staging_artifacts(self) -> dict[str, int]:
        success_prefix = f"{self.settings.s3_staging_prefix.strip('/')}/success/"
        failed_prefix = f"{self.settings.s3_staging_prefix.strip('/')}/failed/"

        success_deleted = self.storage_service.delete_prefix_older_than(
            prefix=success_prefix,
            age_hours=self.settings.bulk_staging_success_retention_hours,
        )
        failed_deleted = self.storage_service.delete_prefix_older_than(
            prefix=failed_prefix,
            age_hours=self.settings.bulk_staging_failure_retention_hours,
        )
        return {
            "success_deleted": success_deleted,
            "failed_deleted": failed_deleted,
        }

    def get_batch_status(
        self, db: Session, batch_id: int
    ) -> BulkImportBatchStatusResponse:
        batch = self.repository.get_batch(db, batch_id)
        if batch is None:
            raise BulkImportNotFoundError("Import batch not found")

        counts = self.repository.count_batch_items_by_status(db, batch_id)
        return BulkImportBatchStatusResponse(
            batch_id=batch_id,
            total_items=sum(counts.values()),
            queued_items=counts["queued"],
            processing_items=counts["processing"],
            completed_items=counts["completed"],
            failed_items=counts["failed"],
            cancelled_items=counts["cancelled"],
        )

    def list_batch_items(
        self, db: Session, batch_id: int
    ) -> BulkImportBatchItemsResponse:
        batch = self.repository.get_batch(db, batch_id)
        if batch is None:
            raise BulkImportNotFoundError("Import batch not found")

        items = self.repository.list_batch_items(db, batch_id)
        return BulkImportBatchItemsResponse(
            batch_id=batch_id,
            items=[
                BulkImportBatchItemResponse(
                    item_id=item.id,
                    status=item.status,
                    process_id=item.process_id,
                    filename=item.source_file.original_filename,
                    source_file_id=item.source_file.id,
                    major_id=item.source_file.major_id,
                    total_rows=item.total_rows,
                    imported_rows=item.imported_rows,
                    failed_rows=item.failed_rows,
                    failure_reason=item.failure_reason,
                    updated_at=item.updated_at,
                )
                for item in items
            ],
        )

    def retry_failed_items(
        self, db: Session, batch_id: int
    ) -> BulkImportBatchStatusResponse:
        batch = self.repository.get_batch(db, batch_id)
        if batch is None:
            raise BulkImportNotFoundError("Import batch not found")

        items = self.repository.list_batch_items(db, batch_id)
        for item in items:
            if item.status != "failed":
                continue
            item.status = "queued"
            item.failure_reason = None
            item.error_payload = None
            item.started_at = None
            item.finished_at = None
        db.commit()
        return self.get_batch_status(db, batch_id)

    def cancel_queued_items(
        self, db: Session, batch_id: int
    ) -> BulkImportBatchStatusResponse:
        batch = self.repository.get_batch(db, batch_id)
        if batch is None:
            raise BulkImportNotFoundError("Import batch not found")

        items = self.repository.list_batch_items(db, batch_id)
        now = datetime.now(tz=UTC)
        for item in items:
            if item.status == "queued":
                item.status = "cancelled"
                item.finished_at = now
        db.commit()
        return self.get_batch_status(db, batch_id)

    def _process_item(self, db: Session, item_id: int) -> None:
        item = self.repository.get_batch_item(db, item_id)
        if item is None or item.status != "queued":
            return

        now = datetime.now(tz=UTC)
        item.status = "processing"
        item.started_at = now
        db.commit()

        try:
            payload = self.storage_service.get_bytes(item.source_file.s3_object_key)
            summary = self.import_service.import_results_bytes(
                db, process_id=item.process_id, file_bytes=payload
            )
            item.total_rows = summary.total_rows
            item.imported_rows = summary.imported_rows
            item.failed_rows = summary.failed_rows
            item.error_payload = json.dumps(
                [error.model_dump(mode="json") for error in summary.errors]
            )
            item.status = "completed"
            item.finished_at = datetime.now(tz=UTC)
            db.commit()
        except (
            CsvImportFileError,
            BulkImportValidationError,
            StorageConfigurationError,
            Exception,
        ) as exc:  # noqa: BLE001
            db.rollback()
            item = self.repository.get_batch_item(db, item_id)
            if item is None:
                return
            item.status = "failed"
            item.failure_reason = str(exc)
            item.finished_at = datetime.now(tz=UTC)
            db.commit()

    def _prepare_files(
        self,
        files: list[UploadFile],
        *,
        process_id: int | None,
        process_overrides: dict[str, int],
    ) -> list[BatchFilePayload]:
        prepared: list[BatchFilePayload] = []
        total_size = 0
        max_file_size = self.settings.bulk_max_file_size_mb * 1024 * 1024
        max_total_size = self.settings.bulk_max_total_batch_size_mb * 1024 * 1024

        for file in files:
            resolved_process_id = process_overrides.get(file.filename or "")
            if resolved_process_id is None:
                if process_id is None:
                    raise BulkImportValidationError(
                        f"No process_id available for file {file.filename or 'unknown.csv'}"
                    )
                resolved_process_id = process_id

            payload = file.file.read()
            size_bytes = len(payload)
            if size_bytes > max_file_size:
                raise BulkImportValidationError(
                    f"File {file.filename} exceeds the maximum file size"
                )

            total_size += size_bytes
            if total_size > max_total_size:
                raise BulkImportValidationError(
                    "Total batch size exceeds configured limit"
                )

            prepared.append(
                BatchFilePayload(
                    filename=file.filename or "upload.csv",
                    content_type=file.content_type or "text/csv",
                    process_id=resolved_process_id,
                    payload=payload,
                )
            )

        return prepared

    def _parse_rows(self, payload: bytes):
        try:
            return parse_csv_rows(payload)
        except CsvImportFormatError as exc:
            raise BulkImportValidationError(str(exc)) from exc

    def _derive_major_id(
        self, *, major_map: dict[str, int], rows, filename: str
    ) -> int:
        majors = {
            row.values.get("major", "").strip()
            for row in rows
            if row.values.get("major", "").strip() != ""
        }
        if len(majors) != 1:
            raise BulkImportValidationError(
                f"File {filename} must contain exactly one major"
            )
        major_name = next(iter(majors))
        major_id = major_map.get(major_name)
        if major_id is None:
            raise BulkImportValidationError(
                f"Unknown major in file {filename}: {major_name}"
            )
        return major_id

    def _object_key(self, *, created_by: str, filename: str) -> str:
        token = uuid4().hex
        safe_filename = filename.replace("/", "-").replace("..", "-")
        prefix = self.settings.s3_prefix.strip("/")
        return f"{prefix}/{created_by}/{token}-{safe_filename}"
