from __future__ import annotations

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session, joinedload

from app.models.admission import AdmissionProcess
from app.models.imports import ImportBatch, ImportBatchItem, ImportSourceFile


class BulkImportRepository:
    def get_process_by_id(
        self, db: Session, process_id: int
    ) -> AdmissionProcess | None:
        stmt = select(AdmissionProcess).where(AdmissionProcess.id == process_id)
        return db.scalar(stmt)

    def create_batch(
        self, db: Session, *, created_by: str, default_process_id: int | None
    ) -> ImportBatch:
        batch = ImportBatch(
            created_by=created_by, default_process_id=default_process_id
        )
        db.add(batch)
        db.flush()
        return batch

    def get_batch(self, db: Session, batch_id: int) -> ImportBatch | None:
        stmt = select(ImportBatch).where(ImportBatch.id == batch_id)
        return db.scalar(stmt)

    def create_source_file(
        self,
        db: Session,
        *,
        s3_bucket: str,
        s3_object_key: str,
        original_filename: str,
        content_type: str,
        size_bytes: int,
        checksum_sha256: str,
        admission_process_id: int,
        major_id: int,
        uploaded_by: str,
    ) -> ImportSourceFile:
        source_file = ImportSourceFile(
            s3_bucket=s3_bucket,
            s3_object_key=s3_object_key,
            original_filename=original_filename,
            content_type=content_type,
            size_bytes=size_bytes,
            checksum_sha256=checksum_sha256,
            admission_process_id=admission_process_id,
            major_id=major_id,
            uploaded_by=uploaded_by,
        )
        db.add(source_file)
        db.flush()
        return source_file

    def create_batch_item(
        self,
        db: Session,
        *,
        batch_id: int,
        source_file_id: int,
        process_id: int,
        status: str,
    ) -> ImportBatchItem:
        item = ImportBatchItem(
            batch_id=batch_id,
            source_file_id=source_file_id,
            process_id=process_id,
            status=status,
        )
        db.add(item)
        db.flush()
        return item

    def list_batch_items(self, db: Session, batch_id: int) -> list[ImportBatchItem]:
        stmt: Select = (
            select(ImportBatchItem)
            .options(joinedload(ImportBatchItem.source_file))
            .where(ImportBatchItem.batch_id == batch_id)
            .order_by(ImportBatchItem.id.asc())
        )
        return list(db.scalars(stmt).all())

    def list_queued_batch_items(
        self, db: Session, batch_id: int
    ) -> list[ImportBatchItem]:
        stmt: Select = (
            select(ImportBatchItem)
            .options(joinedload(ImportBatchItem.source_file))
            .where(
                ImportBatchItem.batch_id == batch_id, ImportBatchItem.status == "queued"
            )
            .order_by(ImportBatchItem.id.asc())
        )
        return list(db.scalars(stmt).all())

    def get_batch_item(self, db: Session, item_id: int) -> ImportBatchItem | None:
        stmt: Select = (
            select(ImportBatchItem)
            .options(joinedload(ImportBatchItem.source_file))
            .where(ImportBatchItem.id == item_id)
        )
        return db.scalar(stmt)

    def count_batch_items_by_status(self, db: Session, batch_id: int) -> dict[str, int]:
        stmt = (
            select(ImportBatchItem.status, func.count(ImportBatchItem.id))
            .where(ImportBatchItem.batch_id == batch_id)
            .group_by(ImportBatchItem.status)
        )
        counts = {status: int(count) for status, count in db.execute(stmt).all()}
        return {
            "queued": counts.get("queued", 0),
            "processing": counts.get("processing", 0),
            "completed": counts.get("completed", 0),
            "failed": counts.get("failed", 0),
            "cancelled": counts.get("cancelled", 0),
        }
