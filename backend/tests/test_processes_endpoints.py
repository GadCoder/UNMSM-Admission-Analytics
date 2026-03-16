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


class ProcessesEndpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.tempdir = tempfile.TemporaryDirectory()
        cls.db_path = f"{cls.tempdir.name}/test.db"
        cls.engine = create_engine(f"sqlite+pysqlite:///{cls.db_path}", future=True)
        cls.session_factory = sessionmaker(bind=cls.engine, autoflush=False, autocommit=False, future=True)

        Base.metadata.create_all(bind=cls.engine)

        with cls.session_factory() as session:
            area = AcademicArea(id=1, name="Health Sciences", slug="health-sciences")
            faculty = Faculty(id=1, name="Medicine", slug="medicine", academic_area_id=1)
            major_nursing = Major(id=1, name="Nursing", slug="nursing", faculty_id=1, is_active=True)
            major_dentistry = Major(id=2, name="Dentistry", slug="dentistry", faculty_id=1, is_active=True)

            process_2024_i = AdmissionProcess(id=1, year=2024, cycle="I", label="2024-I")
            process_2024_ii = AdmissionProcess(id=2, year=2024, cycle="II", label="2024-II")
            process_2023_i = AdmissionProcess(id=3, year=2023, cycle="I", label="2023-I")
            process_2022_ii = AdmissionProcess(id=4, year=2022, cycle="II", label="2022-II")

            results = [
                AdmissionResult(
                    id=1,
                    admission_process_id=1,
                    major_id=1,
                    candidate_code="C001",
                    candidate_lastnames="Doe",
                    candidate_names="Ana",
                    score=Decimal("750.0"),
                    merit_rank=1,
                    observation_raw=None,
                    is_admitted=True,
                    row_number=1,
                ),
                AdmissionResult(
                    id=2,
                    admission_process_id=1,
                    major_id=1,
                    candidate_code="C002",
                    candidate_lastnames="Doe",
                    candidate_names="Luis",
                    score=Decimal("700.0"),
                    merit_rank=3,
                    observation_raw=None,
                    is_admitted=False,
                    row_number=2,
                ),
                AdmissionResult(
                    id=3,
                    admission_process_id=1,
                    major_id=2,
                    candidate_code="C003",
                    candidate_lastnames="Perez",
                    candidate_names="Maria",
                    score=Decimal("710.0"),
                    merit_rank=2,
                    observation_raw=None,
                    is_admitted=False,
                    row_number=3,
                ),
                AdmissionResult(
                    id=4,
                    admission_process_id=3,
                    major_id=2,
                    candidate_code="C004",
                    candidate_lastnames="Rios",
                    candidate_names="Jorge",
                    score=Decimal("690.0"),
                    merit_rank=10,
                    observation_raw=None,
                    is_admitted=True,
                    row_number=1,
                ),
            ]

            session.add_all(
                [
                    area,
                    faculty,
                    major_nursing,
                    major_dentistry,
                    process_2024_i,
                    process_2024_ii,
                    process_2023_i,
                    process_2022_ii,
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

    def test_list_processes_returns_full_dataset_newest_first(self) -> None:
        response = self.client.get("/processes")
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        self.assertEqual([item["id"] for item in payload], [2, 1, 3, 4])
        self.assertEqual(
            payload[0],
            {
                "id": 2,
                "year": 2024,
                "cycle": "II",
                "label": "2024-II",
            },
        )

    def test_get_process_detail_success_and_not_found(self) -> None:
        response = self.client.get("/processes/1")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "id": 1,
                "year": 2024,
                "cycle": "I",
                "label": "2024-I",
            },
        )

        missing_response = self.client.get("/processes/999")
        self.assertEqual(missing_response.status_code, 404)
        self.assertEqual(missing_response.json()["detail"], "Admission process not found")

    def test_get_process_overview_returns_aggregates(self) -> None:
        response = self.client.get("/processes/1/overview")
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        self.assertEqual(payload["process"], {"id": 1, "year": 2024, "cycle": "I", "label": "2024-I"})
        self.assertEqual(payload["total_applicants"], 3)
        self.assertEqual(payload["total_admitted"], 1)
        self.assertAlmostEqual(payload["acceptance_rate"], 1 / 3, places=6)
        self.assertEqual(payload["total_majors"], 2)

    def test_get_process_overview_handles_zero_applicants(self) -> None:
        response = self.client.get("/processes/2/overview")
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        self.assertEqual(payload["total_applicants"], 0)
        self.assertEqual(payload["total_admitted"], 0)
        self.assertEqual(payload["acceptance_rate"], 0.0)
        self.assertEqual(payload["total_majors"], 0)

    def test_get_process_overview_returns_not_found_for_missing_process(self) -> None:
        response = self.client.get("/processes/999/overview")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Admission process not found")


if __name__ == "__main__":
    unittest.main()
