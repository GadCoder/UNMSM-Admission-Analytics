import os
import tempfile
import unittest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

from app.core.db import Base, get_db_session
from app.main import create_app
from app.models.academic import AcademicArea, Faculty, Major


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


if __name__ == "__main__":
    unittest.main()
