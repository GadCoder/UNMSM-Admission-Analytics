from decimal import Decimal

from django.db.models import Avg, Count, Max, Min, Q, Value
from django.db.models.functions import Coalesce

from modules.academics.models import Major
from modules.admission_processes.models import AdmissionProcess
from modules.results.models import AdmissionResult

DEFAULT_ADMISSION_MODALITY = "EDUCACIÓN BÁSICA REGULAR (EBR) Y EDUCACIÓN BÁSICA ALTERNATIVA (EBA)"

_EMPTY_TOTALS = {
    "total_results": 0,
    "admitted_count": 0,
    "absent_count": 0,
    "average_score": None,
    "highest_score": None,
    "minimum_admitted_score": None,
    "admitted_score_modality_count": 0,
    "admitted_score_modality": None,
}


# Minimum and average use the same valid admitted-applicant population.
_VALID_ADMITTED_SCORES = Q(
    status=AdmissionResult.Status.ADMITTED,
    score__gte=Decimal("-9999.9999"), score__lte=Decimal("9999.9999"),
)


def _aggregate_totals(results):
    rows = results.values("process_id").annotate(
        total_results=Count("id"),
        admitted_count=Count(
            "id", filter=Q(status=AdmissionResult.Status.ADMITTED)
        ),
        absent_count=Count("id", filter=Q(status=AdmissionResult.Status.ABSENT)),
        average_score=Avg("score", filter=_VALID_ADMITTED_SCORES),
        highest_score=Max("score"),
        minimum_admitted_score=Min("score", filter=_VALID_ADMITTED_SCORES),
        admitted_score_modality=Min("modality__name", filter=_VALID_ADMITTED_SCORES),
        admitted_score_modality_count=Count(
            Coalesce("modality_id", Value(-1)), distinct=True, filter=_VALID_ADMITTED_SCORES,
        ),
    )
    totals = {}
    for row in rows:
        # Unknown modality is its own group; never pool it with a known modality.
        if row["admitted_score_modality_count"] > 1:
            row["minimum_admitted_score"] = None
            row["admitted_score_modality"] = None
        totals[row["process_id"]] = row
    return totals


def _aggregate_majors(results):
    rows = (
        results.values("process_id", "major_id", "major__code", "major__name")
        .annotate(
            total_results=Count("id"),
            admitted_count=Count(
                "id", filter=Q(status=AdmissionResult.Status.ADMITTED)
            ),
            absent_count=Count("id", filter=Q(status=AdmissionResult.Status.ABSENT)),
            average_score=Avg("score", filter=_VALID_ADMITTED_SCORES),
        )
        .order_by("process_id", "major__code")
    )
    majors_by_process = {}
    for row in rows:
        process_id = row["process_id"]
        major = {key: value for key, value in row.items() if key != "process_id"}
        majors_by_process.setdefault(process_id, []).append(major)
    return majors_by_process


def _build_overviews(processes, totals_by_process, majors_by_process):
    return [
        {
            "process": process,
            **_EMPTY_TOTALS,
            **totals_by_process.get(process.id, {}),
            "majors": majors_by_process.get(process.id, []),
        }
        for process in processes
    ]


def _filtered_results(process_ids, *, academic_area=None, faculty=None, modality=None):
    modality = (modality or "").strip() or DEFAULT_ADMISSION_MODALITY
    results = AdmissionResult.objects.filter(process_id__in=process_ids, modality__name=modality)
    if academic_area:
        results = results.filter(major__faculty__academic_area__code=academic_area)
    if faculty:
        results = results.filter(major__faculty__code=faculty)
    return results


def _aggregate_overviews(processes, *, academic_area=None, faculty=None, modality=None):
    """Build process overviews from one totals query and one major query."""
    process_ids = [process.id for process in processes]
    results = _filtered_results(
        process_ids,
        academic_area=academic_area,
        faculty=faculty,
        modality=modality,
    )
    return _build_overviews(
        processes,
        _aggregate_totals(results),
        _aggregate_majors(results),
    )


def latest_process_overview():
    process = (
        AdmissionProcess.objects.filter(is_published=True)
        .order_by("-year", "-sequence")
        .first()
    )
    if process is None:
        return None
    return _aggregate_overviews([process])[0]


def process_overviews(process_ids, *, academic_area=None, faculty=None, modality=None):
    processes_by_id = {
        process.id: process
        for process in AdmissionProcess.objects.filter(
            is_published=True, id__in=process_ids
        )
    }
    missing_ids = [
        process_id for process_id in process_ids if process_id not in processes_by_id
    ]
    if missing_ids:
        raise AdmissionProcess.DoesNotExist

    processes = [processes_by_id[process_id] for process_id in process_ids]
    return _aggregate_overviews(
        processes,
        academic_area=academic_area,
        faculty=faculty,
        modality=modality,
    )


def process_history(*, academic_area=None, faculty=None, modality=None):
    processes = list(
        AdmissionProcess.objects.filter(is_published=True)
        .only("id", "year", "sequence", "name")
        .order_by("year", "sequence", "id")
    )
    process_ids = [process.id for process in processes]
    results = _filtered_results(
        process_ids,
        academic_area=academic_area,
        faculty=faculty,
        modality=modality,
    )
    totals = _aggregate_totals(results)
    return [
        {"process": process, **_EMPTY_TOTALS, **totals.get(process.id, {})}
        for process in processes
    ]


def major_detail(major_id, selected_process_ids, *, modality=None):
    major = Major.objects.select_related("faculty__academic_area").get(
        id=major_id, is_active=True
    )
    processes = list(
        AdmissionProcess.objects.filter(is_published=True)
        .only("id", "year", "sequence", "name")
        .order_by("-year", "-sequence")
    )
    process_by_id = {process.id: process for process in processes}
    if any(process_id not in process_by_id for process_id in selected_process_ids):
        raise AdmissionProcess.DoesNotExist

    process_ids = list(process_by_id)
    modality = (modality or "").strip() or DEFAULT_ADMISSION_MODALITY
    results = AdmissionResult.objects.filter(
        major_id=major_id,
        process_id__in=process_ids,
        modality__name=modality,
    )
    aggregates = _aggregate_totals(results)

    def build(process):
        return {"process": process, **_EMPTY_TOTALS, **aggregates.get(process.id, {})}

    selected = [build(process_by_id[process_id]) for process_id in selected_process_ids]
    selected_ids = set(selected_process_ids)
    history = [build(process) for process in processes if process.id not in selected_ids]
    return {
        "major": {
            "id": major.id,
            "code": major.code,
            "name": major.name,
            "faculty": major.faculty.name,
            "academic_area": major.faculty.academic_area.name,
        },
        "selected_processes": selected,
        "history": history,
    }
