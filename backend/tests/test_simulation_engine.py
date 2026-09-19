from app.schemas.financial import FinancialGoal, FinancialProfile, Scenario, Strategy
from app.services.simulation_engine import calculate_emi, simulate


def test_calculate_emi_returns_positive_payment():
    assert calculate_emi(1_000_000, 0.08, 60) > 0


def test_simulation_returns_monthly_results_and_score():
    result = simulate(
        profile=FinancialProfile(
            monthly_income=250000,
            monthly_expenses=100000,
            cash_savings=800000,
            investments=500000,
            existing_debt=0,
            monthly_debt_payment=0,
        ),
        goal=FinancialGoal(name="Car", category="vehicle", target_amount=1800000),
        strategy=Strategy(
            id="save-1",
            name="Save then buy",
            type="save_then_buy",
            monthly_contribution=50000,
        ),
        scenario=Scenario(id="normal", name="Normal"),
        max_months=12,
    )

    assert result.status == "completed"
    assert len(result.monthly_results) == 12
    assert result.resilience_score is not None
