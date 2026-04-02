from app.repositories.academic_structure import (
    AcademicStructureRepository,
    MajorAnalyticsAggregation,
    MajorTrendAggregation,
)
from app.repositories.admin import AdminRepository
from app.repositories.bulk_imports import BulkImportRepository
from app.repositories.dashboard import (
    DashboardApplicantsTrendRow,
    DashboardCutoffTrendRow,
    DashboardOverviewAggregation,
    DashboardRankingRow,
    DashboardRepository,
)
from app.repositories.processes import ProcessOverviewMetrics, ProcessesRepository
from app.repositories.rankings import MajorRankingRow, RankingsRepository
from app.repositories.results import ResultSearchRow, ResultsRepository
from app.repositories.imports import (
    AdmissionResultInsertPayload,
    ResultsImportRepository,
)

__all__ = [
    "AcademicStructureRepository",
    "AdminRepository",
    "BulkImportRepository",
    "MajorAnalyticsAggregation",
    "MajorTrendAggregation",
    "DashboardRepository",
    "DashboardOverviewAggregation",
    "DashboardRankingRow",
    "DashboardApplicantsTrendRow",
    "DashboardCutoffTrendRow",
    "ProcessesRepository",
    "ProcessOverviewMetrics",
    "RankingsRepository",
    "MajorRankingRow",
    "ResultsRepository",
    "ResultSearchRow",
    "ResultsImportRepository",
    "AdmissionResultInsertPayload",
]
