from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.schemas.processes import (
    AdmissionProcessDetailResponse,
    AdmissionProcessListItemResponse,
    AdmissionProcessOverviewResponse,
)
from app.services.processes import AdmissionProcessNotFoundError, ProcessesService

router = APIRouter(prefix="/processes", tags=["processes"])


def get_processes_service() -> ProcessesService:
    return ProcessesService()


@router.get("", response_model=list[AdmissionProcessListItemResponse], summary="List admission processes")
def list_processes(
    db: Session = Depends(get_db_session),
    service: ProcessesService = Depends(get_processes_service),
) -> list[AdmissionProcessListItemResponse]:
    return service.list_processes(db)


@router.get(
    "/{process_id}",
    response_model=AdmissionProcessDetailResponse,
    summary="Get admission process by ID",
)
def get_process(
    process_id: int,
    db: Session = Depends(get_db_session),
    service: ProcessesService = Depends(get_processes_service),
) -> AdmissionProcessDetailResponse:
    try:
        return service.get_process(db, process_id)
    except AdmissionProcessNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Admission process not found") from exc


@router.get(
    "/{process_id}/overview",
    response_model=AdmissionProcessOverviewResponse,
    summary="Get admission process overview",
)
def get_process_overview(
    process_id: int,
    db: Session = Depends(get_db_session),
    service: ProcessesService = Depends(get_processes_service),
) -> AdmissionProcessOverviewResponse:
    try:
        return service.get_process_overview(db, process_id)
    except AdmissionProcessNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Admission process not found") from exc
