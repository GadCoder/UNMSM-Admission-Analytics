from __future__ import annotations

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.academic import AcademicArea, Faculty, Major
from app.models.admission import AdmissionProcess


class AdminRepository:
    def list_processes(self, db: Session) -> list[AdmissionProcess]:
        stmt: Select = select(AdmissionProcess).order_by(
            AdmissionProcess.year.desc(), AdmissionProcess.id.desc()
        )
        return list(db.scalars(stmt).all())

    def get_process(self, db: Session, process_id: int) -> AdmissionProcess | None:
        stmt = select(AdmissionProcess).where(AdmissionProcess.id == process_id)
        return db.scalar(stmt)

    def create_process(
        self,
        db: Session,
        *,
        year: int,
        cycle: str,
        label: str,
        is_published: bool,
    ) -> AdmissionProcess:
        process = AdmissionProcess(
            year=year,
            cycle=cycle,
            label=label,
            is_published=is_published,
        )
        db.add(process)
        db.flush()
        return process

    def update_process(
        self,
        db: Session,
        *,
        process: AdmissionProcess,
        year: int,
        cycle: str,
        label: str,
        is_published: bool,
    ) -> AdmissionProcess:
        process.year = year
        process.cycle = cycle
        process.label = label
        process.is_published = is_published
        db.flush()
        return process

    def list_areas(self, db: Session) -> list[AcademicArea]:
        stmt: Select = select(AcademicArea).order_by(AcademicArea.id.asc())
        return list(db.scalars(stmt).all())

    def get_area(self, db: Session, area_id: int) -> AcademicArea | None:
        stmt = select(AcademicArea).where(AcademicArea.id == area_id)
        return db.scalar(stmt)

    def create_area(self, db: Session, *, name: str, slug: str) -> AcademicArea:
        area = AcademicArea(name=name, slug=slug)
        db.add(area)
        db.flush()
        return area

    def update_area(
        self, db: Session, *, area: AcademicArea, name: str, slug: str
    ) -> AcademicArea:
        area.name = name
        area.slug = slug
        db.flush()
        return area

    def list_faculties(self, db: Session) -> list[Faculty]:
        stmt: Select = select(Faculty).order_by(Faculty.id.asc())
        return list(db.scalars(stmt).all())

    def get_faculty(self, db: Session, faculty_id: int) -> Faculty | None:
        stmt = select(Faculty).where(Faculty.id == faculty_id)
        return db.scalar(stmt)

    def create_faculty(
        self, db: Session, *, name: str, slug: str, academic_area_id: int
    ) -> Faculty:
        faculty = Faculty(name=name, slug=slug, academic_area_id=academic_area_id)
        db.add(faculty)
        db.flush()
        return faculty

    def update_faculty(
        self,
        db: Session,
        *,
        faculty: Faculty,
        name: str,
        slug: str,
        academic_area_id: int,
    ) -> Faculty:
        faculty.name = name
        faculty.slug = slug
        faculty.academic_area_id = academic_area_id
        db.flush()
        return faculty

    def list_majors(self, db: Session) -> list[Major]:
        stmt: Select = select(Major).order_by(Major.id.asc())
        return list(db.scalars(stmt).all())

    def get_major(self, db: Session, major_id: int) -> Major | None:
        stmt = select(Major).where(Major.id == major_id)
        return db.scalar(stmt)

    def create_major(
        self,
        db: Session,
        *,
        name: str,
        slug: str,
        faculty_id: int,
        is_active: bool,
    ) -> Major:
        major = Major(name=name, slug=slug, faculty_id=faculty_id, is_active=is_active)
        db.add(major)
        db.flush()
        return major

    def update_major(
        self,
        db: Session,
        *,
        major: Major,
        name: str,
        slug: str,
        faculty_id: int,
        is_active: bool,
    ) -> Major:
        major.name = name
        major.slug = slug
        major.faculty_id = faculty_id
        major.is_active = is_active
        db.flush()
        return major
