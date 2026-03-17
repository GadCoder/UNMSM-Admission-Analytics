from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from app.schemas.academic_structure import HierarchyContextResponse

TrendMetricName = Literal[
    "applicants",
    "admitted",
    "acceptance_rate",
    "max_score",
    "min_score",
    "avg_score",
    "median_score",
    "cutoff_score",
]

SUPPORTED_TREND_METRICS: tuple[TrendMetricName, ...] = (
    "applicants",
    "admitted",
    "acceptance_rate",
    "max_score",
    "min_score",
    "avg_score",
    "median_score",
    "cutoff_score",
)


class MajorTrendsProcessResponse(BaseModel):
    id: int
    year: int
    cycle: str
    label: str


class MajorTrendsMajorResponse(BaseModel):
    id: int
    name: str
    slug: str
    faculty: HierarchyContextResponse
    academic_area: HierarchyContextResponse


class MajorTrendsHistoryItemResponse(BaseModel):
    process: MajorTrendsProcessResponse
    metrics: dict[TrendMetricName, float | int | None]


class MajorTrendsResponse(BaseModel):
    major: MajorTrendsMajorResponse
    metrics: list[TrendMetricName]
    history: list[MajorTrendsHistoryItemResponse]
