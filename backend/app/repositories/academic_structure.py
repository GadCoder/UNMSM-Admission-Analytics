from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import Select, case, func, select
from sqlalchemy.orm import Session, joinedload

from app.models.admission import AdmissionResult
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
