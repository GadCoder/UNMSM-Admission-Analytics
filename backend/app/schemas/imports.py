from __future__ import annotations

from pydantic import BaseModel


class ImportErrorItemResponse(BaseModel):
    row_number: int
    reason: str


class ResultsImportSummaryResponse(BaseModel):
    process_id: int
    total_rows: int
    imported_rows: int
    failed_rows: int
    errors: list[ImportErrorItemResponse]
