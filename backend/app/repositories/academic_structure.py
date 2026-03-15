from sqlalchemy import Select, select
from sqlalchemy.orm import Session, joinedload

from app.models.academic import AcademicArea, Faculty, Major


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
