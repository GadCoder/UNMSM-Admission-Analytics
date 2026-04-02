from __future__ import annotations

from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

SortBy = Literal["score", "merit_rank", "candidate_lastnames", "candidate_names"]
SortOrder = Literal["asc", "desc"]


class ResultProcessContextResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    year: int
    cycle: str
    label: str


class ResultMajorContextResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str


class ResultFacultyContextResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str


class ResultAcademicAreaContextResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str


class ResultItemResponse(BaseModel):
    id: int
    candidate_code: str
    candidate_lastnames: str
    candidate_names: str
    score: float
    merit_rank: int | None
    observation_raw: str | None
    is_admitted: bool
    row_number: int | None
    process: ResultProcessContextResponse | None
    major: ResultMajorContextResponse | None
    faculty: ResultFacultyContextResponse | None
    academic_area: ResultAcademicAreaContextResponse | None


class PaginatedResultsResponse(BaseModel):
    items: list[ResultItemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ResultsSearchParams(BaseModel):
    process_id: int | None = None
    major_id: int | None = None
    faculty_id: int | None = None
    academic_area_id: int | None = None
    candidate_code: str | None = None
    candidate_name: str | None = None
    score_min: Decimal | None = None
    score_max: Decimal | None = None
    is_admitted: bool | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=100)
    sort_by: SortBy = "score"
    sort_order: SortOrder = "desc"

    @model_validator(mode="after")
    def validate_score_range(self) -> ResultsSearchParams:
        if self.score_min is not None and self.score_max is not None and self.score_min > self.score_max:
            raise ValueError("score_min must be less than or equal to score_max")

        if self.candidate_code is not None:
            self.candidate_code = self.candidate_code.strip() or None
        if self.candidate_name is not None:
            self.candidate_name = self.candidate_name.strip() or None

        return self
