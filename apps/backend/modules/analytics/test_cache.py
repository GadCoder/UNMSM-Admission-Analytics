import pytest
from rest_framework.test import APIClient

from modules.academics.models import AcademicArea, Faculty, Major
from modules.admission_processes.models import AdmissionModality, AdmissionProcess
from modules.analytics import api_views
from modules.analytics.services import DEFAULT_ADMISSION_MODALITY
from modules.results.models import AdmissionResult


@pytest.mark.django_db
def test_history_reuses_cached_response_and_normalizes_default_modality(monkeypatch):
    calls = 0
    original = api_views.process_history

    def counted(**kwargs):
        nonlocal calls
        calls += 1
        return original(**kwargs)

    monkeypatch.setattr(api_views, "process_history", counted)
    client = APIClient()

    first = client.get("/api/v1/analytics/history/")
    second = client.get(
        f"/api/v1/analytics/history/?modality={DEFAULT_ADMISSION_MODALITY}"
    )

    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()
    assert calls == 1


@pytest.mark.django_db
def test_comparison_cache_separates_filters_and_preserves_requested_order(monkeypatch):
    calls = []

    def fake_overviews(process_ids, **kwargs):
        calls.append((process_ids, kwargs))
        return []

    monkeypatch.setattr(api_views, "process_overviews", fake_overviews)
    client = APIClient()

    first = client.get("/api/v1/analytics/overview/?process=2&compare=1&faculty= F01 ")
    cached = client.get("/api/v1/analytics/overview/?process=2&compare=1&faculty=F01")
    reordered = client.get(
        "/api/v1/analytics/overview/?process=1&compare=2&faculty=F01"
    )
    filtered = client.get("/api/v1/analytics/overview/?process=2&compare=1&faculty=F02")

    assert all(
        response.status_code == 200 for response in (first, cached, reordered, filtered)
    )
    assert first.json() == cached.json()
    assert [call[0] for call in calls] == [[2, 1], [1, 2], [2, 1]]
    assert calls[0][1]["faculty"] == "F01"
    assert calls[2][1]["faculty"] == "F02"


@pytest.mark.django_db
def test_publication_change_invalidates_cached_latest_response(
    django_capture_on_commit_callbacks,
):
    process = AdmissionProcess.objects.create(year=2026, sequence="26-1")
    client = APIClient()

    initial = client.get("/api/v1/analytics/latest/")
    assert initial.status_code == 200
    assert initial.json()["process"]["id"] == process.id

    process.is_published = False
    with django_capture_on_commit_callbacks(execute=True):
        process.save(update_fields=["is_published", "updated_at"])

    response = client.get("/api/v1/analytics/latest/")
    assert response.status_code == 404


@pytest.mark.django_db
def test_result_changes_invalidate_cached_latest_response(
    django_capture_on_commit_callbacks,
):
    area = AcademicArea.objects.create(code="A", name="Area")
    faculty = Faculty.objects.create(code="F", name="Faculty", academic_area=area)
    major = Major.objects.create(code="M", name="Major", faculty=faculty)
    modality = AdmissionModality.objects.create(name=DEFAULT_ADMISSION_MODALITY)
    process = AdmissionProcess.objects.create(year=2026, sequence="26-1")
    client = APIClient()

    assert client.get("/api/v1/analytics/latest/").json()["total_results"] == 0

    with django_capture_on_commit_callbacks(execute=True):
        AdmissionResult.objects.create(
            process=process,
            major=major,
            modality=modality,
            candidate_code="001",
            last_names="DOE",
            given_names="JANE",
            status=AdmissionResult.Status.ADMITTED,
            score="900.0000",
        )

    assert client.get("/api/v1/analytics/latest/").json()["total_results"] == 1


@pytest.mark.django_db
def test_cache_read_failure_falls_through_to_public_api(monkeypatch):
    def fail_get(*args, **kwargs):
        raise OSError("cache unavailable")

    monkeypatch.setattr("modules.analytics.cache.cache.get", fail_get)
    response = APIClient().get("/api/v1/analytics/latest/")

    assert response.status_code == 404
    assert response.json() == {"detail": "No published admission process found."}


