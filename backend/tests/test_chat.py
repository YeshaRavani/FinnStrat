from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.api.dependencies import current_user
from app.main import app
from app.schemas.auth import UserPublic
from app.schemas.chat import ChatSimulationSummary, ChatStrategySummary, StrategyChatRequest
from app.schemas.financial import FinancialGoal, FinancialProfile, Strategy
from app.api.routes.chat import build_strategy_context


client = TestClient(app)


def chat_request() -> StrategyChatRequest:
    strategy = Strategy(
        id="hybrid_1",
        name="Hybrid reserve-first plan",
        type="hybrid",
        down_payment=360000,
        loan_amount=1440000,
        monthly_contribution=25000,
        investment_allocation=0.25,
        annual_interest_rate=0.09,
        loan_term_months=60,
        explanation="Preserve liquidity while financing the remainder.",
    )
    outcome = ChatSimulationSummary(
        maturity_month=14,
        goal_acquired=True,
        breaking_point_month=15,
        breaking_point_cause="negative_cash_flow",
        recovery_month=None,
        resilience_score=55,
        lowest_cash=2900000,
        final_cash=5300000,
        final_investments=5100000,
        final_debt=0,
        final_net_worth=12200000,
    )
    return StrategyChatRequest(
        profile=FinancialProfile(
            monthly_income=250000,
            monthly_expenses=100000,
            cash_savings=3000000,
            investments=1500000,
            existing_debt=0,
            monthly_debt_payment=0,
            emergency_reserve_months=6,
            risk_tolerance="medium",
        ),
        goal=FinancialGoal(
            name="Buy a car",
            category="vehicle",
            target_amount=1800000,
            priority="high",
            flexibility="medium",
            inflation_rate=0.06,
            appreciation_rate=0,
            asset_type="depreciating_asset",
        ),
        strategies=[ChatStrategySummary(
            strategy=strategy,
            maturity_month=14,
            resilience_score=55,
            goal_success_score=100,
            liquidity_score=100,
            speed_score=90,
            wealth_score=80,
            debt_score=75,
            overall_score=82,
            normal=outcome,
            stress=outcome,
        )],
        selected_strategy_id="hybrid_1",
        messages=[{"role": "user", "content": "Why is this plan vulnerable?"}],
    )


def test_strategy_context_contains_goal_and_all_outcomes():
    context = build_strategy_context(chat_request())

    assert "Goal: Buy a car" in context
    assert "Hybrid reserve-first plan" in context
    assert "Combined-stress outcome" in context
    assert "breaking point month=15" in context
    assert "Selected strategy id: hybrid_1" in context


def test_strategy_chat_explains_missing_configuration(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    app.dependency_overrides[current_user] = lambda: UserPublic(id=1, username="demo", created_at=datetime.now(timezone.utc))
    try:
        response = client.post("/api/v1/chat/strategy", json=chat_request().model_dump(mode="json"))
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503
    assert "GROQ_API_KEY" in response.json()["detail"]
