import gzip

from django.test import Client


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
