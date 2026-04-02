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


class ResultsEndpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.tempdir = tempfile.TemporaryDirectory()
        cls.db_path = f"{cls.tempdir.name}/test.db"
        cls.engine = create_engine(f"sqlite+pysqlite:///{cls.db_path}", future=True)
        cls.session_factory = sessionmaker(bind=cls.engine, autoflush=False, autocommit=False, future=True)

        Base.metadata.create_all(bind=cls.engine)

        with cls.session_factory() as session:
            area_engineering = AcademicArea(id=1, name="Engineering", slug="engineering")
            area_health = AcademicArea(id=2, name="Health Sciences", slug="health-sciences")

            faculty_systems = Faculty(id=10, academic_area_id=1, name="Systems Engineering", slug="systems")
            faculty_medicine = Faculty(id=20, academic_area_id=2, name="Medicine", slug="medicine")

            major_software = Major(id=100, faculty_id=10, name="Software Engineering", slug="software", is_active=True)
            major_networks = Major(id=101, faculty_id=10, name="Networks", slug="networks", is_active=True)
            major_nursing = Major(id=102, faculty_id=20, name="Nursing", slug="nursing", is_active=True)

            process_2024_i = AdmissionProcess(id=1, year=2024, cycle="I", label="2024-I")
            process_2024_ii = AdmissionProcess(id=2, year=2024, cycle="II", label="2024-II")

            results = [
                AdmissionResult(
                    id=1,
                    admission_process_id=1,
                    major_id=100,
                    candidate_code="C001",
                    candidate_lastnames="ABREGU COTRINA",
                    candidate_names="DAVY",
                    score=Decimal("824.8750"),
                    merit_rank=12,
                    observation_raw=None,
                    is_admitted=True,
                    row_number=1,
                ),
                AdmissionResult(
                    id=2,
                    admission_process_id=1,
                    major_id=100,
                    candidate_code="C002",
                    candidate_lastnames="PEREZ GOMEZ",
                    candidate_names="ANA MARIA",
                    score=Decimal("765.5000"),
                    merit_rank=20,
                    observation_raw="OBS",
                    is_admitted=True,
                    row_number=2,
                ),
                AdmissionResult(
                    id=3,
                    admission_process_id=1,
                    major_id=101,
                    candidate_code="C003",
                    candidate_lastnames="RAMOS DIAZ",
                    candidate_names="LUIS",
                    score=Decimal("680.0000"),
                    merit_rank=50,
                    observation_raw=None,
                    is_admitted=False,
                    row_number=3,
                ),
                AdmissionResult(
                    id=4,
                    admission_process_id=2,
                    major_id=102,
                    candidate_code="C004",
                    candidate_lastnames="QUISPE LUNA",
                    candidate_names="ROSA",
                    score=Decimal("720.2500"),
                    merit_rank=30,
                    observation_raw=None,
                    is_admitted=True,
                    row_number=1,
                ),
                AdmissionResult(
                    id=5,
                    admission_process_id=2,
                    major_id=100,
                    candidate_code="C005",
                    candidate_lastnames="SALAZAR TORRES",
                    candidate_names="DAVID",
                    score=Decimal("610.0000"),
                    merit_rank=None,
                    observation_raw=None,
                    is_admitted=False,
                    row_number=2,
                ),
            ]

            session.add_all(
                [
                    area_engineering,
                    area_health,
                    faculty_systems,
                    faculty_medicine,
                    major_software,
                    major_networks,
                    major_nursing,
                    process_2024_i,
                    process_2024_ii,
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

    def test_results_filters_cover_requested_fields(self) -> None:
        response = self.client.get("/results?process_id=1&major_id=100&candidate_code=C001&is_admitted=true")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["items"][0]["candidate_code"], "C001")

        response = self.client.get("/results?faculty_id=10")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total"], 4)

        response = self.client.get("/results?academic_area_id=2")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total"], 1)
        self.assertEqual(response.json()["items"][0]["candidate_code"], "C004")

        response = self.client.get("/results?candidate_name=abregu%20davy")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total"], 1)
        self.assertEqual(response.json()["items"][0]["candidate_code"], "C001")

        response = self.client.get("/results?score_min=700&score_max=800")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total"], 2)

    def test_results_pagination_metadata_and_page_slice(self) -> None:
        response = self.client.get("/results?page=2&page_size=2&sort_by=score&sort_order=desc")
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        self.assertEqual(payload["total"], 5)
        self.assertEqual(payload["page"], 2)
        self.assertEqual(payload["page_size"], 2)
        self.assertEqual(payload["total_pages"], 3)
        self.assertEqual(len(payload["items"]), 2)

    def test_results_sort_defaults_and_invalid_sort_validation(self) -> None:
        response = self.client.get("/results")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        scores = [item["score"] for item in payload["items"]]
        self.assertEqual(scores, sorted(scores, reverse=True))

        invalid_sort = self.client.get("/results?sort_by=created_at")
        self.assertEqual(invalid_sort.status_code, 422)

    def test_result_items_include_required_context_objects(self) -> None:
        response = self.client.get("/results?candidate_code=C001")
        self.assertEqual(response.status_code, 200)

        item = response.json()["items"][0]
        self.assertEqual(item["process"], {"id": 1, "year": 2024, "cycle": "I", "label": "2024-I"})
        self.assertEqual(item["major"], {"id": 100, "name": "Software Engineering", "slug": "software"})
        self.assertEqual(item["faculty"], {"id": 10, "name": "Systems Engineering", "slug": "systems"})
        self.assertEqual(item["academic_area"], {"id": 1, "name": "Engineering", "slug": "engineering"})


if __name__ == "__main__":
    unittest.main()
