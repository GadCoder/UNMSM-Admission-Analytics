from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import TimestampMixin


class ImportBatch(TimestampMixin, Base):
    __tablename__ = "import_batches"
    __table_args__ = (
        Index("ix_import_batches_created_by", "created_by"),
        Index("ix_import_batches_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    created_by: Mapped[str] = mapped_column(String(120), nullable=False)
    default_process_id: Mapped[int | None] = mapped_column(
        ForeignKey("admission_processes.id", ondelete="SET NULL"),
        nullable=True,
    )

    items: Mapped[list[ImportBatchItem]] = relationship(back_populates="batch")


class ImportSourceFile(TimestampMixin, Base):
    __tablename__ = "import_source_files"
    __table_args__ = (
        Index(
            "ix_import_source_files_process_major", "admission_process_id", "major_id"
        ),
        Index("ix_import_source_files_uploaded_by", "uploaded_by"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    s3_bucket: Mapped[str] = mapped_column(String(180), nullable=False)
    s3_object_key: Mapped[str] = mapped_column(String(512), nullable=False, unique=True)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(120), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    checksum_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    admission_process_id: Mapped[int] = mapped_column(
        ForeignKey("admission_processes.id", ondelete="RESTRICT"),
        nullable=False,
    )
    major_id: Mapped[int] = mapped_column(
        ForeignKey("majors.id", ondelete="RESTRICT"), nullable=False
    )
    uploaded_by: Mapped[str] = mapped_column(String(120), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    items: Mapped[list[ImportBatchItem]] = relationship(back_populates="source_file")


class ImportBatchItem(TimestampMixin, Base):
    __tablename__ = "import_batch_items"
    __table_args__ = (
        Index("ix_import_batch_items_batch_id", "batch_id"),
        Index("ix_import_batch_items_status", "status"),
        Index("ix_import_batch_items_process_id", "process_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    batch_id: Mapped[int] = mapped_column(
        ForeignKey("import_batches.id", ondelete="CASCADE"), nullable=False
    )
    source_file_id: Mapped[int] = mapped_column(
        ForeignKey("import_source_files.id", ondelete="RESTRICT"),
        nullable=False,
    )
    process_id: Mapped[int] = mapped_column(
        ForeignKey("admission_processes.id", ondelete="RESTRICT"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(24), nullable=False)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    imported_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_payload: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    batch: Mapped[ImportBatch] = relationship(back_populates="items")
    source_file: Mapped[ImportSourceFile] = relationship(back_populates="items")
