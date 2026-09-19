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


def test_scenarios_are_loaded_from_sqlite_dataset():
    client = TestClient(app)

    response = client.get("/api/v1/scenarios")

    assert response.status_code == 200
    scenarios = {scenario["id"]: scenario for scenario in response.json()}
    assert scenarios["job_loss"]["income_reduction_percent"] == 0.75
    assert scenarios["job_loss"]["income_shock_start_month"] == 13
    assert scenarios["market_crash"]["investment_shock_month"] == 10
    assert scenarios["medical_emergency"]["emergency_expense"] == 850000
    assert scenarios["interest_rate_rise"]["interest_rate_shock_start_month"] == 15
    assert scenarios["combined_shock"]["emergency_expense"] == 650000
