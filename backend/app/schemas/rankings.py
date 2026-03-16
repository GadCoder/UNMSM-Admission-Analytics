from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.academic_structure import HierarchyContextResponse

RankingMetric = Literal["cutoff_score", "acceptance_rate", "applicants", "admitted"]
RankingSortOrder = Literal["asc", "desc"]


class MajorRankingsParams(BaseModel):
    process_id: int
    metric: RankingMetric
    sort_order: RankingSortOrder = "desc"
    academic_area_id: int | None = None
    faculty_id: int | None = None
    limit: int = Field(default=50, ge=1, le=100)


class MajorRankingItemResponse(BaseModel):
    rank: int
    major: HierarchyContextResponse
    faculty: HierarchyContextResponse
    academic_area: HierarchyContextResponse
    applicants: int
    admitted: int
    acceptance_rate: float | None
    cutoff_score: float | None


class MajorRankingsResponse(BaseModel):
    items: list[MajorRankingItemResponse]
