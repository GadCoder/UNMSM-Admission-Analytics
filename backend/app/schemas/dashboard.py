from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.academic_structure import HierarchyContextResponse
from app.schemas.processes import AdmissionProcessDetailResponse


class DashboardScopedParams(BaseModel):
    process_id: int
    academic_area_id: int | None = None
    faculty_id: int | None = None


class DashboardRankingsParams(DashboardScopedParams):
    limit: int = Field(default=10, ge=1, le=100)


class DashboardTrendParams(BaseModel):
    academic_area_id: int | None = None
    faculty_id: int | None = None


class DashboardAppliedFiltersResponse(BaseModel):
    process_id: int | None = None
    academic_area_id: int | None = None
    faculty_id: int | None = None
    limit: int | None = None


class DashboardOverviewMetricsResponse(BaseModel):
    total_applicants: int
    total_admitted: int
    acceptance_rate: float
    total_majors: int


class DashboardOverviewResponse(BaseModel):
    filters: DashboardAppliedFiltersResponse
    metrics: DashboardOverviewMetricsResponse


class DashboardRankingItemResponse(BaseModel):
    rank: int
    major: HierarchyContextResponse
    faculty: HierarchyContextResponse
    academic_area: HierarchyContextResponse
    applicants: int
    admitted: int
    acceptance_rate: float | None
    cutoff_score: float | None


class DashboardRankingsResponse(BaseModel):
    filters: DashboardAppliedFiltersResponse
    most_competitive: list[DashboardRankingItemResponse]
    most_popular: list[DashboardRankingItemResponse]


class DashboardApplicantsTrendItemResponse(BaseModel):
    process: AdmissionProcessDetailResponse
    applicants: int


class DashboardApplicantsTrendResponse(BaseModel):
    filters: DashboardAppliedFiltersResponse
    items: list[DashboardApplicantsTrendItemResponse]


class DashboardCutoffTrendItemResponse(BaseModel):
    process: AdmissionProcessDetailResponse
    avg_cutoff_score: float | None


class DashboardCutoffTrendResponse(BaseModel):
    filters: DashboardAppliedFiltersResponse
    items: list[DashboardCutoffTrendItemResponse]
