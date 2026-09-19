from fastapi.testclient import TestClient

from app.main import app


def test_list_scenarios_returns_catalog():
    client = TestClient(app)

    response = client.get("/api/v1/scenarios")

    assert response.status_code == 200
    scenario_ids = {scenario["id"] for scenario in response.json()}
    assert {
        "normal",
        "job_loss",
        "market_crash",
        "medical_emergency",
        "interest_rate_rise",
        "combined_shock",
    }.issubset(scenario_ids)
