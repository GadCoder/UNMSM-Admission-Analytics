from __future__ import annotations

from math import ceil

from sqlalchemy.orm import Session

from app.repositories.results import ResultSearchRow, ResultsRepository
from app.schemas.results import (
    PaginatedResultsResponse,
    ResultAcademicAreaContextResponse,
    ResultFacultyContextResponse,
    ResultItemResponse,
    ResultMajorContextResponse,
    ResultProcessContextResponse,
    ResultsSearchParams,
)


class ResultsService:
    def __init__(self, repository: ResultsRepository | None = None) -> None:
        self.repository = repository or ResultsRepository()

    def search_results(self, db: Session, params: ResultsSearchParams) -> PaginatedResultsResponse:
        rows = self.repository.search_results(db, params)
        total = self.repository.count_results(db, params)
        total_pages = ceil(total / params.page_size) if total > 0 else 0

        return PaginatedResultsResponse(
            items=[self._to_item_response(row) for row in rows],
            total=total,
            page=params.page,
            page_size=params.page_size,
            total_pages=total_pages,
        )

    def _to_item_response(self, row: ResultSearchRow) -> ResultItemResponse:
        process = None
        if row.process_id is not None:
            process = ResultProcessContextResponse(
                id=row.process_id,
                year=row.process_year,
                cycle=row.process_cycle,
                label=row.process_label,
            )

        major = None
        if row.major_id is not None:
            major = ResultMajorContextResponse(
                id=row.major_id,
                name=row.major_name,
                slug=row.major_slug,
            )

        faculty = None
        if row.faculty_id is not None:
            faculty = ResultFacultyContextResponse(
                id=row.faculty_id,
                name=row.faculty_name,
                slug=row.faculty_slug,
            )

        academic_area = None
        if row.academic_area_id is not None:
            academic_area = ResultAcademicAreaContextResponse(
                id=row.academic_area_id,
                name=row.academic_area_name,
                slug=row.academic_area_slug,
            )

        return ResultItemResponse(
            id=row.id,
            candidate_code=row.candidate_code,
            candidate_lastnames=row.candidate_lastnames,
            candidate_names=row.candidate_names,
            score=float(row.score),
            merit_rank=row.merit_rank,
            observation_raw=row.observation_raw,
            is_admitted=row.is_admitted,
            row_number=row.row_number,
            process=process,
            major=major,
            faculty=faculty,
            academic_area=academic_area,
        )
