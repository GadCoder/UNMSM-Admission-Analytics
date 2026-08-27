import pytest
from rest_framework.test import APIClient

from modules.academics.models import AcademicArea, Faculty, Major


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def academic_tree(db):
    area = AcademicArea.objects.create(code="A", name="Ciencias")
    faculty = Faculty.objects.create(
        code="F01", name="Facultad de Ciencias", academic_area=area
    )
    major = Major.objects.create(code="013", name="Enfermería", faculty=faculty)
    return area, faculty, major


@pytest.mark.django_db
def test_catalog_endpoints_return_active_records_and_relationship_ids(
    client, academic_tree
):
    area, faculty, major = academic_tree
    inactive_area = AcademicArea.objects.create(
        code="B", name="Inactive", is_active=False
    )
    inactive_faculty = Faculty.objects.create(
        code="F02", name="Inactive", academic_area=inactive_area, is_active=False
    )
    Major.objects.create(
        code="014", name="Inactive", faculty=inactive_faculty, is_active=False
    )

    assert client.get("/api/v1/academic-areas/").json() == [
        {"id": area.id, "code": "A", "name": "Ciencias"}
    ]
    assert client.get("/api/v1/faculties/").json() == [
        {
            "id": faculty.id,
            "code": "F01",
            "name": "Facultad de Ciencias",
            "academic_area_id": area.id,
        }
    ]
    assert client.get("/api/v1/majors/").json() == [
        {
            "id": major.id,
            "code": "013",
            "name": "Enfermería",
            "faculty_id": faculty.id,
        }
    ]
