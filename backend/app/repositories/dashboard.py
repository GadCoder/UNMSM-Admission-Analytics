from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import Select, case, func, select
from sqlalchemy.orm import Session

from app.models.academic import AcademicArea, Faculty, Major
from app.models.admission import AdmissionProcess, AdmissionResult
from app.schemas.dashboard import DashboardScopedParams, DashboardTrendParams


@dataclass(frozen=True)
class DashboardOverviewAggregation:
    total_applicants: int
    total_admitted: int
    acceptance_rate: float
    total_majors: int


@dataclass(frozen=True)
class DashboardRankingRow:
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


@dataclass(frozen=True)
class DashboardApplicantsTrendRow:
    process_id: int
    process_year: int
    process_cycle: str
    process_label: str
    applicants: int


@dataclass(frozen=True)
class DashboardCutoffTrendRow:
    process_id: int
    process_year: int
    process_cycle: str
    process_label: str
    avg_cutoff_score: float | None


class DashboardRepository:
    def get_process_by_id(
        self, db: Session, process_id: int
    ) -> AdmissionProcess | None:
        stmt = select(AdmissionProcess).where(AdmissionProcess.id == process_id)
        return db.scalar(stmt)

    def get_academic_area_by_id(self, db: Session, area_id: int) -> AcademicArea | None:
        stmt = select(AcademicArea).where(AcademicArea.id == area_id)
        return db.scalar(stmt)

    def get_faculty_by_id(self, db: Session, faculty_id: int) -> Faculty | None:
        stmt = select(Faculty).where(Faculty.id == faculty_id)
        return db.scalar(stmt)

    def get_overview(
        self, db: Session, params: DashboardScopedParams
    ) -> DashboardOverviewAggregation:
        admitted_expr = func.coalesce(
            func.sum(case((AdmissionResult.is_admitted.is_(True), 1), else_=0)),
            0,
        )
        applicants_expr = func.count(AdmissionResult.id)
        total_majors_expr = func.count(func.distinct(AdmissionResult.major_id))
        acceptance_rate_expr = case(
            (applicants_expr == 0, 0.0),
            else_=(admitted_expr * 1.0) / applicants_expr,
        )

        stmt: Select = (
            select(
                applicants_expr.label("total_applicants"),
                admitted_expr.label("total_admitted"),
                acceptance_rate_expr.label("acceptance_rate"),
                total_majors_expr.label("total_majors"),
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

        row = db.execute(stmt).one()
        return DashboardOverviewAggregation(
            total_applicants=int(row.total_applicants or 0),
            total_admitted=int(row.total_admitted or 0),
            acceptance_rate=float(row.acceptance_rate or 0.0),
            total_majors=int(row.total_majors or 0),
        )

    def list_rankings_by_cutoff(
        self, db: Session, params: DashboardScopedParams, limit: int | None
    ) -> list[DashboardRankingRow]:
        return self._list_rankings(
            db, params=params, limit=limit, order_metric="cutoff_score"
        )

    def list_rankings_by_applicants(
        self, db: Session, params: DashboardScopedParams, limit: int | None
    ) -> list[DashboardRankingRow]:
        return self._list_rankings(
            db, params=params, limit=limit, order_metric="applicants"
        )

    def _list_rankings(
        self,
        db: Session,
        params: DashboardScopedParams,
        limit: int | None,
        order_metric: str,
    ) -> list[DashboardRankingRow]:
        admitted_expr = func.coalesce(
            func.sum(case((AdmissionResult.is_admitted.is_(True), 1), else_=0)),
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

        if order_metric == "cutoff_score":
            stmt = stmt.order_by(
                cutoff_expr.is_(None),
                cutoff_expr.desc(),
                Major.name.asc(),
                Major.id.asc(),
            )
        else:
            stmt = stmt.order_by(
                applicants_expr.desc(), Major.name.asc(), Major.id.asc()
            )

        if limit is not None:
            stmt = stmt.limit(limit)

        rows = db.execute(stmt).all()
        return [
            DashboardRankingRow(
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
                acceptance_rate=float(row.acceptance_rate)
                if row.acceptance_rate is not None
                else None,
                cutoff_score=row.cutoff_score,
            )
            for row in rows
        ]

    def list_applicants_trend(
        self, db: Session, params: DashboardTrendParams
    ) -> list[DashboardApplicantsTrendRow]:
        applicants_expr = func.count(AdmissionResult.id)

        stmt: Select = (
            select(
                AdmissionProcess.id.label("process_id"),
                AdmissionProcess.year.label("process_year"),
                AdmissionProcess.cycle.label("process_cycle"),
                AdmissionProcess.label.label("process_label"),
                applicants_expr.label("applicants"),
            )
            .select_from(AdmissionResult)
            .join(
                AdmissionProcess,
                AdmissionProcess.id == AdmissionResult.admission_process_id,
            )
            .join(Major, Major.id == AdmissionResult.major_id)
            .join(Faculty, Faculty.id == Major.faculty_id)
            .join(AcademicArea, AcademicArea.id == Faculty.academic_area_id)
        )

        if params.academic_area_id is not None:
            stmt = stmt.where(AcademicArea.id == params.academic_area_id)
        if params.faculty_id is not None:
            stmt = stmt.where(Faculty.id == params.faculty_id)

        stmt = stmt.group_by(
            AdmissionProcess.id,
            AdmissionProcess.year,
            AdmissionProcess.cycle,
            AdmissionProcess.label,
        ).order_by(
            AdmissionProcess.year.asc(),
            AdmissionProcess.cycle.asc(),
            AdmissionProcess.id.asc(),
        )

        rows = db.execute(stmt).all()
        return [
            DashboardApplicantsTrendRow(
                process_id=int(row.process_id),
                process_year=int(row.process_year),
                process_cycle=row.process_cycle,
                process_label=row.process_label,
                applicants=int(row.applicants or 0),
            )
            for row in rows
        ]

    def list_cutoff_trend(
        self, db: Session, params: DashboardTrendParams
    ) -> list[DashboardCutoffTrendRow]:
        major_cutoff_expr = func.min(
            case(
                (AdmissionResult.is_admitted.is_(True), AdmissionResult.score),
                else_=None,
            )
        )
        per_major_stmt: Select = (
            select(
                AdmissionResult.admission_process_id.label("process_id"),
                AdmissionResult.major_id.label("major_id"),
                major_cutoff_expr.label("major_cutoff"),
            )
            .select_from(AdmissionResult)
            .join(Major, Major.id == AdmissionResult.major_id)
            .join(Faculty, Faculty.id == Major.faculty_id)
            .join(AcademicArea, AcademicArea.id == Faculty.academic_area_id)
        )

        if params.academic_area_id is not None:
            per_major_stmt = per_major_stmt.where(
                AcademicArea.id == params.academic_area_id
            )
        if params.faculty_id is not None:
            per_major_stmt = per_major_stmt.where(Faculty.id == params.faculty_id)

        per_major_stmt = per_major_stmt.group_by(
            AdmissionResult.admission_process_id,
            AdmissionResult.major_id,
        )

        per_major_subquery = per_major_stmt.subquery()
        avg_cutoff_expr = func.avg(per_major_subquery.c.major_cutoff)

        stmt = (
            select(
                AdmissionProcess.id.label("process_id"),
                AdmissionProcess.year.label("process_year"),
                AdmissionProcess.cycle.label("process_cycle"),
                AdmissionProcess.label.label("process_label"),
                avg_cutoff_expr.label("avg_cutoff_score"),
            )
            .join(
                AdmissionProcess, AdmissionProcess.id == per_major_subquery.c.process_id
            )
            .group_by(
                AdmissionProcess.id,
                AdmissionProcess.year,
                AdmissionProcess.cycle,
                AdmissionProcess.label,
            )
            .order_by(
                AdmissionProcess.year.asc(),
                AdmissionProcess.cycle.asc(),
                AdmissionProcess.id.asc(),
            )
        )

        rows = db.execute(stmt).all()
        return [
            DashboardCutoffTrendRow(
                process_id=int(row.process_id),
                process_year=int(row.process_year),
                process_cycle=row.process_cycle,
                process_label=row.process_label,
                avg_cutoff_score=float(row.avg_cutoff_score)
                if row.avg_cutoff_score is not None
                else None,
            )
            for row in rows
        ]