@pytest.mark.django_db
def test_latest_cache_hit_avoids_database_queries(django_assert_num_queries):
    AdmissionProcess.objects.create(year=2026, sequence="26-1")
    client = APIClient()
    initial = client.get("/api/v1/analytics/latest/")
    with django_assert_num_queries(0):
        cached = client.get("/api/v1/analytics/latest/")
    assert cached.json() == initial.json()


@pytest.mark.django_db
def test_import_invalidates_once_after_commit_and_refreshes_results(
    tmp_path, django_capture_on_commit_callbacks,
):
    from modules.ingestion.services import import_process_directory

    major_dir = tmp_path / "2026" / "26-2" / "E" / "DERECHO"
    major_dir.mkdir(parents=True)
    csv_path = major_dir / "postulantes.csv"
    header = "codigo,apellidos,nombres,carrera,puntaje,merito,observacion,modalidad\n"
    row = f"A001,DOE,JANE,DERECHO,100,1,,{DEFAULT_ADMISSION_MODALITY}\n"
    csv_path.write_text(header + row, encoding="utf-8")
    with django_capture_on_commit_callbacks(execute=True) as callbacks:
        import_process_directory(major_dir.parent.parent)
    assert len(callbacks) == 1
    client = APIClient()
    assert client.get("/api/v1/analytics/latest/").json()["total_results"] == 1

    csv_path.write_text(header + row + row.replace("A001", "A002"), encoding="utf-8")
    with django_capture_on_commit_callbacks(execute=True) as callbacks:
        import_process_directory(major_dir.parent.parent)
    assert len(callbacks) == 1
    assert client.get("/api/v1/analytics/latest/").json()["total_results"] == 2
    with django_capture_on_commit_callbacks(execute=True) as callbacks:
        import_process_directory(major_dir.parent.parent, dry_run=True)
    assert callbacks == []


@pytest.mark.django_db
def test_rolled_back_import_does_not_invalidate_cache(
    tmp_path, monkeypatch, django_capture_on_commit_callbacks,
):
    from modules.ingestion.services import import_process_directory

    major_dir = tmp_path / "2026" / "26-2" / "E" / "DERECHO"
    major_dir.mkdir(parents=True)
    (major_dir / "postulantes.csv").write_text(
        "codigo,apellidos,nombres,carrera,puntaje,merito,observacion,modalidad\n"
        "A001,DOE,JANE,DERECHO,100,1,,ORDINARIO\n", encoding="utf-8",
    )

    def fail_insert(*args, **kwargs):
        raise RuntimeError("failed insert")

    monkeypatch.setattr(AdmissionResult.objects, "bulk_create", fail_insert)
    with django_capture_on_commit_callbacks(execute=True) as callbacks:
        with pytest.raises(RuntimeError, match="failed insert"):
            import_process_directory(major_dir.parent.parent)
    assert callbacks == []
    assert not AdmissionProcess.objects.exists()


def test_generation_eviction_does_not_reuse_old_response():
    from django.core.cache import cache

    from modules.analytics.cache import GENERATION_KEY, get_or_compute

    assert get_or_compute("test", {}, lambda: {"value": 1}) == {"value": 1}
    cache.delete(GENERATION_KEY)
    assert get_or_compute("test", {}, lambda: {"value": 2}) == {"value": 2}


@pytest.mark.django_db
def test_cache_write_failure_does_not_break_successful_response(monkeypatch):
    AdmissionProcess.objects.create(year=2026, sequence="26-1")

    def fail_set(*args, **kwargs):
        raise OSError("cache unavailable")

    monkeypatch.setattr("modules.analytics.cache.cache.set", fail_set)
    response = APIClient().get("/api/v1/analytics/latest/")
    assert response.status_code == 200
    assert response.json()["total_results"] == 0
