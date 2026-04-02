from __future__ import annotations

from sqlalchemy.orm import Session

from app.repositories.dashboard import DashboardRankingRow, DashboardRepository
from app.schemas.academic_structure import HierarchyContextResponse
from app.schemas.dashboard import (
    DashboardApplicantsTrendItemResponse,
    DashboardApplicantsTrendResponse,
    DashboardAppliedFiltersResponse,
    DashboardCutoffTrendItemResponse,
    DashboardCutoffTrendResponse,
    DashboardOverviewMetricsResponse,
    DashboardOverviewResponse,
    DashboardRankingItemResponse,
    DashboardRankingsParams,
    DashboardRankingsResponse,
    DashboardScopedParams,
    DashboardTrendParams,
)
from app.schemas.processes import AdmissionProcessDetailResponse
from app.services.cache import CacheService, get_cache_service
from app.services.cache_keys import (
    dashboard_applicants_trend_cache_key,
    dashboard_cutoff_trend_cache_key,
    dashboard_overview_cache_key,
    dashboard_rankings_cache_key,
)


class DashboardProcessNotFoundError(ValueError):
    pass


class DashboardAcademicAreaNotFoundError(ValueError):
    pass


class DashboardFacultyNotFoundError(ValueError):
    pass


class DashboardHierarchyMismatchError(ValueError):
    pass


