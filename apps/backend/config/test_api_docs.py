import json

from rest_framework.test import APIClient


def test_openapi_schema_exposes_versioned_api_paths():
    response = APIClient().get("/api/schema/", HTTP_ACCEPT="application/json")

    assert response.status_code == 200
    schema = json.loads(response.content)
    assert schema["openapi"].startswith("3.")
    assert "/health/" in schema["paths"]
    assert "/api/v1/" in schema["paths"]
    assert "/api/v1/processes/" in schema["paths"]
    assert "/api/v1/analytics/latest/" in schema["paths"]
    assert "get" in schema["paths"]["/api/v1/analytics/latest/"]
    overview = schema["paths"]["/api/v1/analytics/overview/"]["get"]
    parameters = {parameter["name"]: parameter for parameter in overview["parameters"]}
    assert set(parameters) == {"process", "compare"}
    assert parameters["process"]["required"] is True
    assert "comma-separated" in parameters["process"]["description"]
    assert parameters["compare"].get("required", False) is False


def test_swagger_ui_is_available():
    response = APIClient().get("/api/docs/")

    assert response.status_code == 200
    assert b"SwaggerUIBundle" in response.content


def test_redoc_is_available():
    response = APIClient().get("/api/redoc/")

    assert response.status_code == 200
    assert b"<redoc" in response.content
