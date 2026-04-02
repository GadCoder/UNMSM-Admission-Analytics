from sqlalchemy.orm import Session

from app.repositories.academic_structure import AcademicStructureRepository, MajorTrendAggregation
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
from app.schemas.major_trends import (
    SUPPORTED_TREND_METRICS,
    MajorTrendsHistoryItemResponse,
    MajorTrendsMajorResponse,
    MajorTrendsProcessResponse,
    MajorTrendsResponse,
    TrendMetricName,
)
from app.services.cache import CacheService, get_cache_service
from app.services.cache_keys import major_analytics_cache_key, major_trends_cache_key


class AcademicStructureService:
    def __init__(
        self,
        repository: AcademicStructureRepository | None = None,
        cache_service: CacheService | None = None,
    ) -> None:
        self.repository = repository or AcademicStructureRepository()
        self.cache_service = cache_service or get_cache_service()

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
        cache_key = major_analytics_cache_key(major_id=major_id, process_id=process_id)
        try:
            cached = self.cache_service.get_json(cache_key)
        except Exception:  # noqa: BLE001
            cached = None
        if isinstance(cached, dict):
            try:
                return MajorAnalyticsResponse.model_validate(cached)
            except Exception:  # noqa: BLE001
                pass

        major = self.repository.get_major_by_id(db, major_id)
        if major is None:
            return None

        analytics = self.repository.get_major_analytics(db, major_id=major_id, process_id=process_id)
        response = MajorAnalyticsResponse(
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
        try:
            self.cache_service.set_json(cache_key, response.model_dump(mode="json"))
        except Exception:  # noqa: BLE001
            pass
        return response

    def get_major_trends(
        self,
        db: Session,
        major_id: int,
        metrics: list[TrendMetricName] | None = None,
    ) -> MajorTrendsResponse | None:
        cache_key = major_trends_cache_key(major_id=major_id, metrics=metrics)
        try:
            cached = self.cache_service.get_json(cache_key)
        except Exception:  # noqa: BLE001
            cached = None
        if isinstance(cached, dict):
            try:
                return MajorTrendsResponse.model_validate(cached)
            except Exception:  # noqa: BLE001
                pass

        major = self.repository.get_major_with_hierarchy(db, major_id)
        if major is None:
            return None

        selected_metrics = metrics or list(SUPPORTED_TREND_METRICS)
        trend_rows = self.repository.list_major_trends(db, major_id=major_id)

        history = [
            MajorTrendsHistoryItemResponse(
                process=MajorTrendsProcessResponse(
                    id=row.process_id,
                    year=row.process_year,
                    cycle=row.process_cycle,
                    label=row.process_label,
                ),
                metrics=self._build_major_trend_metrics(row, selected_metrics),
            )
            for row in trend_rows
        ]

        response = MajorTrendsResponse(
            major=MajorTrendsMajorResponse(
                id=major.id,
                name=major.name,
                slug=major.slug,
                faculty=HierarchyContextResponse.model_validate(major.faculty),
                academic_area=HierarchyContextResponse.model_validate(major.faculty.academic_area),
            ),
            metrics=selected_metrics,
            history=history,
        )
        try:
            self.cache_service.set_json(cache_key, response.model_dump(mode="json"))
        except Exception:  # noqa: BLE001
            pass
        return response

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

    def _build_major_trend_metrics(
        self,
        row: MajorTrendAggregation,
        selected_metrics: list[TrendMetricName],
    ) -> dict[TrendMetricName, float | int | None]:
        metric_values: dict[TrendMetricName, float | int | None] = {
            "applicants": row.applicants,
            "admitted": row.admitted,
            "acceptance_rate": row.acceptance_rate,
            "max_score": float(row.max_score) if row.max_score is not None else None,
            "min_score": float(row.min_score) if row.min_score is not None else None,
            "avg_score": row.avg_score,
            "median_score": float(row.median_score) if row.median_score is not None else None,
            "cutoff_score": float(row.cutoff_score) if row.cutoff_score is not None else None,
        }
        return {metric: metric_values[metric] for metric in selected_metrics}
