from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ImportErrorItemResponse(BaseModel):
    row_number: int
    reason: str
    reason_code: str | None = None


class ResultsImportSummaryResponse(BaseModel):
    process_id: int
    total_rows: int
    imported_rows: int
    failed_rows: int
    errors: list[ImportErrorItemResponse]


class BulkImportBatchCreateFileRequest(BaseModel):
    filename: str
    process_id: int | None = None


class BulkImportBatchCreateResponse(BaseModel):
    batch_id: int
    total_items: int
    queued_items: int


class BulkImportBatchStatusResponse(BaseModel):
    batch_id: int
    total_items: int
    queued_items: int
    processing_items: int
    completed_items: int
    failed_items: int
    cancelled_items: int


class BulkImportBatchItemResponse(BaseModel):
    item_id: int
    status: str
    process_id: int
    filename: str
    source_file_id: int
    major_id: int
    total_rows: int
    imported_rows: int
    failed_rows: int
    failure_reason: str | None
    updated_at: datetime


class BulkImportBatchItemsResponse(BaseModel):
    batch_id: int
    items: list[BulkImportBatchItemResponse]
