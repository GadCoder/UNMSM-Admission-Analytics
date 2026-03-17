from app.repositories.academic_structure import (
    AcademicStructureRepository,
    MajorAnalyticsAggregation,
    MajorTrendAggregation,
)
from app.repositories.processes import ProcessOverviewMetrics, ProcessesRepository
from app.repositories.rankings import MajorRankingRow, RankingsRepository
from app.repositories.results import ResultSearchRow, ResultsRepository
from app.repositories.imports import AdmissionResultInsertPayload, ResultsImportRepository

__all__ = [
    "AcademicStructureRepository",
    "MajorAnalyticsAggregation",
    "MajorTrendAggregation",
    "ProcessesRepository",
    "ProcessOverviewMetrics",
    "RankingsRepository",
    "MajorRankingRow",
    "ResultsRepository",
    "ResultSearchRow",
    "ResultsImportRepository",
    "AdmissionResultInsertPayload",
]
