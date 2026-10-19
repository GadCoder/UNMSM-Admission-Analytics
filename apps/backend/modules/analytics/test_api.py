from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from modules.academics.models import AcademicArea, Faculty, Major
from modules.admission_processes.models import AdmissionModality, AdmissionProcess
from modules.analytics.services import DEFAULT_ADMISSION_MODALITY
from modules.results.models import AdmissionResult


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def default_modality(db):
    return AdmissionModality.objects.create(name=DEFAULT_ADMISSION_MODALITY)


@pytest.fixture
def majors(db):
    area = AcademicArea.objects.create(code="A", name="Ciencias")
    faculty = Faculty.objects.create(code="F01", name="Facultad", academic_area=area)
    return (
        Major.objects.create(code="013", name="Enfermería", faculty=faculty),
        Major.objects.create(code="014", name="Farmacia", faculty=faculty),
    )


@pytest.mark.django_db
def test_latest_overview_aggregates_newest_published_process(client, majors, default_modality):
    nursing, pharmacy = majors
    old = AdmissionProcess.objects.create(year=2025, sequence="25-2")
    newest = AdmissionProcess.objects.create(year=2026, sequence="26-1")
    AdmissionProcess.objects.create(year=2027, sequence="27-1", is_published=False)
    AdmissionResult.objects.create(
        modality=default_modality,
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
            modality=default_modality,
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
        "average_score": "1000.0000",
        "highest_score": "1000.0000",
        "minimum_admitted_score": 1000.0,
        "admitted_score_modality_count": 1, "admitted_score_modality": DEFAULT_ADMISSION_MODALITY,
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
                "average_score": None,
            },
        ],
    }


@pytest.mark.django_db
def test_latest_overview_returns_not_found_without_published_process(client):
    response = client.get("/api/v1/analytics/latest/")

    assert response.status_code == 404
    assert response.json() == {"detail": "No published admission process found."}


