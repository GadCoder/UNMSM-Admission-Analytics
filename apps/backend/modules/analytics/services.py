from django.db.models import Avg, Count, Max, Q

from modules.admission_processes.models import AdmissionProcess
from modules.results.models import AdmissionResult


def latest_process_overview():
    process = (
        AdmissionProcess.objects.filter(is_published=True)
        .order_by("-year", "-sequence")
        .first()
    )
    if process is None:
        return None

    results = AdmissionResult.objects.filter(process=process)
    totals = results.aggregate(
        total_results=Count("id"),
        admitted_count=Count(
            "id", filter=Q(status=AdmissionResult.Status.ADMITTED)
        ),
        absent_count=Count("id", filter=Q(status=AdmissionResult.Status.ABSENT)),
        average_score=Avg("score"),
        highest_score=Max("score"),
    )
    majors = list(
        results.values("major_id", "major__code", "major__name")
        .annotate(
            total_results=Count("id"),
            admitted_count=Count(
                "id", filter=Q(status=AdmissionResult.Status.ADMITTED)
            ),
            absent_count=Count("id", filter=Q(status=AdmissionResult.Status.ABSENT)),
            average_score=Avg("score"),
        )
        .order_by("major__code")
    )

    return {"process": process, "majors": majors, **totals}
