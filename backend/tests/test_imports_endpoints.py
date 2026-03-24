import os
import tempfile
import unittest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

from app.core.db import Base, get_db_session
from app.main import create_app
from app.models.academic import AcademicArea, Faculty, Major
from app.models.admission import AdmissionProcess, AdmissionResult


class ImportsEndpointTests(unittest.TestCase):
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
            area = AcademicArea(id=1, name="Engineering", slug="engineering")
            faculty = Faculty(id=10, name="Systems", slug="systems", academic_area_id=1)
            major_software = Major(
                id=100,
                name="INGENIERÍA DE SOFTWARE",
                slug="software",
                faculty_id=10,
                is_active=True,
            )
            major_networks = Major(
                id=101, name="REDES", slug="networks", faculty_id=10, is_active=True
            )
            process = AdmissionProcess(id=1, year=2024, cycle="I", label="2024-I")

            session.add_all([area, faculty, major_software, major_networks, process])
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
        login = cls.client.post(
            "/auth/admin/login",
            json={
                "username": os.environ.get("ADMIN_USERNAME", "admin"),
                "password": os.environ.get("ADMIN_PASSWORD", "admin123"),
            },
        )
        assert login.status_code == 200
        cls.auth_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    @classmethod
    def tearDownClass(cls) -> None:
        cls.client.close()
        cls.engine.dispose()
        cls.tempdir.cleanup()

    def test_import_results_success_and_summary_shape(self) -> None:
        csv_content = "\n".join(
            [
                "code,lastnames,names,major,score,merit,observation,modality",
                "325838,CASTRO MONTESINOS,SERGIO EDUARDO,INGENIERÍA DE SOFTWARE,1282.875,7,ALCANZÓ VACANTE,EBR",
                "362818,CASTILLO MORI,ÑOL FELIPE,INGENIERÍA DE SOFTWARE,334.125,,,EBA",
            ]
        )
        response = self.client.post(
            "/imports/results",
            data={"process_id": "1"},
            files={"file": ("results.csv", csv_content.encode("utf-8"), "text/csv")},
            headers=self.auth_headers,
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["process_id"], 1)
        self.assertEqual(payload["total_rows"], 2)
        self.assertEqual(payload["imported_rows"], 2)
        self.assertEqual(payload["failed_rows"], 0)
        self.assertEqual(payload["errors"], [])

        with self.session_factory() as session:
            rows = list(
                session.scalars(
                    select(AdmissionResult)
                    .where(AdmissionResult.candidate_code.in_(["325838", "362818"]))
                    .order_by(AdmissionResult.candidate_code.asc())
                ).all()
            )
            self.assertEqual(len(rows), 2)
            self.assertTrue(rows[0].is_admitted)
            self.assertFalse(rows[1].is_admitted)
            self.assertEqual(rows[0].merit_rank, 7)
            self.assertIsNone(rows[1].merit_rank)

    def test_import_results_file_level_failures(self) -> None:
        missing_columns_csv = "\n".join(
            [
                "code,lastnames,names,major,score",
                "1,A,B,INGENIERÍA DE SOFTWARE,1000.0",
            ]
        )
        missing_columns_response = self.client.post(
            "/imports/results",
            data={"process_id": "1"},
            files={
                "file": ("bad.csv", missing_columns_csv.encode("utf-8"), "text/csv")
            },
            headers=self.auth_headers,
        )
        self.assertEqual(missing_columns_response.status_code, 400)
        self.assertIn(
            "missing required columns", missing_columns_response.json()["detail"]
        )

        valid_csv = "\n".join(
            [
                "code,lastnames,names,major,score,merit,observation,modality",
                "1,A,B,INGENIERÍA DE SOFTWARE,1000.0,,,EBR",
            ]
        )
        unknown_process_response = self.client.post(
            "/imports/results",
            data={"process_id": "999"},
            files={"file": ("results.csv", valid_csv.encode("utf-8"), "text/csv")},
            headers=self.auth_headers,
        )
        self.assertEqual(unknown_process_response.status_code, 404)
        self.assertEqual(
            unknown_process_response.json()["detail"], "Admission process not found"
        )

    def test_import_results_row_level_failures(self) -> None:
        csv_content = "\n".join(
            [
                "code,lastnames,names,major,score,merit,observation,modality",
                "1001,UNO,ADMITIDO,INGENIERÍA DE SOFTWARE,900.5,2,ALCANZÓ VACANTE,EBR",
                "1002,DOS,NOADMITIDO,INGENIERÍA DE SOFTWARE,700.0,,,EBR",
                "1003,TRES,UNKNOWN,INGENIERIA X,800.0,,,EBR",
                "1004,CUATRO,BAD SCORE,INGENIERÍA DE SOFTWARE,abc,,,EBR",
                "1005,CINCO,BAD MERIT,INGENIERÍA DE SOFTWARE,850.0,AA,,EBR",
                "1001,SEIS,DUPLICATE,INGENIERÍA DE SOFTWARE,910.0,5,ALCANZÓ VACANTE,EBR",
            ]
        )
        response = self.client.post(
            "/imports/results",
            data={"process_id": "1"},
            files={"file": ("mixed.csv", csv_content.encode("utf-8"), "text/csv")},
            headers=self.auth_headers,
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["total_rows"], 6)
        self.assertEqual(payload["imported_rows"], 2)
        self.assertEqual(payload["failed_rows"], 4)

        reasons = {item["reason"] for item in payload["errors"]}
        self.assertIn("Unknown major: INGENIERIA X", reasons)
        self.assertIn("Invalid score value", reasons)
        self.assertIn("Invalid merit value", reasons)
        self.assertIn("Duplicate row for process, major, and candidate code", reasons)

    def test_import_results_observation_normalization_and_empty_merit(self) -> None:
        csv_content = "\n".join(
            [
                "code,lastnames,names,major,score,merit,observation,modality",
                "2001,SIETE,UPPER,INGENIERÍA DE SOFTWARE,910.0,,ALCANZÓ VACANTE,EBR",
                "2002,OCHO,LOWER,INGENIERÍA DE SOFTWARE,700.0,,alcanzó vacante,EBR",
                "2003,NUEVE,EMPTY,INGENIERÍA DE SOFTWARE,650.0,,,,",
            ]
        )
        response = self.client.post(
            "/imports/results",
            data={"process_id": "1"},
            files={"file": ("norm.csv", csv_content.encode("utf-8"), "text/csv")},
            headers=self.auth_headers,
        )
        self.assertEqual(response.status_code, 200)

        with self.session_factory() as session:
            rows = list(
                session.scalars(
                    select(AdmissionResult)
                    .where(AdmissionResult.candidate_code.in_(["2001", "2002", "2003"]))
                    .order_by(AdmissionResult.candidate_code.asc())
                ).all()
            )
            self.assertEqual(len(rows), 3)
            self.assertTrue(rows[0].is_admitted)
            self.assertTrue(rows[1].is_admitted)
            self.assertFalse(rows[2].is_admitted)
            self.assertIsNone(rows[0].merit_rank)
            self.assertIsNone(rows[1].merit_rank)
            self.assertIsNone(rows[2].merit_rank)

    def test_import_results_sets_zero_score_for_absent_rows(self) -> None:
        csv_content = "\n".join(
            [
                "code,lastnames,names,major,score,merit,observation,modality",
                "3001,DIEZ,AUSENTE CASE,INGENIERÍA DE SOFTWARE,,,AUSENTE,EBR",
                "3002,ONCE,MISSING SCORE,INGENIERÍA DE SOFTWARE,,,,EBR",
            ]
        )
        response = self.client.post(
            "/imports/results",
            data={"process_id": "1"},
            files={"file": ("absent.csv", csv_content.encode("utf-8"), "text/csv")},
            headers=self.auth_headers,
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["total_rows"], 2)
        self.assertEqual(payload["imported_rows"], 1)
        self.assertEqual(payload["failed_rows"], 1)

        with self.session_factory() as session:
            row = session.scalar(
                select(AdmissionResult).where(AdmissionResult.candidate_code == "3001")
            )
            self.assertIsNotNone(row)
            assert row is not None
            self.assertEqual(float(row.score), 0.0)
            self.assertFalse(row.is_admitted)


if __name__ == "__main__":
    unittest.main()
