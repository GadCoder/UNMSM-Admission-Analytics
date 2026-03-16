from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.schemas.results import PaginatedResultsResponse, ResultsSearchParams, SortBy, SortOrder
from app.services.results import ResultsService

router = APIRouter(prefix="/results", tags=["results"])


def get_results_service() -> ResultsService:
    return ResultsService()


def get_results_search_params(
    process_id: int | None = Query(default=None),
    major_id: int | None = Query(default=None),
    faculty_id: int | None = Query(default=None),
    academic_area_id: int | None = Query(default=None),
    candidate_code: str | None = Query(default=None),
    candidate_name: str | None = Query(default=None),
    score_min: Decimal | None = Query(default=None),
    score_max: Decimal | None = Query(default=None),
    is_admitted: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    sort_by: SortBy = Query(default="score"),
    sort_order: SortOrder = Query(default="desc"),
) -> ResultsSearchParams:
    return ResultsSearchParams(
        process_id=process_id,
        major_id=major_id,
        faculty_id=faculty_id,
        academic_area_id=academic_area_id,
        candidate_code=candidate_code,
        candidate_name=candidate_name,
        score_min=score_min,
        score_max=score_max,
        is_admitted=is_admitted,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("", response_model=PaginatedResultsResponse, summary="Search admission results")
def search_results(
    params: ResultsSearchParams = Depends(get_results_search_params),
    db: Session = Depends(get_db_session),
    service: ResultsService = Depends(get_results_service),
) -> PaginatedResultsResponse:
    return service.search_results(db, params)
