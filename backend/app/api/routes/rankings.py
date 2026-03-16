from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.schemas.rankings import MajorRankingsParams, MajorRankingsResponse, RankingMetric, RankingSortOrder
from app.services.rankings import RankingsService

router = APIRouter(prefix="/rankings", tags=["rankings"])


def get_rankings_service() -> RankingsService:
    return RankingsService()


def get_major_rankings_params(
    process_id: int = Query(...),
    metric: RankingMetric = Query(...),
    sort_order: RankingSortOrder = Query(default="desc"),
    academic_area_id: int | None = Query(default=None),
    faculty_id: int | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
) -> MajorRankingsParams:
    return MajorRankingsParams(
        process_id=process_id,
        metric=metric,
        sort_order=sort_order,
        academic_area_id=academic_area_id,
        faculty_id=faculty_id,
        limit=limit,
    )


@router.get("/majors", response_model=MajorRankingsResponse, summary="Rank majors by selected metric")
def list_major_rankings(
    params: MajorRankingsParams = Depends(get_major_rankings_params),
    db: Session = Depends(get_db_session),
    service: RankingsService = Depends(get_rankings_service),
) -> MajorRankingsResponse:
    return service.list_major_rankings(db, params)
