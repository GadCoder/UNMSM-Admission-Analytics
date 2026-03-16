from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import Select, case, func, select
from sqlalchemy.orm import Session

from app.models.academic import AcademicArea, Faculty, Major
from app.models.admission import AdmissionResult
from app.schemas.rankings import MajorRankingsParams


@dataclass(frozen=True)
class MajorRankingRow:
    major_id: int
    major_name: str
    major_slug: str
    faculty_id: int
    faculty_name: str
    faculty_slug: str
    academic_area_id: int
    academic_area_name: str
    academic_area_slug: str
    applicants: int
    admitted: int
    acceptance_rate: float | None
    cutoff_score: Decimal | None


class RankingsRepository:
    def list_major_rankings(self, db: Session, params: MajorRankingsParams) -> list[MajorRankingRow]:
        admitted_expr = func.coalesce(
            func.sum(
                case(
                    (AdmissionResult.is_admitted.is_(True), 1),
                    else_=0,
                )
            ),
            0,
        )
        applicants_expr = func.count(AdmissionResult.id)
        cutoff_expr = func.min(
            case(
                (AdmissionResult.is_admitted.is_(True), AdmissionResult.score),
                else_=None,
            )
        )
        acceptance_rate_expr = case(
            (applicants_expr == 0, None),
            else_=(admitted_expr * 1.0) / applicants_expr,
        )

        stmt: Select = (
            select(
                Major.id.label("major_id"),
                Major.name.label("major_name"),
                Major.slug.label("major_slug"),
                Faculty.id.label("faculty_id"),
                Faculty.name.label("faculty_name"),
                Faculty.slug.label("faculty_slug"),
                AcademicArea.id.label("academic_area_id"),
                AcademicArea.name.label("academic_area_name"),
                AcademicArea.slug.label("academic_area_slug"),
                applicants_expr.label("applicants"),
                admitted_expr.label("admitted"),
                acceptance_rate_expr.label("acceptance_rate"),
                cutoff_expr.label("cutoff_score"),
            )
            .select_from(AdmissionResult)
            .join(Major, Major.id == AdmissionResult.major_id)
            .join(Faculty, Faculty.id == Major.faculty_id)
            .join(AcademicArea, AcademicArea.id == Faculty.academic_area_id)
            .where(AdmissionResult.admission_process_id == params.process_id)
        )

        if params.academic_area_id is not None:
            stmt = stmt.where(AcademicArea.id == params.academic_area_id)
        if params.faculty_id is not None:
            stmt = stmt.where(Faculty.id == params.faculty_id)

        stmt = stmt.group_by(
            Major.id,
            Major.name,
            Major.slug,
            Faculty.id,
            Faculty.name,
            Faculty.slug,
            AcademicArea.id,
            AcademicArea.name,
            AcademicArea.slug,
        )

        metric_map = {
            "cutoff_score": cutoff_expr,
            "acceptance_rate": acceptance_rate_expr,
            "applicants": applicants_expr,
            "admitted": admitted_expr,
        }
        metric_expr = metric_map[params.metric]

        if params.sort_order == "asc":
            stmt = stmt.order_by(
                metric_expr.is_(None),
                metric_expr.asc(),
                Major.name.asc(),
                Major.id.asc(),
            )
        else:
            stmt = stmt.order_by(
                metric_expr.is_(None),
                metric_expr.desc(),
                Major.name.asc(),
                Major.id.asc(),
            )

        stmt = stmt.limit(params.limit)

        rows = db.execute(stmt).all()
        return [
            MajorRankingRow(
                major_id=row.major_id,
                major_name=row.major_name,
                major_slug=row.major_slug,
                faculty_id=row.faculty_id,
                faculty_name=row.faculty_name,
                faculty_slug=row.faculty_slug,
                academic_area_id=row.academic_area_id,
                academic_area_name=row.academic_area_name,
                academic_area_slug=row.academic_area_slug,
                applicants=int(row.applicants or 0),
                admitted=int(row.admitted or 0),
                acceptance_rate=float(row.acceptance_rate) if row.acceptance_rate is not None else None,
                cutoff_score=row.cutoff_score,
            )
            for row in rows
        ]
