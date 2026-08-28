from rest_framework.test import APIClient


def test_api_root_advertises_v1_resources():
    response = APIClient().get("/api/v1/")

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "UNMSM Admission Analytics API"
    assert body["version"] == "v1"
    assert body["resources"]["latest_overview"] == "/api/v1/analytics/latest/"
    assert body["resources"]["comparative_overview"] == "/api/v1/analytics/overview/"
