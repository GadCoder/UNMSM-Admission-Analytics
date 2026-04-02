from sqlalchemy.orm import Session

from app.repositories.processes import ProcessesRepository
from app.services.cache import CacheService, get_cache_service
from app.services.cache_keys import process_overview_cache_key
from app.schemas.processes import (
    AdmissionProcessDetailResponse,
    AdmissionProcessListItemResponse,
    AdmissionProcessOverviewResponse,
)


class AdmissionProcessNotFoundError(ValueError):
    pass


class ProcessesService:
    def __init__(
        self,
        repository: ProcessesRepository | None = None,
        cache_service: CacheService | None = None,
    ) -> None:
        self.repository = repository or ProcessesRepository()
        self.cache_service = cache_service or get_cache_service()

    def list_processes(self, db: Session) -> list[AdmissionProcessListItemResponse]:
        processes = self.repository.list_processes(db)
        return [AdmissionProcessListItemResponse.model_validate(process) for process in processes]

    def get_process(self, db: Session, process_id: int) -> AdmissionProcessDetailResponse:
        process = self.repository.get_process_by_id(db, process_id)
        if process is None:
            raise AdmissionProcessNotFoundError(f"Admission process {process_id} not found")
        return AdmissionProcessDetailResponse.model_validate(process)

    def get_process_overview(self, db: Session, process_id: int) -> AdmissionProcessOverviewResponse:
        cache_key = process_overview_cache_key(process_id)
        try:
            cached = self.cache_service.get_json(cache_key)
        except Exception:  # noqa: BLE001
            cached = None
        if isinstance(cached, dict):
            try:
                return AdmissionProcessOverviewResponse.model_validate(cached)
            except Exception:  # noqa: BLE001
                pass

        process = self.repository.get_process_by_id(db, process_id)
        if process is None:
            raise AdmissionProcessNotFoundError(f"Admission process {process_id} not found")

        metrics = self.repository.get_process_overview_metrics(db, process_id)
        acceptance_rate = metrics.acceptance_rate if metrics.total_applicants > 0 else 0.0

        response = AdmissionProcessOverviewResponse(
            process=AdmissionProcessDetailResponse.model_validate(process),
            total_applicants=metrics.total_applicants,
            total_admitted=metrics.total_admitted,
            acceptance_rate=acceptance_rate,
            total_majors=metrics.total_majors,
        )
        try:
            self.cache_service.set_json(cache_key, response.model_dump(mode="json"))
        except Exception:  # noqa: BLE001
            pass
        return response
