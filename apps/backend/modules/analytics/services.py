from django.db.models import Avg, Count, Max, Q

from modules.admission_processes.models import AdmissionProcess
from modules.results.models import AdmissionResult

_EMPTY_TOTALS = {
    "total_results": 0,
    "admitted_count": 0,
    "absent_count": 0,
    "average_score": None,
    "highest_score": None,
}


def _aggregate_totals(results):
    rows = results.values("process_id").annotate(
        total_results=Count("id"),
        admitted_count=Count(
            "id", filter=Q(status=AdmissionResult.Status.ADMITTED)
        ),
        absent_count=Count("id", filter=Q(status=AdmissionResult.Status.ABSENT)),
        average_score=Avg("score"),
        highest_score=Max("score"),
    )
    return {row["process_id"]: row for row in rows}


def _aggregate_majors(results):
    rows = (
        results.values("process_id", "major_id", "major__code", "major__name")
        .annotate(
            total_results=Count("id"),
            admitted_count=Count(
                "id", filter=Q(status=AdmissionResult.Status.ADMITTED)
            ),
            absent_count=Count("id", filter=Q(status=AdmissionResult.Status.ABSENT)),
            average_score=Avg("score"),
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


def _aggregate_overviews(processes):
    """Build process overviews from one totals query and one major query."""
    process_ids = [process.id for process in processes]
    results = AdmissionResult.objects.filter(process_id__in=process_ids)
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


def process_overviews(process_ids):
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
    return _aggregate_overviews(processes)
