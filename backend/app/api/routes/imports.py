from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.schemas.imports import ResultsImportSummaryResponse
from app.services.imports import CsvImportFileError, ResultsImportService

router = APIRouter(prefix="/imports", tags=["imports"])


def get_results_import_service() -> ResultsImportService:
    return ResultsImportService()


@router.post("/results", response_model=ResultsImportSummaryResponse, summary="Import admission results CSV")
def import_results(
    file: UploadFile = File(...),
    process_id: int = Form(...),
    db: Session = Depends(get_db_session),
    service: ResultsImportService = Depends(get_results_import_service),
) -> ResultsImportSummaryResponse:
    try:
        return service.import_results_csv(db, process_id=process_id, file=file)
    except CsvImportFileError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
