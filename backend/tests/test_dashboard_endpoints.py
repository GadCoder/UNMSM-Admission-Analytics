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


class DashboardEndpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.tempdir = tempfile.TemporaryDirectory()
        cls.db_path = f"{cls.tempdir.name}/test.db"
        cls.engine = create_engine(f"sqlite+pysqlite:///{cls.db_path}", future=True)
        cls.session_factory = sessionmaker(
            bind=cls.engine, autoflush=False, autocommit=False, future=True
        )
        Base.metadata.create_all(bind=cls.engine)

        with cls.session_factory() as session:
            area_eng = AcademicArea(id=1, name="Engineering", slug="engineering")
            area_health = AcademicArea(
                id=2, name="Health Sciences", slug="health-sciences"
            )

            faculty_sys = Faculty(
                id=10, academic_area_id=1, name="Systems", slug="systems"
            )
            faculty_civil = Faculty(
                id=11, academic_area_id=1, name="Civil", slug="civil"
            )
            faculty_med = Faculty(
                id=20, academic_area_id=2, name="Medicine", slug="medicine"
            )

            major_soft = Major(
                id=100, faculty_id=10, name="Software", slug="software", is_active=True
            )
            major_networks = Major(
                id=101, faculty_id=10, name="Networks", slug="networks", is_active=True
            )
            major_civil = Major(
                id=102,
                faculty_id=11,
                name="Civil Eng",
                slug="civil-eng",
                is_active=True,
            )
            major_nursing = Major(
                id=103, faculty_id=20, name="Nursing", slug="nursing", is_active=True
            )

            process_1 = AdmissionProcess(id=1, year=2023, cycle="II", label="2023-II")
            process_2 = AdmissionProcess(id=2, year=2024, cycle="I", label="2024-I")
            process_3 = AdmissionProcess(id=3, year=2024, cycle="II", label="2024-II")

            results = [
                AdmissionResult(
                    id=1,
                    admission_process_id=1,
                    major_id=100,
                    candidate_code="A1",
                    candidate_lastnames="AAA",
                    candidate_names="ONE",
                    score=Decimal("700.0"),
                    merit_rank=1,
                    observation_raw=None,
                    is_admitted=True,
                    row_number=1,
                ),
                AdmissionResult(
                    id=2,
                    admission_process_id=1,
                    major_id=100,
                    candidate_code="A2",
                    candidate_lastnames="AAA",
                    candidate_names="TWO",
                    score=Decimal("650.0"),
                    merit_rank=2,
                    observation_raw=None,
                    is_admitted=False,
                    row_number=2,
                ),
                AdmissionResult(
                    id=3,
                    admission_process_id=1,
                    major_id=101,
                    candidate_code="B1",
                    candidate_lastnames="BBB",
                    candidate_names="ONE",
                    score=Decimal("800.0"),
                    merit_rank=1,
                    observation_raw=None,
                    is_admitted=True,
                    row_number=1,
                ),
                AdmissionResult(
                    id=4,
                    admission_process_id=1,
                    major_id=101,
                    candidate_code="B2",
                    candidate_lastnames="BBB",
                    candidate_names="TWO",
                    score=Decimal("760.0"),
                    merit_rank=2,
                    observation_raw=None,
                    is_admitted=True,
                    row_number=2,
                ),
                AdmissionResult(
                    id=5,
                    admission_process_id=1,
                    major_id=101,
                    candidate_code="B3",
                    candidate_lastnames="BBB",
                    candidate_names="THREE",
                    score=Decimal("500.0"),
                    merit_rank=3,
                    observation_raw=None,
                    is_admitted=False,
                    row_number=3,
                ),
                AdmissionResult(
                    id=6,
                    admission_process_id=1,
                    major_id=102,
                    candidate_code="C1",
                    candidate_lastnames="CCC",
                    candidate_names="ONE",
                    score=Decimal("600.0"),
                    merit_rank=6,
                    observation_raw=None,
                    is_admitted=False,
                    row_number=1,
                ),
                AdmissionResult(
                    id=7,
                    admission_process_id=1,
                    major_id=103,
                    candidate_code="D1",
                    candidate_lastnames="DDD",
                    candidate_names="ONE",
                    score=Decimal("900.0"),
                    merit_rank=1,
                    observation_raw=None,
                    is_admitted=True,
                    row_number=1,
                ),
                AdmissionResult(
                    id=8,
                    admission_process_id=2,
                    major_id=100,
                    candidate_code="E1",
                    candidate_lastnames="EEE",
                    candidate_names="ONE",
                    score=Decimal("710.0"),
                    merit_rank=1,
                    observation_raw=None,
                    is_admitted=True,
                    row_number=1,
                ),
                AdmissionResult(
                    id=9,
                    admission_process_id=2,
                    major_id=101,
                    candidate_code="E2",
                    candidate_lastnames="EEE",
                    candidate_names="TWO",
                    score=Decimal("780.0"),
                    merit_rank=2,
                    observation_raw=None,
                    is_admitted=False,
                    row_number=2,
                ),
                AdmissionResult(
                    id=10,
                    admission_process_id=2,
                    major_id=102,
                    candidate_code="E3",
                    candidate_lastnames="EEE",
                    candidate_names="THREE",
                    score=Decimal("680.0"),
                    merit_rank=3,
                    observation_raw=None,
                    is_admitted=True,
                    row_number=3,
                ),
                AdmissionResult(
                    id=11,
                    admission_process_id=3,
                    major_id=100,
                    candidate_code="F1",
                    candidate_lastnames="FFF",
                    candidate_names="ONE",
                    score=Decimal("600.0"),
                    merit_rank=5,
                    observation_raw=None,
                    is_admitted=False,
                    row_number=1,
                ),
                AdmissionResult(
                    id=12,
                    admission_process_id=3,
                    major_id=103,
                    candidate_code="F2",
                    candidate_lastnames="FFF",
                    candidate_names="TWO",
                    score=Decimal("920.0"),
                    merit_rank=1,
                    observation_raw=None,
                    is_admitted=True,
                    row_number=2,
                ),
                AdmissionResult(
                    id=13,
                    admission_process_id=3,
                    major_id=103,
                    candidate_code="F3",
                    candidate_lastnames="FFF",
                    candidate_names="THREE",
                    score=Decimal("910.0"),
                    merit_rank=2,
                    observation_raw=None,
                    is_admitted=True,
                    row_number=3,
                ),
            ]

            session.add_all(
                [
                    area_eng,
                    area_health,
                    faculty_sys,
                    faculty_civil,
                    faculty_med,
                    major_soft,
                    major_networks,
                    major_civil,
                    major_nursing,
                    process_1,
                    process_2,
                    process_3,
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

    def test_overview_endpoint_returns_aggregates_and_scoped_filters(self) -> None:
        response = self.client.get("/dashboard/overview?process_id=1")
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        self.assertEqual(payload["filters"]["process_id"], 1)
        self.assertEqual(payload["metrics"]["total_applicants"], 7)
        self.assertEqual(payload["metrics"]["total_admitted"], 4)
        self.assertAlmostEqual(payload["metrics"]["acceptance_rate"], 4 / 7, places=6)
        self.assertEqual(payload["metrics"]["total_majors"], 4)

        scoped = self.client.get("/dashboard/overview?process_id=1&faculty_id=10")
        self.assertEqual(scoped.status_code, 200)
        scoped_payload = scoped.json()
        self.assertEqual(scoped_payload["metrics"]["total_applicants"], 5)
        self.assertEqual(scoped_payload["metrics"]["total_admitted"], 3)
        self.assertEqual(scoped_payload["metrics"]["total_majors"], 2)

    def test_rankings_endpoint_returns_dual_lists_and_limit(self) -> None:
        unbounded = self.client.get("/dashboard/rankings?process_id=1")
        self.assertEqual(unbounded.status_code, 200)
        unbounded_payload = unbounded.json()
        self.assertIsNone(unbounded_payload["filters"]["limit"])
        self.assertEqual(len(unbounded_payload["most_competitive"]), 4)
        self.assertEqual(len(unbounded_payload["most_popular"]), 4)

        response = self.client.get("/dashboard/rankings?process_id=1&limit=2")
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        self.assertEqual(payload["filters"]["limit"], 2)
        self.assertEqual(len(payload["most_competitive"]), 2)
        self.assertEqual(len(payload["most_popular"]), 2)
        self.assertEqual(
            [item["major"]["id"] for item in payload["most_competitive"]], [103, 101]
        )
        self.assertEqual(
            [item["major"]["id"] for item in payload["most_popular"]], [101, 100]
        )

        scoped = self.client.get("/dashboard/rankings?process_id=1&faculty_id=10")
        self.assertEqual(scoped.status_code, 200)
        scoped_payload = scoped.json()
        self.assertEqual(
            {item["major"]["id"] for item in scoped_payload["most_competitive"]},
            {100, 101},
        )
        self.assertEqual(
            {item["major"]["id"] for item in scoped_payload["most_popular"]}, {100, 101}
        )

    def test_trend_endpoints_return_ordered_aggregate_series(self) -> None:
        applicants = self.client.get("/dashboard/trends/applicants")
        self.assertEqual(applicants.status_code, 200)
        applicants_payload = applicants.json()["items"]
        self.assertEqual(
            [item["process"]["id"] for item in applicants_payload], [1, 2, 3]
        )
        self.assertEqual([item["applicants"] for item in applicants_payload], [7, 3, 3])

        applicants_scoped = self.client.get(
            "/dashboard/trends/applicants?academic_area_id=2"
        )
        self.assertEqual(applicants_scoped.status_code, 200)
        scoped_items = applicants_scoped.json()["items"]
        self.assertEqual([item["process"]["id"] for item in scoped_items], [1, 3])
        self.assertEqual([item["applicants"] for item in scoped_items], [1, 2])

        cutoff = self.client.get("/dashboard/trends/cutoff")
        self.assertEqual(cutoff.status_code, 200)
        cutoff_payload = cutoff.json()["items"]
        self.assertEqual([item["process"]["id"] for item in cutoff_payload], [1, 2, 3])
        self.assertAlmostEqual(
            cutoff_payload[0]["avg_cutoff_score"], (700.0 + 760.0 + 900.0) / 3, places=6
        )
        self.assertAlmostEqual(
            cutoff_payload[1]["avg_cutoff_score"], (710.0 + 680.0) / 2, places=6
        )
        self.assertAlmostEqual(cutoff_payload[2]["avg_cutoff_score"], 910.0, places=6)

    def test_dashboard_validation_for_required_and_hierarchy_filters(self) -> None:
        missing_process = self.client.get("/dashboard/overview")
        self.assertEqual(missing_process.status_code, 422)

        missing_process_rankings = self.client.get("/dashboard/rankings")
        self.assertEqual(missing_process_rankings.status_code, 422)

        unknown_area = self.client.get(
            "/dashboard/trends/applicants?academic_area_id=999"
        )
        self.assertEqual(unknown_area.status_code, 404)
        self.assertEqual(unknown_area.json()["detail"], "Academic area not found")

        unknown_faculty = self.client.get("/dashboard/trends/cutoff?faculty_id=999")
        self.assertEqual(unknown_faculty.status_code, 404)
        self.assertEqual(unknown_faculty.json()["detail"], "Faculty not found")

        mismatch = self.client.get(
            "/dashboard/rankings?process_id=1&academic_area_id=2&faculty_id=10"
        )
        self.assertEqual(mismatch.status_code, 422)
        self.assertIn("faculty does not belong", mismatch.json()["detail"])

    def test_dashboard_overview_and_rankings_unknown_process(self) -> None:
        overview = self.client.get("/dashboard/overview?process_id=999")
        self.assertEqual(overview.status_code, 404)
        self.assertEqual(overview.json()["detail"], "Admission process not found")

        rankings = self.client.get("/dashboard/rankings?process_id=999")
        self.assertEqual(rankings.status_code, 404)
        self.assertEqual(rankings.json()["detail"], "Admission process not found")


if __name__ == "__main__":
    unittest.main()
