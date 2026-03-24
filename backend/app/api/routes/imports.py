from __future__ import annotations

import json

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_admin
from app.core.db import get_db_session
from app.schemas.auth import AuthenticatedAdmin
from app.schemas.imports import (
    BulkImportBatchCreateResponse,
    BulkImportBatchItemsResponse,
    BulkImportBatchStatusResponse,
    ResultsImportSummaryResponse,
)
from app.services.bulk_imports import (
    BulkImportNotFoundError,
    BulkImportService,
    BulkImportValidationError,
)
from app.services.imports import CsvImportFileError, ResultsImportService

router = APIRouter(prefix="/imports", tags=["imports"])


def get_results_import_service() -> ResultsImportService:
    return ResultsImportService()


def get_bulk_import_service() -> BulkImportService:
    return BulkImportService()


@router.post(
    "/results",
    response_model=ResultsImportSummaryResponse,
    summary="Import admission results CSV",
)
def import_results(
    file: UploadFile = File(...),
    process_id: int = Form(...),
    db: Session = Depends(get_db_session),
    service: ResultsImportService = Depends(get_results_import_service),
    _: AuthenticatedAdmin = Depends(get_current_admin),
) -> ResultsImportSummaryResponse:
    try:
        return service.import_results_csv(db, process_id=process_id, file=file)
    except CsvImportFileError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post(
    "/results/batches",
    response_model=BulkImportBatchCreateResponse,
    summary="Create bulk results import batch",
)
def create_results_batch(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    process_id: int | None = Form(default=None),
    process_overrides: str | None = Form(default=None),
    db: Session = Depends(get_db_session),
    service: BulkImportService = Depends(get_bulk_import_service),
    admin: AuthenticatedAdmin = Depends(get_current_admin),
) -> BulkImportBatchCreateResponse:
    overrides_map: dict[str, int] = {}
    if process_overrides is not None and process_overrides.strip() != "":
        try:
            parsed = json.loads(process_overrides)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=422, detail="Invalid process_overrides JSON"
            ) from exc
        if not isinstance(parsed, dict):
            raise HTTPException(
                status_code=422, detail="process_overrides must be a JSON object"
            )
        for key, value in parsed.items():
            if not isinstance(key, str) or not isinstance(value, int):
                raise HTTPException(
                    status_code=422,
                    detail="process_overrides must map filename strings to integer process IDs",
                )
            overrides_map[key] = value

    try:
        response = service.create_batch(
            db,
            files=files,
            process_id=process_id,
            process_overrides=overrides_map,
            created_by=admin.username,
        )
    except BulkImportValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    background_tasks.add_task(service.process_batch, response.batch_id)
    return response


@router.get(
    "/results/batches/{batch_id}",
    response_model=BulkImportBatchStatusResponse,
    summary="Get bulk import batch status",
)
def get_results_batch_status(
    batch_id: int,
    db: Session = Depends(get_db_session),
    service: BulkImportService = Depends(get_bulk_import_service),
    _: AuthenticatedAdmin = Depends(get_current_admin),
) -> BulkImportBatchStatusResponse:
    try:
        return service.get_batch_status(db, batch_id)
    except BulkImportNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get(
    "/results/batches/{batch_id}/items",
    response_model=BulkImportBatchItemsResponse,
    summary="List bulk import batch items",
)
def list_results_batch_items(
    batch_id: int,
    db: Session = Depends(get_db_session),
    service: BulkImportService = Depends(get_bulk_import_service),
    _: AuthenticatedAdmin = Depends(get_current_admin),
) -> BulkImportBatchItemsResponse:
    try:
        return service.list_batch_items(db, batch_id)
    except BulkImportNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post(
    "/results/batches/{batch_id}/retry",
    response_model=BulkImportBatchStatusResponse,
    summary="Retry failed bulk import items",
)
def retry_results_batch_items(
    batch_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db_session),
    service: BulkImportService = Depends(get_bulk_import_service),
    _: AuthenticatedAdmin = Depends(get_current_admin),
) -> BulkImportBatchStatusResponse:
    try:
        status = service.retry_failed_items(db, batch_id)
    except BulkImportNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    background_tasks.add_task(service.process_batch, batch_id)
    return status


@router.post(
    "/results/batches/{batch_id}/cancel",
    response_model=BulkImportBatchStatusResponse,
    summary="Cancel queued bulk import items",
)
def cancel_results_batch_items(
    batch_id: int,
    db: Session = Depends(get_db_session),
    service: BulkImportService = Depends(get_bulk_import_service),
    _: AuthenticatedAdmin = Depends(get_current_admin),
) -> BulkImportBatchStatusResponse:
    try:
        return service.cancel_queued_items(db, batch_id)
    except BulkImportNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
