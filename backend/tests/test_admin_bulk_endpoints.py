import os
import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("ADMIN_USERNAME", "admin")
os.environ.setdefault("ADMIN_PASSWORD", "admin123")
os.environ.setdefault("AUTH_JWT_SECRET", "test-secret")
os.environ.setdefault("S3_BUCKET", "test-bucket")

from app.api.routes import imports as imports_routes
from app.core.config import get_settings
from app.core.db import Base, get_db_session
from app.main import create_app
from app.models.academic import AcademicArea, Faculty, Major
from app.models.admission import AdmissionProcess
from app.models.imports import ImportBatchItem, ImportSourceFile
from app.services.bulk_imports import BulkImportService


class InMemoryStorageService:
    def __init__(self) -> None:
        self.bucket = "test-bucket"
        self.objects: dict[str, bytes] = {}

    def upload_bytes(
        self, object_key: str, payload: bytes, content_type: str
    ) -> tuple[str, str]:
        self.objects[object_key] = payload
        return self.bucket, object_key

    def get_bytes(self, object_key: str) -> bytes:
        return self.objects[object_key]

    def delete_prefix_older_than(self, *, prefix: str, age_hours: int) -> int:
        del age_hours
        keys = [key for key in self.objects if key.startswith(prefix)]
        for key in keys:
            del self.objects[key]
        return len(keys)


class NoopProcessBulkImportService(BulkImportService):
    def process_batch(self, batch_id: int) -> None:
        del batch_id


class AdminBulkEndpointsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        get_settings.cache_clear()

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

        storage_service: Any = InMemoryStorageService()
        cls.bulk_service = NoopProcessBulkImportService(storage_service=storage_service)

        app.dependency_overrides[get_db_session] = override_get_db_session
        app.dependency_overrides[imports_routes.get_bulk_import_service] = lambda: (
            cls.bulk_service
        )
        cls.client = TestClient(app)

        login = cls.client.post(
            "/auth/admin/login",
            json={"username": "admin", "password": "admin123"},
        )
        assert login.status_code == 200
        cls.admin_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    @classmethod
    def tearDownClass(cls) -> None:
        cls.client.close()
        cls.engine.dispose()
        cls.tempdir.cleanup()

    def test_admin_guard_returns_401_without_token(self) -> None:
        response = self.client.get("/admin/areas")
        self.assertEqual(response.status_code, 401)

    def test_admin_guard_returns_403_for_non_admin_role(self) -> None:
        settings = get_settings()
        token = jwt.encode(
            {
                "sub": "readonly",
                "role": "viewer",
                "exp": datetime.now(tz=UTC) + timedelta(minutes=30),
            },
            settings.auth_jwt_secret,
            algorithm=settings.auth_jwt_algorithm,
        )
        response = self.client.get(
            "/admin/areas", headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(response.status_code, 403)

    def test_admin_update_returns_409_on_stale_version(self) -> None:
        create_response = self.client.post(
            "/admin/areas",
            json={"name": "Health", "slug": "health"},
            headers=self.admin_headers,
        )
        self.assertEqual(create_response.status_code, 200)
        payload = create_response.json()

        first_update = self.client.put(
            f"/admin/areas/{payload['id']}",
            json={
                "name": "Health Sciences",
                "slug": "health-sciences",
                "version_token": payload["updated_at"],
            },
            headers=self.admin_headers,
        )
        self.assertEqual(first_update.status_code, 200)

        with self.session_factory() as session:
            area = session.get(AcademicArea, payload["id"])
            assert area is not None
            area.updated_at = datetime.now(tz=UTC) + timedelta(seconds=3)
            session.commit()

        stale_update = self.client.put(
            f"/admin/areas/{payload['id']}",
            json={
                "name": "Health Sciences Updated",
                "slug": "health-sciences-updated",
                "version_token": payload["updated_at"],
            },
            headers=self.admin_headers,
        )
        self.assertEqual(stale_update.status_code, 409)

    def test_admin_process_create_and_update(self) -> None:
        create_response = self.client.post(
            "/admin/processes",
            json={
                "year": 2026,
                "cycle": "II",
                "is_published": True,
            },
            headers=self.admin_headers,
        )
        self.assertEqual(create_response.status_code, 200)
        payload = create_response.json()
        self.assertEqual(payload["label"], "2026-II")

        update_response = self.client.put(
            f"/admin/processes/{payload['id']}",
            json={
                "year": 2026,
                "cycle": "I",
                "is_published": False,
                "version_token": payload["updated_at"],
            },
            headers=self.admin_headers,
        )
        self.assertEqual(update_response.status_code, 200)
        updated = update_response.json()
        self.assertEqual(updated["label"], "2026-I")
        self.assertFalse(updated["is_published"])

    def test_admin_process_rejects_invalid_cycle(self) -> None:
        response = self.client.post(
            "/admin/processes",
            json={
                "year": 2026,
                "cycle": "III",
                "is_published": True,
            },
            headers=self.admin_headers,
        )
        self.assertEqual(response.status_code, 422)

    def test_bulk_batch_creation_persists_source_metadata(self) -> None:
        csv_content = "\n".join(
            [
                "code,lastnames,names,major,score,merit,observation,modality",
                "4001,TEST,ONE,INGENIERÍA DE SOFTWARE,900.1,1,ALCANZÓ VACANTE,EBR",
            ]
        )

        response = self.client.post(
            "/imports/results/batches",
            data={"process_id": "1"},
            files={"files": ("batch-1.csv", csv_content.encode("utf-8"), "text/csv")},
            headers=self.admin_headers,
        )
        self.assertEqual(response.status_code, 200)

        with self.session_factory() as session:
            source_file = session.scalar(
                select(ImportSourceFile)
                .where(ImportSourceFile.original_filename == "batch-1.csv")
                .order_by(ImportSourceFile.id.desc())
            )
            self.assertIsNotNone(source_file)
            assert source_file is not None
            self.assertEqual(source_file.s3_bucket, "test-bucket")
            self.assertTrue(source_file.s3_object_key.startswith("imports/"))
            self.assertEqual(source_file.original_filename, "batch-1.csv")
            self.assertEqual(source_file.admission_process_id, 1)
            self.assertEqual(source_file.major_id, 100)
            self.assertEqual(len(source_file.checksum_sha256), 64)

    def test_bulk_batch_cancel_and_retry_flows(self) -> None:
        csv_1 = "\n".join(
            [
                "code,lastnames,names,major,score,merit,observation,modality",
                "5001,TEST,ONE,INGENIERÍA DE SOFTWARE,880.0,2,ALCANZÓ VACANTE,EBR",
            ]
        )
        csv_2 = "\n".join(
            [
                "code,lastnames,names,major,score,merit,observation,modality",
                "5002,TEST,TWO,REDES,810.0,3,,EBR",
            ]
        )
        create_response = self.client.post(
            "/imports/results/batches",
            data={"process_id": "1"},
            files=[
                ("files", ("batch-a.csv", csv_1.encode("utf-8"), "text/csv")),
                ("files", ("batch-b.csv", csv_2.encode("utf-8"), "text/csv")),
            ],
            headers=self.admin_headers,
        )
        self.assertEqual(create_response.status_code, 200)
        batch_id = create_response.json()["batch_id"]

        with self.session_factory() as session:
            items = list(
                session.scalars(
                    select(ImportBatchItem)
                    .where(ImportBatchItem.batch_id == batch_id)
                    .order_by(ImportBatchItem.id.asc())
                ).all()
            )
            self.assertEqual(len(items), 2)
            items[0].status = "failed"
            items[0].failure_reason = "synthetic failure"
            session.commit()

        retry_response = self.client.post(
            f"/imports/results/batches/{batch_id}/retry", headers=self.admin_headers
        )
        self.assertEqual(retry_response.status_code, 200)
        retry_payload = retry_response.json()
        self.assertGreaterEqual(retry_payload["queued_items"], 1)

        cancel_response = self.client.post(
            f"/imports/results/batches/{batch_id}/cancel", headers=self.admin_headers
        )
        self.assertEqual(cancel_response.status_code, 200)
        cancel_payload = cancel_response.json()
        self.assertEqual(cancel_payload["queued_items"], 0)
        self.assertGreaterEqual(cancel_payload["cancelled_items"], 1)


if __name__ == "__main__":
    unittest.main()