class DashboardService:
    def __init__(
        self,
        repository: DashboardRepository | None = None,
        cache_service: CacheService | None = None,
    ) -> None:
        self.repository = repository or DashboardRepository()
        self.cache_service = cache_service or get_cache_service()

    def get_overview(self, db: Session, params: DashboardScopedParams) -> DashboardOverviewResponse:
        self._validate_scope(db, params=params, require_process=True)
        cache_key = dashboard_overview_cache_key(params)

        try:
            cached = self.cache_service.get_json(cache_key)
        except Exception:  # noqa: BLE001
            cached = None
        if isinstance(cached, dict):
            try:
                return DashboardOverviewResponse.model_validate(cached)
            except Exception:  # noqa: BLE001
                pass

        aggregation = self.repository.get_overview(db, params)
        response = DashboardOverviewResponse(
            filters=DashboardAppliedFiltersResponse(
                process_id=params.process_id,
                academic_area_id=params.academic_area_id,
                faculty_id=params.faculty_id,
            ),
            metrics=DashboardOverviewMetricsResponse(
                total_applicants=aggregation.total_applicants,
                total_admitted=aggregation.total_admitted,
                acceptance_rate=aggregation.acceptance_rate,
                total_majors=aggregation.total_majors,
            ),
        )
        try:
            self.cache_service.set_json(cache_key, response.model_dump(mode="json"))
        except Exception:  # noqa: BLE001
            pass
        return response

    def get_rankings(self, db: Session, params: DashboardRankingsParams) -> DashboardRankingsResponse:
        self._validate_scope(db, params=params, require_process=True)
        cache_key = dashboard_rankings_cache_key(params)

        try:
            cached = self.cache_service.get_json(cache_key)
        except Exception:  # noqa: BLE001
            cached = None
        if isinstance(cached, dict):
            try:
                return DashboardRankingsResponse.model_validate(cached)
            except Exception:  # noqa: BLE001
                pass

        scoped_params = DashboardScopedParams(
            process_id=params.process_id,
            academic_area_id=params.academic_area_id,
            faculty_id=params.faculty_id,
        )
        most_competitive = self.repository.list_rankings_by_cutoff(db, params=scoped_params, limit=params.limit)
        most_popular = self.repository.list_rankings_by_applicants(db, params=scoped_params, limit=params.limit)

        response = DashboardRankingsResponse(
            filters=DashboardAppliedFiltersResponse(
                process_id=params.process_id,
                academic_area_id=params.academic_area_id,
                faculty_id=params.faculty_id,
                limit=params.limit,
            ),
            most_competitive=[self._to_ranking_item(row, idx + 1) for idx, row in enumerate(most_competitive)],
            most_popular=[self._to_ranking_item(row, idx + 1) for idx, row in enumerate(most_popular)],
        )
        try:
            self.cache_service.set_json(cache_key, response.model_dump(mode="json"))
        except Exception:  # noqa: BLE001
            pass
        return response

    def get_applicants_trend(self, db: Session, params: DashboardTrendParams) -> DashboardApplicantsTrendResponse:
        self._validate_scope(db, params=params, require_process=False)
        cache_key = dashboard_applicants_trend_cache_key(params)

        try:
            cached = self.cache_service.get_json(cache_key)
        except Exception:  # noqa: BLE001
            cached = None
        if isinstance(cached, dict):
            try:
                return DashboardApplicantsTrendResponse.model_validate(cached)
            except Exception:  # noqa: BLE001
                pass

        rows = self.repository.list_applicants_trend(db, params=params)
        response = DashboardApplicantsTrendResponse(
            filters=DashboardAppliedFiltersResponse(
                academic_area_id=params.academic_area_id,
                faculty_id=params.faculty_id,
            ),
            items=[
                DashboardApplicantsTrendItemResponse(
                    process=AdmissionProcessDetailResponse(
                        id=row.process_id,
                        year=row.process_year,
                        cycle=row.process_cycle,
                        label=row.process_label,
                    ),
                    applicants=row.applicants,
                )
                for row in rows
            ],
        )
        try:
            self.cache_service.set_json(cache_key, response.model_dump(mode="json"))
        except Exception:  # noqa: BLE001
            pass
        return response

    def get_cutoff_trend(self, db: Session, params: DashboardTrendParams) -> DashboardCutoffTrendResponse:
        self._validate_scope(db, params=params, require_process=False)
        cache_key = dashboard_cutoff_trend_cache_key(params)

        try:
            cached = self.cache_service.get_json(cache_key)
        except Exception:  # noqa: BLE001
            cached = None
        if isinstance(cached, dict):
            try:
                return DashboardCutoffTrendResponse.model_validate(cached)
            except Exception:  # noqa: BLE001
                pass

        rows = self.repository.list_cutoff_trend(db, params=params)
        response = DashboardCutoffTrendResponse(
            filters=DashboardAppliedFiltersResponse(
                academic_area_id=params.academic_area_id,
                faculty_id=params.faculty_id,
            ),
            items=[
                DashboardCutoffTrendItemResponse(
                    process=AdmissionProcessDetailResponse(
                        id=row.process_id,
                        year=row.process_year,
                        cycle=row.process_cycle,
                        label=row.process_label,
                    ),
                    avg_cutoff_score=row.avg_cutoff_score,
                )
                for row in rows
            ],
        )
        try:
            self.cache_service.set_json(cache_key, response.model_dump(mode="json"))
        except Exception:  # noqa: BLE001
            pass
        return response

    def _validate_scope(self, db: Session, params: DashboardScopedParams | DashboardTrendParams, require_process: bool) -> None:
        if require_process and isinstance(params, DashboardScopedParams):
            process = self.repository.get_process_by_id(db, params.process_id)
            if process is None:
                raise DashboardProcessNotFoundError(f"Admission process {params.process_id} not found")

        academic_area = None
        if params.academic_area_id is not None:
            academic_area = self.repository.get_academic_area_by_id(db, params.academic_area_id)
            if academic_area is None:
                raise DashboardAcademicAreaNotFoundError(f"Academic area {params.academic_area_id} not found")

        faculty = None
        if params.faculty_id is not None:
            faculty = self.repository.get_faculty_by_id(db, params.faculty_id)
            if faculty is None:
                raise DashboardFacultyNotFoundError(f"Faculty {params.faculty_id} not found")

        if academic_area is not None and faculty is not None and faculty.academic_area_id != academic_area.id:
            raise DashboardHierarchyMismatchError("The faculty does not belong to the selected academic area")

    def _to_ranking_item(self, row: DashboardRankingRow, rank: int) -> DashboardRankingItemResponse:
        return DashboardRankingItemResponse(
            rank=rank,
            major=HierarchyContextResponse(id=row.major_id, name=row.major_name, slug=row.major_slug),
            faculty=HierarchyContextResponse(id=row.faculty_id, name=row.faculty_name, slug=row.faculty_slug),
            academic_area=HierarchyContextResponse(
                id=row.academic_area_id,
                name=row.academic_area_name,
                slug=row.academic_area_slug,
            ),
            applicants=row.applicants,
            admitted=row.admitted,
            acceptance_rate=row.acceptance_rate,
            cutoff_score=float(row.cutoff_score) if row.cutoff_score is not None else None,
        )
