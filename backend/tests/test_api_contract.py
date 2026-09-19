from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_strategy_generation_matches_frontend_contract():
    response = client.post("/api/v1/strategies/generate", json={
        "profile": {
            "monthly_income": 250000,
            "monthly_expenses": 100000,
            "cash_savings": 3000000,
            "investments": 1500000,
            "existing_debt": 0,
            "monthly_debt_payment": 0,
            "emergency_reserve_months": 6,
            "risk_tolerance": "medium",
        },
        "goal": {
            "name": "Education fund",
            "category": "education",
            "target_amount": 1800000,
            "target_date": None,
            "priority": "high",
            "flexibility": "medium",
            "inflation_rate": 0.06,
            "appreciation_rate": 0,
            "asset_type": "consumable",
        },
        "ranking_preference": "balanced",
        "max_months": 36,
    })

    assert response.status_code == 200
    strategies = response.json()
    assert strategies
    assert {
        "strategy", "maturity_month", "resilience_score", "goal_success_score",
        "liquidity_score", "speed_score", "wealth_score", "debt_score",
        "overall_score", "normal_simulation", "stress_simulation",
    }.issubset(strategies[0])
    assert strategies[0]["normal_simulation"]["monthly_results"]
    assert strategies[0]["normal_simulation"]["monthly_results"][0]["goal_asset_value"] == 0


def test_simulation_endpoint_returns_monthly_purchase_contract():
    response = client.post("/api/v1/simulations", json={
        "profile": {
            "monthly_income": 250000,
            "monthly_expenses": 100000,
            "cash_savings": 2000000,
            "investments": 0,
            "existing_debt": 0,
            "monthly_debt_payment": 0,
        },
        "goal": {
            "name": "Car", "category": "vehicle", "target_amount": 1000000,
            "inflation_rate": 0, "asset_type": "depreciating_asset",
        },
        "strategy": {"id": "save", "name": "Save then buy", "type": "save_then_buy"},
        "scenario": {"id": "normal", "name": "Normal"},
        "max_months": 3,
    })

    assert response.status_code == 200
    simulation = response.json()
    assert simulation["goal_acquired"] is True
    assert simulation["monthly_results"][0]["purchase_amount"] == 1000000
    assert simulation["monthly_results"][0]["goal_asset_value"] == 1000000
