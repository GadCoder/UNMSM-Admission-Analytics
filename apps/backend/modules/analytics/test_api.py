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


@pytest.mark.django_db
def test_comparative_overview_accepts_comma_separated_process_ids_and_excludes_unrequested(client):
    processes = [
        AdmissionProcess.objects.create(year=2025, sequence="25-2"),
        AdmissionProcess.objects.create(year=2026, sequence="26-1"),
        AdmissionProcess.objects.create(year=2027, sequence="27-1"),
    ]

    response = client.get(
        f"/api/v1/analytics/overview/?process={processes[0].id},{processes[1].id}"
    )

    assert response.status_code == 200
    assert [item["process"]["id"] for item in response.json()["processes"]] == [
        processes[0].id,
        processes[1].id,
    ]


@pytest.mark.django_db
def test_comparative_overview_deduplicates_ids_preserving_request_order(client):
    processes = [
        AdmissionProcess.objects.create(year=2025, sequence="25-2"),
        AdmissionProcess.objects.create(year=2026, sequence="26-1"),
    ]

    response = client.get(
        f"/api/v1/analytics/overview/?process={processes[1].id},{processes[0].id}"
        f"&compare={processes[1].id},{processes[0].id}"
    )

    assert response.status_code == 200
    assert [item["process"]["id"] for item in response.json()["processes"]] == [
        processes[1].id,
        processes[0].id,
    ]


@pytest.mark.django_db
def test_comparative_overview_rejects_empty_compare(client):
    process = AdmissionProcess.objects.create(year=2025, sequence="25-2")

    response = client.get(f"/api/v1/analytics/overview/?process={process.id}&compare=")

    assert response.status_code == 400
    assert "compare" in response.json()["detail"]


@pytest.mark.django_db
def test_comparative_overview_returns_not_found_for_nonexistent_primary_process(client):
    response = client.get("/api/v1/analytics/overview/?process=999999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Admission process not found or is not published."}


@pytest.mark.django_db
def test_comparative_overview_returns_not_found_for_unpublished_compare_process(client):
    published = AdmissionProcess.objects.create(year=2025, sequence="25-2")
    unpublished = AdmissionProcess.objects.create(
        year=2026, sequence="26-1", is_published=False
    )

    response = client.get(
        f"/api/v1/analytics/overview/?process={published.id}&compare={unpublished.id}"
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Admission process not found or is not published."}


@pytest.mark.django_db
def test_comparative_overview_rejects_more_than_six_unique_processes(client):
    processes = [
        AdmissionProcess.objects.create(year=2020 + index, sequence=f"{index}-1")
        for index in range(7)
    ]

    response = client.get(
        "/api/v1/analytics/overview/?process="
        + ",".join(str(process.id) for process in processes)
    )

    assert response.status_code == 400
    assert "6" in response.json()["detail"]


@pytest.mark.django_db
def test_comparative_overview_allows_six_unique_processes(client):
    processes = [
        AdmissionProcess.objects.create(year=2020 + index, sequence=f"{index}-1")
        for index in range(6)
    ]

    response = client.get(
        "/api/v1/analytics/overview/?process="
        + ",".join(str(process.id) for process in processes)
    )

    assert response.status_code == 200


@pytest.mark.django_db
def test_comparative_overview_returns_empty_aggregate_for_process_without_results(client):
    process = AdmissionProcess.objects.create(year=2025, sequence="25-2")

    response = client.get(f"/api/v1/analytics/overview/?process={process.id}")

    assert response.status_code == 200
    overview = response.json()["processes"][0]
    assert overview["total_results"] == 0
    assert overview["admitted_count"] == 0
    assert overview["absent_count"] == 0
    assert overview["average_score"] is None
    assert overview["highest_score"] is None
    assert overview["majors"] == []


@pytest.mark.django_db
def test_comparative_overview_rejects_excessively_long_numeric_id(client):
    response = client.get(f"/api/v1/analytics/overview/?process={'9' * 1000}")

    assert response.status_code == 400
    assert "positive integer IDs" in response.json()["detail"]


@pytest.mark.django_db
def test_comparative_overview_uses_bulk_aggregation_for_six_processes(
    client, django_assert_num_queries
):
    processes = [
        AdmissionProcess.objects.create(year=2020 + index, sequence=f"{index}-1")
        for index in range(6)
    ]

    with django_assert_num_queries(3):
        response = client.get(
            "/api/v1/analytics/overview/?process="
            + ",".join(str(process.id) for process in processes)
        )

    assert response.status_code == 200
