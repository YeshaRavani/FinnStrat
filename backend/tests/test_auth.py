from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def profile_payload(**overrides):
    profile = {
        "monthly_income": 250000,
        "monthly_expenses": 100000,
        "cash_savings": 3000000,
        "investments": 1500000,
        "existing_debt": 0,
        "monthly_debt_payment": 0,
        "existing_debt_annual_interest_rate": 0,
        "emergency_reserve_months": 6,
        "risk_tolerance": "medium",
    }
    profile.update(overrides)
    return profile


def goal_payload(name="Buy a car"):
    return {
        "name": name,
        "category": "vehicle",
        "target_amount": 1800000,
        "target_date": None,
        "priority": "high",
        "flexibility": "medium",
        "inflation_rate": 0.06,
        "appreciation_rate": 0,
        "asset_type": "depreciating_asset",
    }


def test_signup_login_profile_and_goal_persist(tmp_path, monkeypatch):
    monkeypatch.setenv("FINNSTRAT_APP_DB_PATH", str(tmp_path / "auth.sqlite"))

    signup = client.post("/api/v1/auth/signup", json={
        "username": "  Arjun_Rao ",
        "password": "correct-horse-battery",
        "profile": profile_payload(),
    })
    assert signup.status_code == 201
    session = signup.json()
    assert session["user"]["username"] == "arjun_rao"
    token = session["access_token"]

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["profile"]["monthly_income"] == 250000
    assert me.json()["goals"] == []

    updated_profile = client.put(
        "/api/v1/auth/profile",
        headers={"Authorization": f"Bearer {token}"},
        json=profile_payload(existing_debt=180000, monthly_debt_payment=6500, existing_debt_annual_interest_rate=0.11),
    )
    assert updated_profile.status_code == 200
    assert updated_profile.json()["existing_debt"] == 180000

    saved_goal = client.post(
        "/api/v1/goals",
        headers={"Authorization": f"Bearer {token}"},
        json=goal_payload(),
    )
    assert saved_goal.status_code == 200
    assert saved_goal.json()["name"] == "Buy a car"
    assert saved_goal.json()["target_amount"] == 1800000

    login = client.post("/api/v1/auth/login", json={
        "username": "ARJUN_RAO",
        "password": "correct-horse-battery",
    })
    assert login.status_code == 200
    logged_in = login.json()
    assert logged_in["profile"]["monthly_debt_payment"] == 6500
    assert [goal["name"] for goal in logged_in["goals"]] == ["Buy a car"]

    duplicate = client.post("/api/v1/auth/signup", json={
        "username": "arjun_rao",
        "password": "another-password",
        "profile": profile_payload(),
    })
    assert duplicate.status_code == 409

    wrong_password = client.post("/api/v1/auth/login", json={
        "username": "arjun_rao",
        "password": "wrong-password",
    })
    assert wrong_password.status_code == 401


def test_goals_require_authentication_and_are_isolated(tmp_path, monkeypatch):
    monkeypatch.setenv("FINNSTRAT_APP_DB_PATH", str(tmp_path / "auth.sqlite"))
    assert client.get("/api/v1/goals").status_code == 401

    first = client.post("/api/v1/auth/signup", json={
        "username": "first_user",
        "password": "first-password",
        "profile": profile_payload(),
    }).json()
    second = client.post("/api/v1/auth/signup", json={
        "username": "second_user",
        "password": "second-password",
        "profile": profile_payload(),
    }).json()

    first_headers = {"Authorization": f"Bearer {first['access_token']}"}
    second_headers = {"Authorization": f"Bearer {second['access_token']}"}
    assert client.post("/api/v1/goals", headers=first_headers, json=goal_payload("First goal")).status_code == 200
    assert [goal["name"] for goal in client.get("/api/v1/goals", headers=first_headers).json()] == ["First goal"]
    assert client.get("/api/v1/goals", headers=second_headers).json() == []

    assert client.post("/api/v1/auth/logout", headers=first_headers).status_code == 204
    assert client.get("/api/v1/auth/me", headers=first_headers).status_code == 401
