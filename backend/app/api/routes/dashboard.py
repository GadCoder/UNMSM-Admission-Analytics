from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.schemas.dashboard import (
    DashboardApplicantsTrendResponse,
    DashboardCutoffTrendResponse,
    DashboardOverviewResponse,
    DashboardRankingsParams,
    DashboardRankingsResponse,
    DashboardScopedParams,
    DashboardTrendParams,
)
from app.services.dashboard import (
    DashboardAcademicAreaNotFoundError,
    DashboardFacultyNotFoundError,
    DashboardHierarchyMismatchError,
    DashboardProcessNotFoundError,
    DashboardService,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def get_dashboard_service() -> DashboardService:
    return DashboardService()


def get_dashboard_scoped_params(
    process_id: int = Query(...),
    academic_area_id: int | None = Query(default=None),
    faculty_id: int | None = Query(default=None),
) -> DashboardScopedParams:
    return DashboardScopedParams(
        process_id=process_id,
        academic_area_id=academic_area_id,
        faculty_id=faculty_id,
    )


def get_dashboard_rankings_params(
    process_id: int = Query(...),
    academic_area_id: int | None = Query(default=None),
    faculty_id: int | None = Query(default=None),
    limit: int = Query(default=10, ge=1, le=100),
) -> DashboardRankingsParams:
    return DashboardRankingsParams(
        process_id=process_id,
        academic_area_id=academic_area_id,
        faculty_id=faculty_id,
        limit=limit,
    )


def get_dashboard_trend_params(
    academic_area_id: int | None = Query(default=None),
    faculty_id: int | None = Query(default=None),
) -> DashboardTrendParams:
    return DashboardTrendParams(
        academic_area_id=academic_area_id,
        faculty_id=faculty_id,
    )


@router.get("/overview", response_model=DashboardOverviewResponse, summary="Get dashboard KPI overview")
def get_dashboard_overview(
    params: DashboardScopedParams = Depends(get_dashboard_scoped_params),
    db: Session = Depends(get_db_session),
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardOverviewResponse:
    try:
        return service.get_overview(db, params=params)
    except DashboardProcessNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Admission process not found") from exc
    except DashboardAcademicAreaNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Academic area not found") from exc
    except DashboardFacultyNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Faculty not found") from exc
    except DashboardHierarchyMismatchError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/rankings", response_model=DashboardRankingsResponse, summary="Get dashboard rankings")
def get_dashboard_rankings(
    params: DashboardRankingsParams = Depends(get_dashboard_rankings_params),
    db: Session = Depends(get_db_session),
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardRankingsResponse:
    try:
        return service.get_rankings(db, params=params)
    except DashboardProcessNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Admission process not found") from exc
    except DashboardAcademicAreaNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Academic area not found") from exc
    except DashboardFacultyNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Faculty not found") from exc
    except DashboardHierarchyMismatchError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get(
    "/trends/applicants",
    response_model=DashboardApplicantsTrendResponse,
    summary="Get dashboard applicants trend",
)
def get_dashboard_applicants_trend(
    params: DashboardTrendParams = Depends(get_dashboard_trend_params),
    db: Session = Depends(get_db_session),
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardApplicantsTrendResponse:
    try:
        return service.get_applicants_trend(db, params=params)
    except DashboardAcademicAreaNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Academic area not found") from exc
    except DashboardFacultyNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Faculty not found") from exc
    except DashboardHierarchyMismatchError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/trends/cutoff", response_model=DashboardCutoffTrendResponse, summary="Get dashboard cutoff trend")
def get_dashboard_cutoff_trend(
    params: DashboardTrendParams = Depends(get_dashboard_trend_params),
    db: Session = Depends(get_db_session),
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardCutoffTrendResponse:
    try:
        return service.get_cutoff_trend(db, params=params)
    except DashboardAcademicAreaNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Academic area not found") from exc
    except DashboardFacultyNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Faculty not found") from exc
    except DashboardHierarchyMismatchError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
