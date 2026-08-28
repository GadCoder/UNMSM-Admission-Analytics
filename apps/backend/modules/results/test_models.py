from decimal import Decimal

import pytest
from django.db import IntegrityError

from modules.academics.models import AcademicArea, Faculty, Major
from modules.admission_processes.models import AdmissionModality, AdmissionProcess
from modules.results.models import AdmissionResult


@pytest.fixture
def major(db):
    area = AcademicArea.objects.create(code="A", name="Ciencias")
    faculty = Faculty.objects.create(code="F01", name="Facultad", academic_area=area)
    return Major.objects.create(code="013", name="Enfermería", faculty=faculty)


@pytest.fixture
def process(db):
    return AdmissionProcess.objects.create(year=2026, sequence="26-2")


@pytest.fixture
def modality(db):
    return AdmissionModality.objects.create(name="Educación Básica Regular")


@pytest.mark.django_db
def test_process_is_identified_by_year_and_sequence(process):
    assert str(process) == "2026 — 26-2"
    with pytest.raises(IntegrityError):
        AdmissionProcess.objects.create(year=2026, sequence="26-2")


@pytest.mark.django_db
def test_result_keeps_exact_score_and_allows_absent_candidate(
    major, process, modality
):
    result = AdmissionResult.objects.create(
        process=process,
        major=major,
        modality=modality,
        candidate_code="183863",
        last_names="ALBORNOZ ROJAS",
        given_names="JEAN FRANCO",
        score="1070.5000",
        merit=2,
        status=AdmissionResult.Status.ADMITTED,
        source_file="2026/26-2/A/ENFERMERÍA/ingresantes.csv",
        source_row_number=2,
    )
    absent = AdmissionResult.objects.create(
        process=process,
        major=major,
        candidate_code="999999",
        last_names="DOE",
        given_names="JANE",
        status=AdmissionResult.Status.ABSENT,
    )

    result.refresh_from_db()
    assert result.score == Decimal("1070.5000")
    assert result.merit == 2
    assert absent.score is None
    assert absent.merit is None


@pytest.mark.django_db
def test_result_identity_is_unique_per_process_and_major(major, process):
    values = {
        "process": process,
        "major": major,
        "candidate_code": "183863",
        "last_names": "DOE",
        "given_names": "JANE",
        "status": AdmissionResult.Status.POSTULANT,
    }
    AdmissionResult.objects.create(**values)
    with pytest.raises(IntegrityError):
        AdmissionResult.objects.create(**values)
