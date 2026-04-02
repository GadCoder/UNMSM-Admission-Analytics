import os
import tempfile
import unittest
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

from app.core.db import Base, get_db_session
from app.main import create_app
from app.models.academic import AcademicArea, Faculty, Major
from app.models.admission import AdmissionProcess, AdmissionResult


class AcademicStructureEndpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.tempdir = tempfile.TemporaryDirectory()
        cls.db_path = f"{cls.tempdir.name}/test.db"
        cls.engine = create_engine(f"sqlite+pysqlite:///{cls.db_path}", future=True)
        cls.session_factory = sessionmaker(bind=cls.engine, autoflush=False, autocommit=False, future=True)

        Base.metadata.create_all(bind=cls.engine)

        with cls.session_factory() as session:
            area_sciences = AcademicArea(id=1, name="Health Sciences", slug="health-sciences")
            area_humanities = AcademicArea(id=2, name="Humanities", slug="humanities")

            faculty_medicine = Faculty(
                id=10,
                name="Medicine",
                slug="medicine",
                academic_area_id=1,
            )
            faculty_engineering = Faculty(
                id=11,
                name="Engineering",
                slug="engineering",
                academic_area_id=1,
            )
            faculty_letters = Faculty(
                id=20,
                name="Letters",
                slug="letters",
                academic_area_id=2,
            )

            major_nursing = Major(
                id=100,
                name="Nursing",
                slug="nursing",
                faculty_id=10,
                is_active=True,
            )
            major_civil = Major(
                id=101,
                name="Civil Engineering",
                slug="civil-engineering",
                faculty_id=11,
                is_active=True,
            )
            major_history = Major(
                id=102,
                name="History",
                slug="history",
                faculty_id=20,
                is_active=False,
            )

            process_2024_i = AdmissionProcess(id=1, year=2024, cycle="I", label="2024-I")
            process_2024_ii = AdmissionProcess(id=2, year=2024, cycle="II", label="2024-II")
            process_2023_ii = AdmissionProcess(id=3, year=2023, cycle="II", label="2023-II")

            results = [
                AdmissionResult(
                    id=0,
                    admission_process_id=3,
                    major_id=101,
                    candidate_code="M000",
                    candidate_lastnames="OMEGA",
                    candidate_names="Z",
                    score=Decimal("600.0"),
                    merit_rank=4,
                    observation_raw=None,
                    is_admitted=False,
                    row_number=1,
                ),
                AdmissionResult(
                    id=1,
                    admission_process_id=1,
                    major_id=101,
                    candidate_code="M001",
                    candidate_lastnames="ALFA",
                    candidate_names="A",
                    score=Decimal("500.0"),
                    merit_rank=5,
                    observation_raw=None,
                    is_admitted=False,
                    row_number=1,
                ),
                AdmissionResult(
                    id=2,
                    admission_process_id=1,
                    major_id=101,
                    candidate_code="M002",
                    candidate_lastnames="BETA",
                    candidate_names="B",
                    score=Decimal("700.0"),
                    merit_rank=3,
                    observation_raw=None,
                    is_admitted=True,
                    row_number=2,
                ),
                AdmissionResult(
                    id=3,
                    admission_process_id=1,
                    major_id=101,
                    candidate_code="M003",
                    candidate_lastnames="GAMMA",
                    candidate_names="C",
                    score=Decimal("900.0"),
                    merit_rank=1,
                    observation_raw=None,
                    is_admitted=True,
                    row_number=3,
                ),
                AdmissionResult(
                    id=4,
                    admission_process_id=2,
                    major_id=101,
                    candidate_code="M004",
                    candidate_lastnames="DELTA",
                    candidate_names="D",
                    score=Decimal("800.0"),
                    merit_rank=2,
                    observation_raw=None,
                    is_admitted=True,
                    row_number=1,
                ),
                AdmissionResult(
                    id=5,
                    admission_process_id=2,
                    major_id=101,
                    candidate_code="M005",
                    candidate_lastnames="EPSILON",
                    candidate_names="E",
                    score=Decimal("700.0"),
                    merit_rank=3,
                    observation_raw=None,
                    is_admitted=False,
                    row_number=2,
                ),
            ]

            session.add_all(
                [
                    area_sciences,
                    area_humanities,
                    faculty_medicine,
                    faculty_engineering,
                    faculty_letters,
                    major_nursing,
                    major_civil,
                    major_history,
                    process_2024_i,
                    process_2024_ii,
                    process_2023_ii,
                    *results,
                ]
            )
            session.commit()

        app = create_app()

        def override_get_db_session():
            db = cls.session_factory()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db_session] = override_get_db_session
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.client.close()
        cls.engine.dispose()
        cls.tempdir.cleanup()

    def test_list_areas_returns_full_dataset(self) -> None:
        response = self.client.get("/areas")
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        self.assertIsInstance(payload, list)
        self.assertEqual(len(payload), 2)
        self.assertEqual(payload[0], {"id": 1, "name": "Health Sciences", "slug": "health-sciences"})
        self.assertEqual(payload[1], {"id": 2, "name": "Humanities", "slug": "humanities"})

    def test_area_detail_returns_404_when_missing(self) -> None:
        found_response = self.client.get("/areas/1")
        self.assertEqual(found_response.status_code, 200)
        self.assertEqual(found_response.json(), {"id": 1, "name": "Health Sciences", "slug": "health-sciences"})

        response = self.client.get("/areas/999")
        self.assertEqual(response.status_code, 404)

    def test_faculty_list_supports_area_filter(self) -> None:
        response = self.client.get("/faculties?academic_area_id=1")
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        self.assertEqual(len(payload), 2)
        self.assertEqual(payload[0]["academic_area_id"], 1)
        self.assertEqual(payload[1]["academic_area_id"], 1)
        self.assertEqual(payload[0]["academic_area_name"], "Health Sciences")

    def test_faculty_detail_returns_404_when_missing(self) -> None:
        found_response = self.client.get("/faculties/11")
        self.assertEqual(found_response.status_code, 200)
        self.assertEqual(
            found_response.json(),
            {
                "id": 11,
                "name": "Engineering",
                "slug": "engineering",
                "academic_area_id": 1,
                "academic_area_name": "Health Sciences",
            },
        )

        response = self.client.get("/faculties/999")
        self.assertEqual(response.status_code, 404)

    def test_major_list_supports_filters_and_hierarchy_context(self) -> None:
        response = self.client.get("/majors")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 3)
        self.assertIn("faculty", payload[0])
        self.assertIn("academic_area", payload[0])

        response_by_faculty = self.client.get("/majors?faculty_id=10")
        self.assertEqual(response_by_faculty.status_code, 200)
        self.assertEqual([item["id"] for item in response_by_faculty.json()], [100])

        response_by_area = self.client.get("/majors?academic_area_id=2")
        self.assertEqual(response_by_area.status_code, 200)
        self.assertEqual([item["id"] for item in response_by_area.json()], [102])

        response_combined = self.client.get("/majors?faculty_id=10&academic_area_id=1")
        self.assertEqual(response_combined.status_code, 200)
        self.assertEqual([item["id"] for item in response_combined.json()], [100])

        response_mismatch = self.client.get("/majors?faculty_id=10&academic_area_id=2")
        self.assertEqual(response_mismatch.status_code, 200)
        self.assertEqual(response_mismatch.json(), [])

    def test_major_detail_contains_hierarchy_and_returns_404_when_missing(self) -> None:
        response = self.client.get("/majors/101")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["id"], 101)
        self.assertEqual(payload["name"], "Civil Engineering")
        self.assertEqual(payload["slug"], "civil-engineering")
        self.assertTrue(payload["is_active"])
        self.assertEqual(payload["faculty"], {"id": 11, "name": "Engineering", "slug": "engineering"})
        self.assertEqual(
            payload["academic_area"],
            {"id": 1, "name": "Health Sciences", "slug": "health-sciences"},
        )

        missing_response = self.client.get("/majors/999")
        self.assertEqual(missing_response.status_code, 404)

    def test_major_analytics_returns_metrics_and_respects_process_filter(self) -> None:
        response = self.client.get("/majors/101/analytics")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["major"]["id"], 101)
        self.assertEqual(payload["filters"]["process_id"], None)
        self.assertEqual(payload["metrics"]["applicants"], 6)
        self.assertEqual(payload["metrics"]["admitted"], 3)
        self.assertAlmostEqual(payload["metrics"]["acceptance_rate"], 0.5, places=6)
        self.assertEqual(payload["metrics"]["min_score"], 500.0)
        self.assertEqual(payload["metrics"]["max_score"], 900.0)
        self.assertEqual(payload["metrics"]["cutoff_score"], 700.0)
        self.assertAlmostEqual(payload["metrics"]["median_score"], 700.0, places=6)

        response_scoped = self.client.get("/majors/101/analytics?process_id=1")
        self.assertEqual(response_scoped.status_code, 200)
        scoped = response_scoped.json()
        self.assertEqual(scoped["filters"]["process_id"], 1)
        self.assertEqual(scoped["metrics"]["applicants"], 3)
        self.assertEqual(scoped["metrics"]["admitted"], 2)
        self.assertAlmostEqual(scoped["metrics"]["median_score"], 700.0, places=6)
        self.assertEqual(scoped["metrics"]["cutoff_score"], 700.0)

    def test_major_analytics_returns_404_when_major_missing(self) -> None:
        response = self.client.get("/majors/999/analytics")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Major not found")

    def test_major_analytics_returns_empty_metrics_when_scope_has_no_data(self) -> None:
        response = self.client.get("/majors/102/analytics")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["major"]["id"], 102)
        self.assertEqual(payload["metrics"]["applicants"], 0)
        self.assertEqual(payload["metrics"]["admitted"], 0)
        self.assertIsNone(payload["metrics"]["acceptance_rate"])
        self.assertIsNone(payload["metrics"]["max_score"])
        self.assertIsNone(payload["metrics"]["min_score"])
        self.assertIsNone(payload["metrics"]["avg_score"])
        self.assertIsNone(payload["metrics"]["median_score"])
        self.assertIsNone(payload["metrics"]["cutoff_score"])

    def test_major_trends_returns_hierarchy_context_and_history(self) -> None:
        response = self.client.get("/majors/101/trends")
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        self.assertEqual(payload["major"]["id"], 101)
        self.assertEqual(payload["major"]["faculty"]["id"], 11)
        self.assertEqual(payload["major"]["academic_area"]["id"], 1)
        self.assertEqual(
            payload["metrics"],
            [
                "applicants",
                "admitted",
                "acceptance_rate",
                "max_score",
                "min_score",
                "avg_score",
                "median_score",
                "cutoff_score",
            ],
        )
        self.assertEqual(len(payload["history"]), 3)
        self.assertIn("process", payload["history"][0])
        self.assertIn("metrics", payload["history"][0])

    def test_major_trends_returns_404_when_major_missing(self) -> None:
        response = self.client.get("/majors/999/trends")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Major not found")

    def test_major_trends_are_ordered_chronologically(self) -> None:
        response = self.client.get("/majors/101/trends")
        self.assertEqual(response.status_code, 200)

        labels = [item["process"]["label"] for item in response.json()["history"]]
        self.assertEqual(labels, ["2023-II", "2024-I", "2024-II"])

    def test_major_trends_metrics_filter_and_validation(self) -> None:
        response_default = self.client.get("/majors/101/trends")
        self.assertEqual(response_default.status_code, 200)
        default_metrics = response_default.json()["history"][0]["metrics"]
        self.assertIn("applicants", default_metrics)
        self.assertIn("cutoff_score", default_metrics)
        self.assertIn("median_score", default_metrics)

        response_filtered = self.client.get("/majors/101/trends?metrics=applicants,cutoff_score")
        self.assertEqual(response_filtered.status_code, 200)
        filtered_payload = response_filtered.json()
        self.assertEqual(filtered_payload["metrics"], ["applicants", "cutoff_score"])
        self.assertEqual(
            sorted(filtered_payload["history"][0]["metrics"].keys()),
            ["applicants", "cutoff_score"],
        )

        response_invalid = self.client.get("/majors/101/trends?metrics=applicants,unknown")
        self.assertEqual(response_invalid.status_code, 422)

    def test_major_trends_metric_semantics_match_analytics(self) -> None:
        analytics_response = self.client.get("/majors/101/analytics")
        trends_response = self.client.get("/majors/101/trends")
        self.assertEqual(analytics_response.status_code, 200)
        self.assertEqual(trends_response.status_code, 200)

        analytics_metrics = analytics_response.json()["metrics"]
        history = trends_response.json()["history"]

        total_applicants = sum(item["metrics"]["applicants"] for item in history)
        total_admitted = sum(item["metrics"]["admitted"] for item in history)
        self.assertEqual(total_applicants, analytics_metrics["applicants"])
        self.assertEqual(total_admitted, analytics_metrics["admitted"])

        # For process 2023-II only non-admitted rows exist, so cutoff must be null.
        history_by_label = {item["process"]["label"]: item for item in history}
        self.assertIsNone(history_by_label["2023-II"]["metrics"]["cutoff_score"])


if __name__ == "__main__":
    unittest.main()
