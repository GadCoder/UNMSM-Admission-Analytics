from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from modules.academics.models import AcademicArea, Faculty, Major
from modules.admission_processes.models import AdmissionProcess
from modules.results.models import AdmissionResult


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def majors(db):
    area = AcademicArea.objects.create(code="A", name="Ciencias")
    faculty = Faculty.objects.create(code="F01", name="Facultad", academic_area=area)
    return (
        Major.objects.create(code="013", name="Enfermería", faculty=faculty),
        Major.objects.create(code="014", name="Farmacia", faculty=faculty),
    )


@pytest.mark.django_db
def test_latest_overview_aggregates_newest_published_process(client, majors):
    nursing, pharmacy = majors
    old = AdmissionProcess.objects.create(year=2025, sequence="25-2")
    newest = AdmissionProcess.objects.create(year=2026, sequence="26-1")
    AdmissionProcess.objects.create(year=2027, sequence="27-1", is_published=False)
    AdmissionResult.objects.create(
        process=old,
        major=nursing,
        candidate_code="old",
        last_names="DOE",
        given_names="OLD",
        status=AdmissionResult.Status.ADMITTED,
        score=Decimal("500.0000"),
    )
    for code, major, status, score in [
        ("1", nursing, AdmissionResult.Status.ADMITTED, "1000.0000"),
        ("2", nursing, AdmissionResult.Status.ABSENT, None),
        ("3", pharmacy, AdmissionResult.Status.NOT_ADMITTED, "800.0000"),
    ]:
        AdmissionResult.objects.create(
            process=newest,
            major=major,
            candidate_code=code,
            last_names="DOE",
            given_names="TEST",
            status=status,
            score=score,
        )

    response = client.get("/api/v1/analytics/latest/")

    assert response.status_code == 200
    assert response.json() == {
        "process": {
            "id": newest.id,
            "year": 2026,
            "sequence": "26-1",
            "name": "",
        },
        "total_results": 3,
        "admitted_count": 1,
        "absent_count": 1,
        "average_score": "900.0000",
        "highest_score": "1000.0000",
        "majors": [
            {
                "major_id": nursing.id,
                "major_code": "013",
                "major_name": "Enfermería",
                "total_results": 2,
                "admitted_count": 1,
                "absent_count": 1,
                "average_score": "1000.0000",
            },
            {
                "major_id": pharmacy.id,
                "major_code": "014",
                "major_name": "Farmacia",
                "total_results": 1,
                "admitted_count": 0,
                "absent_count": 0,
                "average_score": "800.0000",
            },
        ],
    }


@pytest.mark.django_db
def test_latest_overview_returns_not_found_without_published_process(client):
    response = client.get("/api/v1/analytics/latest/")

    assert response.status_code == 404
    assert response.json() == {"detail": "No published admission process found."}


@pytest.mark.django_db
def test_comparative_overview_returns_requested_processes_and_major_summaries(client, majors):
    nursing, pharmacy = majors
    first = AdmissionProcess.objects.create(year=2025, sequence="25-2")
    second = AdmissionProcess.objects.create(year=2026, sequence="26-1", name="2026 I")
    for process, rows in [
        (first, [(nursing, AdmissionResult.Status.ADMITTED, "900.0000"),
                 (pharmacy, AdmissionResult.Status.ABSENT, None)]),
        (second, [(nursing, AdmissionResult.Status.NOT_ADMITTED, "800.0000")]),
    ]:
        for index, (major, status, score) in enumerate(rows):
            AdmissionResult.objects.create(
                process=process, major=major, candidate_code=f"{process.id}-{index}",
                last_names="DOE", given_names="TEST", status=status, score=score,
            )

    response = client.get(f"/api/v1/analytics/overview/?process={first.id}&compare={second.id}")

    assert response.status_code == 200
    assert response.json() == {
        "processes": [
            {
                "process": {"id": first.id, "year": 2025, "sequence": "25-2", "name": ""},
                "total_results": 2, "admitted_count": 1, "absent_count": 1,
                "average_score": "900.0000", "highest_score": "900.0000",
                "majors": [
                    {"major_id": nursing.id, "major_code": "013", "major_name": "Enfermería",
                     "total_results": 1, "admitted_count": 1, "absent_count": 0,
                     "average_score": "900.0000"},
                    {"major_id": pharmacy.id, "major_code": "014", "major_name": "Farmacia",
                     "total_results": 1, "admitted_count": 0, "absent_count": 1,
                     "average_score": None},
                ],
            },
            {
                "process": {"id": second.id, "year": 2026, "sequence": "26-1", "name": "2026 I"},
                "total_results": 1, "admitted_count": 0, "absent_count": 0,
                "average_score": "800.0000", "highest_score": "800.0000",
                "majors": [{"major_id": nursing.id, "major_code": "013", "major_name": "Enfermería",
                             "total_results": 1, "admitted_count": 0, "absent_count": 0,
                             "average_score": "800.0000"}],
            },
        ]
    }


@pytest.mark.django_db
def test_comparative_overview_rejects_malformed_or_empty_process_ids(client):
    for query in ("", "?process=", "?process=abc", "?process=1&compare=2,,3"):
        response = client.get(f"/api/v1/analytics/overview/{query}")
        assert response.status_code == 400
        assert "process" in response.json()["detail"] or "compare" in response.json()["detail"]


@pytest.mark.django_db
def test_comparative_overview_returns_not_found_for_missing_or_unpublished_process(client):
    unpublished = AdmissionProcess.objects.create(year=2025, sequence="25-2", is_published=False)

    response = client.get(f"/api/v1/analytics/overview/?process={unpublished.id}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Admission process not found or is not published."}
