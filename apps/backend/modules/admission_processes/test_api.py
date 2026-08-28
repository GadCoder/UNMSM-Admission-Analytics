import pytest
from rest_framework.test import APIClient

from modules.academics.models import AcademicArea, Faculty, Major
from modules.admission_processes.models import AdmissionModality, AdmissionProcess
from modules.results.models import AdmissionResult


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def major(db):
    area = AcademicArea.objects.create(code="A", name="Ciencias")
    faculty = Faculty.objects.create(code="F01", name="Facultad", academic_area=area)
    return Major.objects.create(code="013", name="Enfermería", faculty=faculty)


@pytest.mark.django_db
def test_catalog_processes_are_published_and_newest_first(client):
    old = AdmissionProcess.objects.create(year=2025, sequence="25-2")
    newest = AdmissionProcess.objects.create(year=2026, sequence="26-1")
    AdmissionProcess.objects.create(year=2027, sequence="27-1", is_published=False)

    response = client.get("/api/v1/processes/")

    assert response.status_code == 200
    assert response.json() == [
        {
            "id": newest.id,
            "year": 2026,
            "sequence": "26-1",
            "name": "",
        },
        {"id": old.id, "year": 2025, "sequence": "25-2", "name": ""},
    ]


@pytest.mark.django_db
def test_process_detail_includes_result_counts(client, major):
    process = AdmissionProcess.objects.create(year=2026, sequence="26-1")
    modality = AdmissionModality.objects.create(name="General")
    AdmissionResult.objects.create(
        process=process,
        major=major,
        modality=modality,
        candidate_code="1",
        last_names="DOE",
        given_names="JANE",
        status=AdmissionResult.Status.ADMITTED,
        score="1000.0000",
    )
    AdmissionResult.objects.create(
        process=process,
        major=major,
        candidate_code="2",
        last_names="DOE",
        given_names="JOHN",
        status=AdmissionResult.Status.ABSENT,
    )

    response = client.get(f"/api/v1/processes/{process.id}/")

    assert response.status_code == 200
    assert response.json() == {
        "id": process.id,
        "year": 2026,
        "sequence": "26-1",
        "name": "",
        "result_count": 2,
        "admitted_count": 1,
        "absent_count": 1,
    }


@pytest.mark.django_db
def test_modalities_endpoint_excludes_inactive_records(client):
    active = AdmissionModality.objects.create(name="General")
    AdmissionModality.objects.create(name="Old", is_active=False)

    assert client.get("/api/v1/modalities/").json() == [
        {"id": active.id, "name": "General"}
    ]
