from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models.academic import AcademicArea, Faculty, Major
from app.models.admission import AdmissionProcess, AdmissionResult
from app.schemas.results import ResultsSearchParams


@dataclass(frozen=True)
class ResultSearchRow:
    id: int
    candidate_code: str
    candidate_lastnames: str
    candidate_names: str
    score: Decimal
    merit_rank: int | None
    observation_raw: str | None
    is_admitted: bool
    row_number: int | None
    process_id: int | None
    process_year: int | None
    process_cycle: str | None
    process_label: str | None
    major_id: int | None
    major_name: str | None
    major_slug: str | None
    faculty_id: int | None
    faculty_name: str | None
    faculty_slug: str | None
    academic_area_id: int | None
    academic_area_name: str | None
    academic_area_slug: str | None


class ResultsRepository:
    def search_results(self, db: Session, params: ResultsSearchParams) -> list[ResultSearchRow]:
        stmt = self._build_base_select().where(*self._build_filters(params))
        stmt = self._apply_sort(stmt, params)
        stmt = stmt.offset((params.page - 1) * params.page_size).limit(params.page_size)

        rows = db.execute(stmt).all()
        return [ResultSearchRow(**row._mapping) for row in rows]

    def count_results(self, db: Session, params: ResultsSearchParams) -> int:
        stmt = self._build_count_select().where(*self._build_filters(params))
        return int(db.scalar(stmt) or 0)

    def _build_base_select(self) -> Select:
        return (
            select(
                AdmissionResult.id.label("id"),
                AdmissionResult.candidate_code.label("candidate_code"),
                AdmissionResult.candidate_lastnames.label("candidate_lastnames"),
                AdmissionResult.candidate_names.label("candidate_names"),
                AdmissionResult.score.label("score"),
                AdmissionResult.merit_rank.label("merit_rank"),
                AdmissionResult.observation_raw.label("observation_raw"),
                AdmissionResult.is_admitted.label("is_admitted"),
                AdmissionResult.row_number.label("row_number"),
                AdmissionProcess.id.label("process_id"),
                AdmissionProcess.year.label("process_year"),
                AdmissionProcess.cycle.label("process_cycle"),
                AdmissionProcess.label.label("process_label"),
                Major.id.label("major_id"),
                Major.name.label("major_name"),
                Major.slug.label("major_slug"),
                Faculty.id.label("faculty_id"),
                Faculty.name.label("faculty_name"),
                Faculty.slug.label("faculty_slug"),
                AcademicArea.id.label("academic_area_id"),
                AcademicArea.name.label("academic_area_name"),
                AcademicArea.slug.label("academic_area_slug"),
            )
            .select_from(AdmissionResult)
            .outerjoin(AdmissionProcess, AdmissionProcess.id == AdmissionResult.admission_process_id)
            .outerjoin(Major, Major.id == AdmissionResult.major_id)
            .outerjoin(Faculty, Faculty.id == Major.faculty_id)
            .outerjoin(AcademicArea, AcademicArea.id == Faculty.academic_area_id)
        )

    def _build_count_select(self) -> Select:
        return (
            select(func.count(AdmissionResult.id))
            .select_from(AdmissionResult)
            .outerjoin(Major, Major.id == AdmissionResult.major_id)
            .outerjoin(Faculty, Faculty.id == Major.faculty_id)
            .outerjoin(AcademicArea, AcademicArea.id == Faculty.academic_area_id)
        )

    def _build_filters(self, params: ResultsSearchParams) -> list:
        filters = []
        if params.process_id is not None:
            filters.append(AdmissionResult.admission_process_id == params.process_id)
        if params.major_id is not None:
            filters.append(AdmissionResult.major_id == params.major_id)
        if params.faculty_id is not None:
            filters.append(Faculty.id == params.faculty_id)
        if params.academic_area_id is not None:
            filters.append(AcademicArea.id == params.academic_area_id)
        if params.candidate_code:
            filters.append(AdmissionResult.candidate_code == params.candidate_code)
        if params.candidate_name:
            normalized_candidate = func.lower(
                func.coalesce(AdmissionResult.candidate_lastnames, "") + " " + func.coalesce(AdmissionResult.candidate_names, "")
            )
            for token in params.candidate_name.lower().split():
                filters.append(normalized_candidate.like(f"%{token}%"))
        if params.score_min is not None:
            filters.append(AdmissionResult.score >= params.score_min)
        if params.score_max is not None:
            filters.append(AdmissionResult.score <= params.score_max)
        if params.is_admitted is not None:
            filters.append(AdmissionResult.is_admitted == params.is_admitted)
        return filters

    def _apply_sort(self, stmt: Select, params: ResultsSearchParams) -> Select:
        sort_map = {
            "score": AdmissionResult.score,
            "merit_rank": AdmissionResult.merit_rank,
            "candidate_lastnames": AdmissionResult.candidate_lastnames,
            "candidate_names": AdmissionResult.candidate_names,
        }
        sort_column = sort_map[params.sort_by]
        if params.sort_order == "asc":
            return stmt.order_by(sort_column.asc(), AdmissionResult.id.asc())
        return stmt.order_by(sort_column.desc(), AdmissionResult.id.desc())
