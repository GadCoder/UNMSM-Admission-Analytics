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


class RankingsEndpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.tempdir = tempfile.TemporaryDirectory()
        cls.db_path = f"{cls.tempdir.name}/test.db"
        cls.engine = create_engine(f"sqlite+pysqlite:///{cls.db_path}", future=True)
        cls.session_factory = sessionmaker(bind=cls.engine, autoflush=False, autocommit=False, future=True)

        Base.metadata.create_all(bind=cls.engine)

        with cls.session_factory() as session:
            area_eng = AcademicArea(id=1, name="Engineering", slug="engineering")
            area_health = AcademicArea(id=2, name="Health Sciences", slug="health-sciences")

            faculty_sys = Faculty(id=10, academic_area_id=1, name="Systems", slug="systems")
            faculty_civil = Faculty(id=11, academic_area_id=1, name="Civil", slug="civil")
            faculty_med = Faculty(id=20, academic_area_id=2, name="Medicine", slug="medicine")

            major_soft = Major(id=100, faculty_id=10, name="Software", slug="software", is_active=True)
            major_networks = Major(id=101, faculty_id=10, name="Networks", slug="networks", is_active=True)
            major_civil = Major(id=102, faculty_id=11, name="Civil Eng", slug="civil-eng", is_active=True)
            major_nursing = Major(id=103, faculty_id=20, name="Nursing", slug="nursing", is_active=True)

            process_1 = AdmissionProcess(id=1, year=2024, cycle="I", label="2024-I")
            process_2 = AdmissionProcess(id=2, year=2024, cycle="II", label="2024-II")

            results = [
                AdmissionResult(
                    id=1,
                    admission_process_id=1,
                    major_id=100,
                    candidate_code="A1",
                    candidate_lastnames="AAA",
                    candidate_names="ONE",
                    score=Decimal("800.0"),
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
                    score=Decimal("700.0"),
                    merit_rank=2,
                    observation_raw=None,
                    is_admitted=True,
                    row_number=2,
                ),
                AdmissionResult(
                    id=3,
                    admission_process_id=1,
                    major_id=101,
                    candidate_code="B1",
                    candidate_lastnames="BBB",
                    candidate_names="ONE",
                    score=Decimal("900.0"),
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
                    score=Decimal("650.0"),
                    merit_rank=3,
                    observation_raw=None,
                    is_admitted=False,
                    row_number=2,
                ),
                AdmissionResult(
                    id=5,
                    admission_process_id=1,
                    major_id=101,
                    candidate_code="B3",
                    candidate_lastnames="BBB",
                    candidate_names="THREE",
                    score=Decimal("600.0"),
                    merit_rank=4,
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
                    score=Decimal("500.0"),
                    merit_rank=5,
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
                    score=Decimal("950.0"),
                    merit_rank=1,
                    observation_raw=None,
                    is_admitted=True,
                    row_number=1,
                ),
                AdmissionResult(
                    id=8,
                    admission_process_id=2,
                    major_id=100,
                    candidate_code="X1",
                    candidate_lastnames="XXX",
                    candidate_names="ONE",
                    score=Decimal("300.0"),
                    merit_rank=9,
                    observation_raw=None,
                    is_admitted=False,
                    row_number=1,
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

    def test_required_params_and_metric_allowlist_validation(self) -> None:
        missing_process = self.client.get("/rankings/majors?metric=cutoff_score")
        self.assertEqual(missing_process.status_code, 422)

        missing_metric = self.client.get("/rankings/majors?process_id=1")
        self.assertEqual(missing_metric.status_code, 422)

        invalid_metric = self.client.get("/rankings/majors?process_id=1&metric=avg_score")
        self.assertEqual(invalid_metric.status_code, 422)

    def test_sort_order_and_rank_positions(self) -> None:
        by_cutoff_desc = self.client.get("/rankings/majors?process_id=1&metric=cutoff_score")
        self.assertEqual(by_cutoff_desc.status_code, 200)
        payload = by_cutoff_desc.json()["items"]
        self.assertEqual([item["rank"] for item in payload], [1, 2, 3, 4])
        self.assertEqual(payload[0]["major"]["id"], 103)
        self.assertEqual(payload[1]["major"]["id"], 101)
        self.assertEqual(payload[2]["major"]["id"], 100)
        self.assertEqual(payload[3]["major"]["id"], 102)

        by_acceptance_asc = self.client.get("/rankings/majors?process_id=1&metric=acceptance_rate&sort_order=asc")
        self.assertEqual(by_acceptance_asc.status_code, 200)
        payload_asc = by_acceptance_asc.json()["items"]
        self.assertEqual([item["major"]["id"] for item in payload_asc], [102, 101, 103, 100])

    def test_hierarchy_filters_and_limit(self) -> None:
        by_faculty = self.client.get("/rankings/majors?process_id=1&metric=applicants&faculty_id=10")
        self.assertEqual(by_faculty.status_code, 200)
        payload = by_faculty.json()["items"]
        self.assertEqual(len(payload), 2)
        self.assertEqual({item["faculty"]["id"] for item in payload}, {10})

        by_area = self.client.get("/rankings/majors?process_id=1&metric=admitted&academic_area_id=2")
        self.assertEqual(by_area.status_code, 200)
        area_payload = by_area.json()["items"]
        self.assertEqual(len(area_payload), 1)
        self.assertEqual(area_payload[0]["major"]["id"], 103)

        limited = self.client.get("/rankings/majors?process_id=1&metric=applicants&limit=2")
        self.assertEqual(limited.status_code, 200)
        self.assertEqual(len(limited.json()["items"]), 2)

    def test_ranking_item_contains_context_and_core_metrics(self) -> None:
        response = self.client.get("/rankings/majors?process_id=1&metric=applicants")
        self.assertEqual(response.status_code, 200)
        item = response.json()["items"][0]

        self.assertIn("rank", item)
        self.assertIn("major", item)
        self.assertIn("faculty", item)
        self.assertIn("academic_area", item)
        self.assertIn("applicants", item)
        self.assertIn("admitted", item)
        self.assertIn("acceptance_rate", item)
        self.assertIn("cutoff_score", item)


if __name__ == "__main__":
    unittest.main()
