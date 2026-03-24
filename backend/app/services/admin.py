from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.repositories.admin import AdminRepository
from app.schemas.admin import (
    AdminAdmissionProcessResponse,
    AdminAcademicAreaResponse,
    AdminFacultyResponse,
    AdminMajorResponse,
)


class AdminResourceNotFoundError(ValueError):
    pass


class AdminConflictError(ValueError):
    pass


class AdminValidationError(ValueError):
    pass


class AdminService:
    def __init__(self, repository: AdminRepository | None = None) -> None:
        self.repository = repository or AdminRepository()

    def list_areas(self, db: Session) -> list[AdminAcademicAreaResponse]:
        return [
            self._to_area_response(entity) for entity in self.repository.list_areas(db)
        ]

    def list_processes(self, db: Session) -> list[AdminAdmissionProcessResponse]:
        return [
            self._to_process_response(entity)
            for entity in self.repository.list_processes(db)
        ]

    def create_process(
        self,
        db: Session,
        *,
        year: int,
        cycle: str,
        is_published: bool,
    ) -> AdminAdmissionProcessResponse:
        normalized_cycle = self._normalize_cycle(cycle)
        label = self._build_process_label(year, normalized_cycle)
        try:
            process = self.repository.create_process(
                db,
                year=year,
                cycle=normalized_cycle,
                label=label,
                is_published=is_published,
            )
            db.commit()
            db.refresh(process)
        except IntegrityError as exc:
            db.rollback()
            raise AdminValidationError(
                "Process label or year-cycle combination already exists"
            ) from exc
        return self._to_process_response(process)

    def update_process(
        self,
        db: Session,
        *,
        process_id: int,
        year: int,
        cycle: str,
        is_published: bool,
        version_token: datetime,
    ) -> AdminAdmissionProcessResponse:
        process = self.repository.get_process(db, process_id)
        if process is None:
            raise AdminResourceNotFoundError("Admission process not found")
        if not self._version_matches(process.updated_at, version_token):
            raise AdminConflictError("Process has been modified by another operation")

        normalized_cycle = self._normalize_cycle(cycle)
        label = self._build_process_label(year, normalized_cycle)

        try:
            process = self.repository.update_process(
                db,
                process=process,
                year=year,
                cycle=normalized_cycle,
                label=label,
                is_published=is_published,
            )
            db.commit()
            db.refresh(process)
        except IntegrityError as exc:
            db.rollback()
            raise AdminValidationError(
                "Process label or year-cycle combination already exists"
            ) from exc
        return self._to_process_response(process)

    def create_area(
        self, db: Session, *, name: str, slug: str
    ) -> AdminAcademicAreaResponse:
        try:
            area = self.repository.create_area(db, name=name.strip(), slug=slug.strip())
            db.commit()
            db.refresh(area)
        except IntegrityError as exc:
            db.rollback()
            raise AdminValidationError("Area name or slug already exists") from exc
        return self._to_area_response(area)

    def update_area(
        self,
        db: Session,
        *,
        area_id: int,
        name: str,
        slug: str,
        version_token: datetime,
    ) -> AdminAcademicAreaResponse:
        area = self.repository.get_area(db, area_id)
        if area is None:
            raise AdminResourceNotFoundError("Academic area not found")
        if not self._version_matches(area.updated_at, version_token):
            raise AdminConflictError("Area has been modified by another operation")

        try:
            area = self.repository.update_area(
                db, area=area, name=name.strip(), slug=slug.strip()
            )
            db.commit()
            db.refresh(area)
        except IntegrityError as exc:
            db.rollback()
            raise AdminValidationError("Area name or slug already exists") from exc
        return self._to_area_response(area)

    def list_faculties(self, db: Session) -> list[AdminFacultyResponse]:
        return [
            self._to_faculty_response(entity)
            for entity in self.repository.list_faculties(db)
        ]

    def create_faculty(
        self, db: Session, *, name: str, slug: str, academic_area_id: int
    ) -> AdminFacultyResponse:
        if self.repository.get_area(db, academic_area_id) is None:
            raise AdminResourceNotFoundError("Academic area not found")
        try:
            faculty = self.repository.create_faculty(
                db,
                name=name.strip(),
                slug=slug.strip(),
                academic_area_id=academic_area_id,
            )
            db.commit()
            db.refresh(faculty)
        except IntegrityError as exc:
            db.rollback()
            raise AdminValidationError("Faculty name or slug already exists") from exc
        return self._to_faculty_response(faculty)

    def update_faculty(
        self,
        db: Session,
        *,
        faculty_id: int,
        name: str,
        slug: str,
        academic_area_id: int,
        version_token: datetime,
    ) -> AdminFacultyResponse:
        faculty = self.repository.get_faculty(db, faculty_id)
        if faculty is None:
            raise AdminResourceNotFoundError("Faculty not found")
        if self.repository.get_area(db, academic_area_id) is None:
            raise AdminResourceNotFoundError("Academic area not found")
        if not self._version_matches(faculty.updated_at, version_token):
            raise AdminConflictError("Faculty has been modified by another operation")

        try:
            faculty = self.repository.update_faculty(
                db,
                faculty=faculty,
                name=name.strip(),
                slug=slug.strip(),
                academic_area_id=academic_area_id,
            )
            db.commit()
            db.refresh(faculty)
        except IntegrityError as exc:
            db.rollback()
            raise AdminValidationError("Faculty name or slug already exists") from exc
        return self._to_faculty_response(faculty)

    def list_majors(self, db: Session) -> list[AdminMajorResponse]:
        return [
            self._to_major_response(entity)
            for entity in self.repository.list_majors(db)
        ]

    def create_major(
        self,
        db: Session,
        *,
        name: str,
        slug: str,
        faculty_id: int,
        is_active: bool,
    ) -> AdminMajorResponse:
        if self.repository.get_faculty(db, faculty_id) is None:
            raise AdminResourceNotFoundError("Faculty not found")
        try:
            major = self.repository.create_major(
                db,
                name=name.strip(),
                slug=slug.strip(),
                faculty_id=faculty_id,
                is_active=is_active,
            )
            db.commit()
            db.refresh(major)
        except IntegrityError as exc:
            db.rollback()
            raise AdminValidationError("Major name or slug already exists") from exc
        return self._to_major_response(major)

    def update_major(
        self,
        db: Session,
        *,
        major_id: int,
        name: str,
        slug: str,
        faculty_id: int,
        is_active: bool,
        version_token: datetime,
    ) -> AdminMajorResponse:
        major = self.repository.get_major(db, major_id)
        if major is None:
            raise AdminResourceNotFoundError("Major not found")
        if self.repository.get_faculty(db, faculty_id) is None:
            raise AdminResourceNotFoundError("Faculty not found")
        if not self._version_matches(major.updated_at, version_token):
            raise AdminConflictError("Major has been modified by another operation")

        try:
            major = self.repository.update_major(
                db,
                major=major,
                name=name.strip(),
                slug=slug.strip(),
                faculty_id=faculty_id,
                is_active=is_active,
            )
            db.commit()
            db.refresh(major)
        except IntegrityError as exc:
            db.rollback()
            raise AdminValidationError("Major name or slug already exists") from exc
        return self._to_major_response(major)

    def _version_matches(self, current: datetime, token: datetime) -> bool:
        current_dt = (
            current.astimezone(UTC) if current.tzinfo else current.replace(tzinfo=UTC)
        )
        token_dt = token.astimezone(UTC) if token.tzinfo else token.replace(tzinfo=UTC)
        return int(current_dt.timestamp()) == int(token_dt.timestamp())

    def _normalize_cycle(self, cycle: str) -> str:
        normalized_cycle = cycle.strip().upper()
        if normalized_cycle not in {"I", "II"}:
            raise AdminValidationError("Process cycle must be I or II")
        return normalized_cycle

    def _build_process_label(self, year: int, cycle: str) -> str:
        return f"{year}-{cycle}"

    def _to_area_response(self, area) -> AdminAcademicAreaResponse:
        return AdminAcademicAreaResponse(
            id=area.id,
            name=area.name,
            slug=area.slug,
            updated_at=area.updated_at,
        )

    def _to_process_response(self, process) -> AdminAdmissionProcessResponse:
        return AdminAdmissionProcessResponse(
            id=process.id,
            year=process.year,
            cycle=process.cycle,
            label=process.label,
            is_published=process.is_published,
            updated_at=process.updated_at,
        )

    def _to_faculty_response(self, faculty) -> AdminFacultyResponse:
        return AdminFacultyResponse(
            id=faculty.id,
            name=faculty.name,
            slug=faculty.slug,
            academic_area_id=faculty.academic_area_id,
            updated_at=faculty.updated_at,
        )

    def _to_major_response(self, major) -> AdminMajorResponse:
        return AdminMajorResponse(
            id=major.id,
            name=major.name,
            slug=major.slug,
            faculty_id=major.faculty_id,
            is_active=major.is_active,
            updated_at=major.updated_at,
        )
