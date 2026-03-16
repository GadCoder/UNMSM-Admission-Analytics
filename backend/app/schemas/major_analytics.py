from __future__ import annotations

from pydantic import BaseModel

from app.schemas.academic_structure import HierarchyContextResponse


class MajorAnalyticsMetricsResponse(BaseModel):
    applicants: int
    admitted: int
    acceptance_rate: float | None
    max_score: float | None
    min_score: float | None
    avg_score: float | None
    median_score: float | None
    cutoff_score: float | None


class MajorAnalyticsFiltersResponse(BaseModel):
    process_id: int | None


class MajorAnalyticsMajorResponse(BaseModel):
    id: int
    name: str
    slug: str
    faculty: HierarchyContextResponse
    academic_area: HierarchyContextResponse


class MajorAnalyticsResponse(BaseModel):
    major: MajorAnalyticsMajorResponse
    filters: MajorAnalyticsFiltersResponse
    metrics: MajorAnalyticsMetricsResponse
