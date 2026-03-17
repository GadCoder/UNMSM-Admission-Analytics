from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import Select, case, func, select
from sqlalchemy.orm import Session, joinedload

from app.models.admission import AdmissionProcess, AdmissionResult
from app.models.academic import AcademicArea, Faculty, Major


@dataclass(frozen=True)
class MajorAnalyticsAggregation:
    applicants: int
    admitted: int
    acceptance_rate: float | None
    max_score: Decimal | None
    min_score: Decimal | None
    avg_score: float | None
    median_score: Decimal | None
    cutoff_score: Decimal | None


@dataclass(frozen=True)
class MajorTrendAggregation:
    process_id: int
    process_year: int
    process_cycle: str
    process_label: str
    applicants: int
    admitted: int
    acceptance_rate: float | None
    max_score: Decimal | None
    min_score: Decimal | None
    avg_score: float | None
    median_score: Decimal | float | None
    cutoff_score: Decimal | None


class AcademicStructureRepository:
    def list_areas(self, db: Session) -> list[AcademicArea]:
        stmt = select(AcademicArea).order_by(AcademicArea.id)
        return list(db.scalars(stmt).all())

    def get_area_by_id(self, db: Session, area_id: int) -> AcademicArea | None:
        stmt = select(AcademicArea).where(AcademicArea.id == area_id)
        return db.scalar(stmt)

    def list_faculties(self, db: Session, academic_area_id: int | None = None) -> list[Faculty]:
        stmt: Select[tuple[Faculty]] = (
            select(Faculty)
            .options(joinedload(Faculty.academic_area))
            .order_by(Faculty.id)
        )
        if academic_area_id is not None:
            stmt = stmt.where(Faculty.academic_area_id == academic_area_id)

        return list(db.scalars(stmt).all())

    def get_faculty_by_id(self, db: Session, faculty_id: int) -> Faculty | None:
        stmt = (
            select(Faculty)
            .options(joinedload(Faculty.academic_area))
            .where(Faculty.id == faculty_id)
        )
        return db.scalar(stmt)

    def list_majors(
        self,
        db: Session,
        faculty_id: int | None = None,
        academic_area_id: int | None = None,
    ) -> list[Major]:
        stmt: Select[tuple[Major]] = (
            select(Major)
            .join(Major.faculty)
            .join(Faculty.academic_area)
            .options(
                joinedload(Major.faculty).joinedload(Faculty.academic_area),
            )
            .order_by(Major.id)
        )

        if faculty_id is not None:
            stmt = stmt.where(Major.faculty_id == faculty_id)
        if academic_area_id is not None:
            stmt = stmt.where(Faculty.academic_area_id == academic_area_id)

        return list(db.scalars(stmt).all())

    def get_major_by_id(self, db: Session, major_id: int) -> Major | None:
        stmt = (
            select(Major)
            .join(Major.faculty)
            .join(Faculty.academic_area)
            .options(
                joinedload(Major.faculty).joinedload(Faculty.academic_area),
            )
            .where(Major.id == major_id)
        )
        return db.scalar(stmt)

    def get_major_with_hierarchy(self, db: Session, major_id: int) -> Major | None:
        return self.get_major_by_id(db, major_id)

    def get_major_analytics(
        self,
        db: Session,
        major_id: int,
        process_id: int | None = None,
    ) -> MajorAnalyticsAggregation:
        filters = [AdmissionResult.major_id == major_id]
        if process_id is not None:
            filters.append(AdmissionResult.admission_process_id == process_id)

        admitted_expr = func.sum(case((AdmissionResult.is_admitted.is_(True), 1), else_=0))
        cutoff_expr = func.min(case((AdmissionResult.is_admitted.is_(True), AdmissionResult.score), else_=None))
        stmt = select(
            func.count(AdmissionResult.id).label("applicants"),
            func.coalesce(admitted_expr, 0).label("admitted"),
            func.max(AdmissionResult.score).label("max_score"),
            func.min(AdmissionResult.score).label("min_score"),
            func.avg(AdmissionResult.score).label("avg_score"),
            cutoff_expr.label("cutoff_score"),
        ).where(*filters)
        row = db.execute(stmt).one()

        applicants = int(row.applicants or 0)
        admitted = int(row.admitted or 0)
        acceptance_rate = (admitted / applicants) if applicants > 0 else None

        median_score = None
        dialect = db.bind.dialect.name if db.bind is not None else ""
        if applicants > 0:
            if dialect == "postgresql":
                median_stmt = select(
                    func.percentile_cont(0.5).within_group(AdmissionResult.score).label("median_score")
                ).where(*filters)
                median_score = db.scalar(median_stmt)
            else:
                scores_stmt = select(AdmissionResult.score).where(*filters).order_by(AdmissionResult.score.asc())
                scores = [score for score in db.scalars(scores_stmt).all() if score is not None]
                count = len(scores)
                if count > 0:
                    mid = count // 2
                    if count % 2 == 1:
                        median_score = scores[mid]
                    else:
                        median_score = (scores[mid - 1] + scores[mid]) / 2

        return MajorAnalyticsAggregation(
            applicants=applicants,
            admitted=admitted,
            acceptance_rate=acceptance_rate,
            max_score=row.max_score,
            min_score=row.min_score,
            avg_score=float(row.avg_score) if row.avg_score is not None else None,
            median_score=median_score,
            cutoff_score=row.cutoff_score,
        )

    def list_major_trends(
        self,
        db: Session,
        major_id: int,
    ) -> list[MajorTrendAggregation]:
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
        acceptance_rate_expr = case(
            (applicants_expr == 0, None),
            else_=(admitted_expr * 1.0) / applicants_expr,
        )
        cutoff_expr = func.min(
            case(
                (AdmissionResult.is_admitted.is_(True), AdmissionResult.score),
                else_=None,
            )
        )

        dialect = db.bind.dialect.name if db.bind is not None else ""
        if dialect == "postgresql":
            median_expr = func.percentile_cont(0.5).within_group(AdmissionResult.score)
        else:
            median_expr = None

        select_columns = [
            AdmissionProcess.id.label("process_id"),
            AdmissionProcess.year.label("process_year"),
            AdmissionProcess.cycle.label("process_cycle"),
            AdmissionProcess.label.label("process_label"),
            applicants_expr.label("applicants"),
            admitted_expr.label("admitted"),
            acceptance_rate_expr.label("acceptance_rate"),
            func.max(AdmissionResult.score).label("max_score"),
            func.min(AdmissionResult.score).label("min_score"),
            func.avg(AdmissionResult.score).label("avg_score"),
            cutoff_expr.label("cutoff_score"),
        ]
        if median_expr is not None:
            select_columns.append(median_expr.label("median_score"))

        stmt = (
            select(*select_columns)
            .select_from(AdmissionResult)
            .join(
                AdmissionProcess,
                AdmissionProcess.id == AdmissionResult.admission_process_id,
            )
            .where(AdmissionResult.major_id == major_id)
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

        median_by_process: dict[int, Decimal | float | None] = {}
        if dialect != "postgresql":
            scores_stmt = (
                select(
                    AdmissionResult.admission_process_id,
                    AdmissionResult.score,
                )
                .where(AdmissionResult.major_id == major_id)
                .order_by(
                    AdmissionResult.admission_process_id.asc(),
                    AdmissionResult.score.asc(),
                )
            )
            scores_by_process: dict[int, list[Decimal]] = {}
            for process_id, score in db.execute(scores_stmt).all():
                if score is None:
                    continue
                scores_by_process.setdefault(process_id, []).append(score)

            for process_id, scores in scores_by_process.items():
                count = len(scores)
                if count == 0:
                    median_by_process[process_id] = None
                    continue
                mid = count // 2
                if count % 2 == 1:
                    median_by_process[process_id] = scores[mid]
                else:
                    median_by_process[process_id] = (scores[mid - 1] + scores[mid]) / 2

        trends: list[MajorTrendAggregation] = []
        for row in rows:
            if dialect == "postgresql":
                median_score = row.median_score
            else:
                median_score = median_by_process.get(int(row.process_id))

            trends.append(
                MajorTrendAggregation(
                    process_id=int(row.process_id),
                    process_year=int(row.process_year),
                    process_cycle=row.process_cycle,
                    process_label=row.process_label,
                    applicants=int(row.applicants or 0),
                    admitted=int(row.admitted or 0),
                    acceptance_rate=float(row.acceptance_rate) if row.acceptance_rate is not None else None,
                    max_score=row.max_score,
                    min_score=row.min_score,
                    avg_score=float(row.avg_score) if row.avg_score is not None else None,
                    median_score=median_score,
                    cutoff_score=row.cutoff_score,
                )
            )

        return trends
