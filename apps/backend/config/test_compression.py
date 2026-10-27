import gzip

import pytest
from django.test import Client

from modules.academics.models import AcademicArea


def test_api_schema_is_gzipped_and_preserves_cors_and_vary_headers():
    client = Client(HTTP_ACCEPT_ENCODING="gzip", HTTP_ORIGIN="http://localhost:5173")

    response = client.get("/api/schema/")

    assert response.status_code == 200
    assert response["Content-Encoding"] == "gzip"
    assert "accept-encoding" in response["Vary"].lower()
    assert "origin" in response["Vary"].lower()
    assert response["Access-Control-Allow-Origin"] == "http://localhost:5173"
    assert gzip.decompress(response.content).startswith(b"openapi:")


def test_api_response_is_not_gzipped_without_accept_encoding():
    response = Client().get("/api/schema/")

    assert response.status_code == 200
    assert "Content-Encoding" not in response
    assert "accept-encoding" in response["Vary"].lower()


@pytest.mark.django_db
def test_catalog_json_is_identical_after_gzip_decompression():
    AcademicArea.objects.bulk_create(
        [AcademicArea(code=f"A{i}", name=f"Academic area {i} " + "x" * 100) for i in range(20)]
    )
    client = Client(HTTP_ORIGIN="http://localhost:5173")
    plain = client.get("/api/v1/academic-areas/")
    compressed = client.get("/api/v1/academic-areas/", HTTP_ACCEPT_ENCODING="gzip")

    assert compressed.status_code == 200
    assert compressed["Content-Encoding"] == "gzip"
    assert compressed["Content-Type"] == "application/json"
    assert compressed["Access-Control-Allow-Origin"] == "http://localhost:5173"
    assert gzip.decompress(compressed.content) == plain.content
    assert len(compressed.content) < len(plain.content)


def test_small_health_response_is_not_compressed():
    response = Client().get("/health/", HTTP_ACCEPT_ENCODING="gzip")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert "Content-Encoding" not in response
