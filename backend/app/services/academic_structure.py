from sqlalchemy.orm import Session

from app.repositories.academic_structure import AcademicStructureRepository
from app.schemas.academic_structure import (
    AcademicAreaResponse,
    FacultyResponse,
    HierarchyContextResponse,
    MajorResponse,
)
from app.schemas.major_analytics import (
    MajorAnalyticsFiltersResponse,
    MajorAnalyticsMajorResponse,
    MajorAnalyticsMetricsResponse,
    MajorAnalyticsResponse,
)


class AcademicStructureService:
    def __init__(self, repository: AcademicStructureRepository | None = None) -> None:
        self.repository = repository or AcademicStructureRepository()

    def list_areas(self, db: Session) -> list[AcademicAreaResponse]:
        areas = self.repository.list_areas(db)
        return [AcademicAreaResponse.model_validate(area) for area in areas]

    def get_area(self, db: Session, area_id: int) -> AcademicAreaResponse | None:
        area = self.repository.get_area_by_id(db, area_id)
        if area is None:
            return None
        return AcademicAreaResponse.model_validate(area)

    def list_faculties(self, db: Session, academic_area_id: int | None = None) -> list[FacultyResponse]:
        faculties = self.repository.list_faculties(db, academic_area_id=academic_area_id)
        return [self._to_faculty_response(faculty) for faculty in faculties]

    def get_faculty(self, db: Session, faculty_id: int) -> FacultyResponse | None:
        faculty = self.repository.get_faculty_by_id(db, faculty_id)
        if faculty is None:
            return None
        return self._to_faculty_response(faculty)

    def list_majors(
        self,
        db: Session,
        faculty_id: int | None = None,
        academic_area_id: int | None = None,
    ) -> list[MajorResponse]:
        majors = self.repository.list_majors(
            db,
            faculty_id=faculty_id,
            academic_area_id=academic_area_id,
        )
        return [self._to_major_response(major) for major in majors]

    def get_major(self, db: Session, major_id: int) -> MajorResponse | None:
        major = self.repository.get_major_by_id(db, major_id)
        if major is None:
            return None
        return self._to_major_response(major)

    def get_major_analytics(self, db: Session, major_id: int, process_id: int | None = None) -> MajorAnalyticsResponse | None:
        major = self.repository.get_major_by_id(db, major_id)
        if major is None:
            return None

        analytics = self.repository.get_major_analytics(db, major_id=major_id, process_id=process_id)
        return MajorAnalyticsResponse(
            major=MajorAnalyticsMajorResponse(
                id=major.id,
                name=major.name,
                slug=major.slug,
                faculty=HierarchyContextResponse.model_validate(major.faculty),
                academic_area=HierarchyContextResponse.model_validate(major.faculty.academic_area),
            ),
            filters=MajorAnalyticsFiltersResponse(process_id=process_id),
            metrics=MajorAnalyticsMetricsResponse(
                applicants=analytics.applicants,
                admitted=analytics.admitted,
                acceptance_rate=analytics.acceptance_rate,
                max_score=float(analytics.max_score) if analytics.max_score is not None else None,
                min_score=float(analytics.min_score) if analytics.min_score is not None else None,
                avg_score=analytics.avg_score,
                median_score=float(analytics.median_score) if analytics.median_score is not None else None,
                cutoff_score=float(analytics.cutoff_score) if analytics.cutoff_score is not None else None,
            ),
        )

    def _to_faculty_response(self, faculty) -> FacultyResponse:
        return FacultyResponse(
            id=faculty.id,
            name=faculty.name,
            slug=faculty.slug,
            academic_area_id=faculty.academic_area_id,
            academic_area_name=faculty.academic_area.name,
        )

    def _to_major_response(self, major) -> MajorResponse:
        return MajorResponse(
            id=major.id,
            name=major.name,
            slug=major.slug,
            is_active=major.is_active,
            faculty=HierarchyContextResponse.model_validate(major.faculty),
            academic_area=HierarchyContextResponse.model_validate(major.faculty.academic_area),
        )