@pytest.mark.django_db
def test_comparative_overview_returns_requested_processes_and_major_summaries(client, majors, default_modality):
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
                modality=default_modality,
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
                "minimum_admitted_score": 900.0, "admitted_score_modality_count": 1, "admitted_score_modality": DEFAULT_ADMISSION_MODALITY,
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
                "average_score": None, "highest_score": "800.0000",
                "minimum_admitted_score": None, "admitted_score_modality_count": 0, "admitted_score_modality": None,
                "majors": [{"major_id": nursing.id, "major_code": "013", "major_name": "Enfermería",
                             "total_results": 1, "admitted_count": 0, "absent_count": 0,
                             "average_score": None}],
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
def test_comparative_overview_filters_majors_by_faculty(client, majors, default_modality):
    nursing, pharmacy = majors
    other_area = AcademicArea.objects.create(code="B", name="Salud")
    other_faculty = Faculty.objects.create(code="F02", name="Otra Facultad", academic_area=other_area)
    other_major = Major.objects.create(code="015", name="Odontología", faculty=other_faculty)
    process = AdmissionProcess.objects.create(year=2026, sequence="26-1")
    for index, major in enumerate((nursing, pharmacy, other_major)):
        AdmissionResult.objects.create(
            modality=default_modality,
            process=process, major=major, candidate_code=str(index),
            last_names="DOE", given_names="TEST", status=AdmissionResult.Status.POSTULANT,
        )

    response = client.get(f"/api/v1/analytics/overview/?process={process.id}&faculty=F01")

    assert response.status_code == 200
    assert [major["major_code"] for major in response.json()["processes"][0]["majors"]] == ["013", "014"]


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
def test_major_detail_returns_selected_processes_and_published_history(client, majors, default_modality):
    nursing, _ = majors
    selected = AdmissionProcess.objects.create(year=2026, sequence="26-1")
    history = AdmissionProcess.objects.create(year=2025, sequence="25-2")
    unpublished = AdmissionProcess.objects.create(
        year=2027, sequence="27-1", is_published=False
    )
    AdmissionResult.objects.create(
        process=selected,
        modality=default_modality,
        major=nursing,
        candidate_code="selected",
        last_names="DOE",
        given_names="SELECTED",
        status=AdmissionResult.Status.ADMITTED,
        score=Decimal("900.0000"),
    )
    AdmissionResult.objects.create(
        process=history,
        modality=default_modality,
        major=nursing,
        candidate_code="history",
        last_names="DOE",
        given_names="HISTORY",
        status=AdmissionResult.Status.NOT_ADMITTED,
        score=Decimal("700.0000"),
    )

    response = client.get(
        f"/api/v1/analytics/majors/{nursing.id}/?process={selected.id}"
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["major"] == {
        "id": nursing.id,
        "code": "013",
        "name": "Enfermería",
        "faculty": "Facultad",
        "academic_area": "Ciencias",
    }
    assert [item["process"]["id"] for item in payload["selected_processes"]] == [
        selected.id
    ]
    assert payload["selected_processes"][0]["total_results"] == 1
    assert [item["process"]["id"] for item in payload["history"]] == [history.id]
    assert unpublished.id not in [item["process"]["id"] for item in payload["history"]]


@pytest.mark.django_db
def test_major_detail_uses_bulk_queries_for_history(client, majors, default_modality, django_assert_num_queries):
    nursing, _ = majors
    processes = [
        AdmissionProcess.objects.create(year=2024 + index, sequence=f"{index}-1")
        for index in range(4)
    ]
    for index, process in enumerate(processes):
        AdmissionResult.objects.create(
            process=process,
            modality=default_modality,
            major=nursing,
            candidate_code=str(index),
            last_names="DOE",
            given_names="TEST",
            status=AdmissionResult.Status.POSTULANT,
        )

    with django_assert_num_queries(3):
        response = client.get(
            f"/api/v1/analytics/majors/{nursing.id}/?process={processes[0].id}"
        )

    assert response.status_code == 200


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
def test_comparative_overview_rejects_more_than_four_unique_processes(client):
    processes = [
        AdmissionProcess.objects.create(year=2020 + index, sequence=f"{index}-1")
        for index in range(5)
    ]

    response = client.get(
        "/api/v1/analytics/overview/?process="
        + ",".join(str(process.id) for process in processes)
    )

    assert response.status_code == 400
    assert "4" in response.json()["detail"]


@pytest.mark.django_db
def test_comparative_overview_allows_four_unique_processes(client):
    processes = [
        AdmissionProcess.objects.create(year=2020 + index, sequence=f"{index}-1")
        for index in range(4)
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
def test_comparative_overview_uses_bulk_aggregation_for_four_processes(
    client, django_assert_num_queries
):
    processes = [
        AdmissionProcess.objects.create(year=2020 + index, sequence=f"{index}-1")
        for index in range(4)
    ]

    with django_assert_num_queries(3):
        response = client.get(
            "/api/v1/analytics/overview/?process="
            + ",".join(str(process.id) for process in processes)
        )

    assert response.status_code == 200


@pytest.mark.django_db
def test_process_history_returns_all_published_process_metrics(client, majors, default_modality):
    nursing, _ = majors
    old = AdmissionProcess.objects.create(year=2025, sequence="25-2")
    newest = AdmissionProcess.objects.create(year=2026, sequence="26-1")
    AdmissionProcess.objects.create(year=2027, sequence="27-1", is_published=False)
    for process, score, status in (
        (old, "700.0000", AdmissionResult.Status.ADMITTED),
        (newest, "900.0000", AdmissionResult.Status.NOT_ADMITTED),
    ):
        AdmissionResult.objects.create(
            modality=default_modality,
            process=process, major=nursing, candidate_code=f"candidate-{process.id}",
            last_names="DOE", given_names="TEST", status=status, score=Decimal(score),
        )

    response = client.get("/api/v1/analytics/history/")

    assert response.status_code == 200
    assert [item["process"]["id"] for item in response.json()["processes"]] == [old.id, newest.id]
    assert response.json()["processes"][1]["average_score"] is None
    assert "majors" not in response.json()["processes"][0]


@pytest.mark.django_db
def test_process_history_filters_aggregate_metrics(client, majors):
    nursing, pharmacy = majors
    other_area = AcademicArea.objects.create(code="B", name="Salud")
    other_faculty = Faculty.objects.create(code="F02", name="Otra Facultad", academic_area=other_area)
    other_major = Major.objects.create(code="015", name="Odontología", faculty=other_faculty)
    process = AdmissionProcess.objects.create(year=2026, sequence="26-1")
    ordinary = AdmissionModality.objects.create(name="Ordinario")
    for index, major in enumerate((nursing, pharmacy, other_major)):
        AdmissionResult.objects.create(
            process=process, major=major, modality=ordinary, candidate_code=str(index), last_names="DOE",
            given_names="TEST", status=AdmissionResult.Status.ADMITTED, score=Decimal("900.0000"),
        )

    response = client.get(
        "/api/v1/analytics/history/?academic_area=A&faculty=F01&modality=Ordinario"
    )

    assert response.status_code == 200
    assert response.json()["processes"][0]["total_results"] == 2

    no_matches = client.get(
        "/api/v1/analytics/history/?academic_area=A&faculty=F01&modality=Extraordinario"
    )
    assert no_matches.status_code == 200
    assert no_matches.json()["processes"][0]["total_results"] == 0
    assert no_matches.json()["processes"][0]["average_score"] is None


@pytest.mark.django_db
def test_minimum_admitted_score_filters_status_career_and_process(client, majors, default_modality):
    nursing, pharmacy = majors
    process = AdmissionProcess.objects.create(year=2026, sequence="26-1")
    old = AdmissionProcess.objects.create(year=2025, sequence="25-2")
    empty = AdmissionProcess.objects.create(year=2024, sequence="24-1")
    rows = [
        (process, nursing, "admitted", "900.1234"),
        (process, nursing, "admitted", "950.0000"),
        (process, nursing, "admitted", None),
        (process, nursing, "absent", "1.0000"),
        (process, nursing, "disqualified", "1600.0000"),
        (process, nursing, "not_admitted", "3.0000"),
        (process, nursing, "postulant", "4.0000"),
        (process, pharmacy, "admitted", "5.0000"),
        (old, nursing, "admitted", "0.0000"),
    ]
    for index, (period, major, status, score) in enumerate(rows):
        AdmissionResult.objects.create(modality=default_modality, process=period, major=major, candidate_code=str(index),
                                       last_names="DOE", given_names="TEST", status=status, score=score)
    payload = client.get(f"/api/v1/analytics/majors/{nursing.id}/?process={process.id}").json()
    current = payload["selected_processes"][0]
    assert current["minimum_admitted_score"] == 900.1234
    # The maximum retains all scores; the average includes only valid admitted scores.
    assert current["highest_score"] == "1600.0000"
    assert current["average_score"] == "925.0617"
    assert [item["process"]["id"] for item in payload["history"]] == [old.id, empty.id]
    assert [item["minimum_admitted_score"] for item in payload["history"]] == [0.0, None]
    assert [item["average_score"] for item in payload["history"]] == ["0.0000", None]


@pytest.mark.django_db
def test_minimum_admitted_score_does_not_pool_modalities(client, majors, default_modality, django_assert_num_queries):
    nursing, _ = majors
    process = AdmissionProcess.objects.create(year=2026, sequence="26-1")
    ordinary = AdmissionModality.objects.create(name="Ordinario")
    special = AdmissionModality.objects.create(name="Especial")
    for index, (modality, score) in enumerate([(default_modality, "1000.0000"), (ordinary, "900.0000"), (special, "600.0000"), (None, "500.0000")]):
        AdmissionResult.objects.create(process=process, major=nursing, modality=modality,
                                       candidate_code=str(index), last_names="DOE", given_names="TEST",
                                       status="admitted", score=score)
    url = f"/api/v1/analytics/majors/{nursing.id}/?process={process.id}"
    with django_assert_num_queries(3):
        mixed = client.get(f"/api/v1/analytics/overview/?process={process.id}").json()["processes"][0]
    assert mixed["minimum_admitted_score"] == 1000.0
    assert mixed["admitted_score_modality_count"] == 1
    default_row = client.get(url).json()["selected_processes"][0]
    assert default_row["total_results"] == 1
    assert default_row["minimum_admitted_score"] == 1000.0
    for modality, expected in [("Ordinario", 900.0), ("+Ordinario+", 900.0), ("Especial", 600.0), ("Unknown", None)]:
        with django_assert_num_queries(3):
            filtered = client.get(url + "&modality=" + modality).json()["selected_processes"][0]
        assert filtered["minimum_admitted_score"] == expected
    history = client.get("/api/v1/analytics/history/", {"modality": "Ordinario"}).json()["processes"]
    assert history[0]["minimum_admitted_score"] == 900.0


@pytest.mark.django_db
@pytest.mark.parametrize("status,score", [("admitted", None), ("not_admitted", "700.0000"), ("absent", None)])
def test_minimum_admitted_score_unavailable_is_null(client, majors, default_modality, status, score):
    nursing, _ = majors
    process = AdmissionProcess.objects.create(year=2026, sequence="26-1")
    AdmissionResult.objects.create(modality=default_modality, process=process, major=nursing, candidate_code="1",
                                   last_names="DOE", given_names="TEST", status=status, score=score)
    payload = client.get(f"/api/v1/analytics/majors/{nursing.id}/?process={process.id}").json()
    assert payload["selected_processes"][0]["minimum_admitted_score"] is None
    assert payload["selected_processes"][0]["average_score"] is None


@pytest.mark.django_db
@pytest.mark.parametrize("modality_value", [None, "", "   ", f"  {DEFAULT_ADMISSION_MODALITY}  "])
def test_major_detail_defaults_to_basic_education_for_selected_and_history(
    client, majors, default_modality, django_assert_num_queries, modality_value
):
    nursing, _ = majors
    selected = AdmissionProcess.objects.create(year=2026, sequence="26-1")
    historical = AdmissionProcess.objects.create(year=2025, sequence="25-2")
    special = AdmissionModality.objects.create(name="Especial")
    for process, minimum in [(selected, 900), (historical, 800)]:
        for index, (modality, score, status) in enumerate([
            (default_modality, minimum, "admitted"),
            (default_modality, 100, "not_admitted"),
            (special, 10, "admitted"),
            (None, 1, "admitted"),
        ]):
            AdmissionResult.objects.create(
                process=process, major=nursing, modality=modality,
                candidate_code=str(index), last_names="DOE", given_names="TEST",
                score=score, status=status,
            )
    params = {"process": selected.id}
    if modality_value is not None:
        params["modality"] = modality_value
    with django_assert_num_queries(3):
        response = client.get(f"/api/v1/analytics/majors/{nursing.id}/", params)
    assert response.status_code == 200
    payload = response.json()
    for row, expected_minimum, expected_average in [
        (payload["selected_processes"][0], 900, "900.0000"),
        (payload["history"][0], 800, "800.0000"),
    ]:
        assert row["total_results"] == 2
        assert row["admitted_count"] == 1
        assert row["minimum_admitted_score"] == expected_minimum
        assert row["highest_score"] == f"{expected_minimum}.0000"
        assert row["average_score"] == expected_average
        assert row["admitted_score_modality"] == DEFAULT_ADMISSION_MODALITY
        assert row["admitted_score_modality_count"] == 1


@pytest.mark.django_db
@pytest.mark.parametrize("modality_value", [None, "", "   ", f"  {DEFAULT_ADMISSION_MODALITY}  "])
def test_process_analytics_use_basic_education_and_admitted_averages(
    client, majors, default_modality, django_assert_num_queries, modality_value
):
    nursing, pharmacy = majors
    old = AdmissionProcess.objects.create(year=2025, sequence="25-2")
    latest = AdmissionProcess.objects.create(year=2026, sequence="26-1")
    special = AdmissionModality.objects.create(name="Especial")
    for process, lower in [(old, 700), (latest, 800)]:
        for index, (major, modality, status, score) in enumerate([
            (nursing, default_modality, "admitted", lower),
            (nursing, default_modality, "admitted", lower + 200),
            (nursing, default_modality, "admitted", None),
            (nursing, default_modality, "not_admitted", 2000),
            (nursing, default_modality, "absent", 10),
            (nursing, default_modality, "disqualified", 100),
            (pharmacy, default_modality, "not_admitted", 150),
            (nursing, special, "admitted", 600),
            (nursing, None, "admitted", 1),
        ]):
            AdmissionResult.objects.create(
                process=process, major=major, modality=modality, status=status, score=score,
                candidate_code=str(index), last_names="DOE", given_names="TEST",
            )
    params = {} if modality_value is None else {"modality": modality_value}
    with django_assert_num_queries(3):
        overview = client.get("/api/v1/analytics/overview/", {"process": latest.id, "compare": old.id, **params}).json()["processes"]
    assert [item["average_score"] for item in overview] == ["900.0000", "800.0000"]
    assert overview[0]["total_results"] == 7
    assert overview[0]["admitted_count"] == 3
    assert overview[0]["absent_count"] == 1
    assert overview[0]["highest_score"] == "2000.0000"
    assert [item["average_score"] for item in overview[0]["majors"]] == ["900.0000", None]
    with django_assert_num_queries(2):
        history = client.get("/api/v1/analytics/history/", params).json()["processes"]
    assert [item["average_score"] for item in history] == ["800.0000", "900.0000"]
    with django_assert_num_queries(3):
        latest_overview = client.get("/api/v1/analytics/latest/").json()
    assert latest_overview["average_score"] == "900.0000"
    assert latest_overview["majors"][0]["average_score"] == "900.0000"
    explicit = client.get("/api/v1/analytics/overview/", {"process": latest.id, "modality": "Especial"}).json()["processes"][0]
    assert explicit["average_score"] == "600.0000"
    assert explicit["total_results"] == 1
    unknown = client.get("/api/v1/analytics/overview/", {"process": latest.id, "modality": "Unknown"}).json()["processes"][0]
    assert unknown["average_score"] is None
    assert unknown["total_results"] == 0
