from app.services.academic_structure import AcademicStructureService
from app.services.processes import AdmissionProcessNotFoundError, ProcessesService
from app.services.rankings import RankingsService
from app.services.results import ResultsService

__all__ = [
    "AcademicStructureService",
    "ProcessesService",
    "AdmissionProcessNotFoundError",
    "RankingsService",
    "ResultsService",
]
