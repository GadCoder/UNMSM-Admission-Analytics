import pytest
from django.db import IntegrityError

from modules.academics.models import AcademicArea, Faculty, Major


@pytest.mark.django_db
def test_academic_hierarchy_has_stable_parent_relationships():
    area = AcademicArea.objects.create(code="A", name="Ciencias de la Salud")
    faculty = Faculty.objects.create(code="F01", name="Medicina", academic_area=area)
    major = Major.objects.create(code="013", name="Enfermería", faculty=faculty)

    assert major.faculty.academic_area == area
    assert str(major) == "013 — Enfermería"


@pytest.mark.django_db
def test_major_codes_are_unique():
    area = AcademicArea.objects.create(code="A", name="Ciencias")
    faculty = Faculty.objects.create(code="F01", name="Facultad", academic_area=area)
    Major.objects.create(code="013", name="Enfermería", faculty=faculty)

    with pytest.raises(IntegrityError):
        Major.objects.create(code="013", name="Otra carrera", faculty=faculty)


@pytest.mark.django_db
def test_faculty_codes_are_unique_within_an_academic_area():
    area = AcademicArea.objects.create(code="A", name="Ciencias")
    Faculty.objects.create(code="F01", name="Primera", academic_area=area)

    with pytest.raises(IntegrityError):
        Faculty.objects.create(code="F01", name="Otra", academic_area=area)
