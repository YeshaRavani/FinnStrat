import pytest
from pydantic import ValidationError

from app.schemas.financial import FinancialProfile, Scenario, Strategy


def test_profile_accepts_valid_financial_data():
    profile = FinancialProfile(
        monthly_income=250000,
        monthly_expenses=100000,
        cash_savings=800000,
        investments=500000,
        existing_debt=0,
        monthly_debt_payment=0,
    )

    assert profile.risk_tolerance == "medium"
    assert profile.expected_annual_investment_return is None
    assert profile.max_emi_to_income_ratio == 0.45


def test_profile_rejects_expenses_above_income():
    with pytest.raises(ValidationError):
        FinancialProfile(
            monthly_income=100000,
            monthly_expenses=120000,
            cash_savings=0,
            investments=0,
            existing_debt=0,
            monthly_debt_payment=0,
        )


def test_strategy_and_scenario_accept_backend_planning_fields():
    strategy = Strategy(
        id="hybrid",
        name="Hybrid",
        type="hybrid",
        down_payment=300000,
        loan_amount=700000,
        annual_interest_rate=0.08,
        loan_term_months=60,
        investment_allocation=0.25,
        purchase_month=6,
    )
    scenario = Scenario(
        id="job_loss",
        name="Job loss",
        income_reduction_percent=0.50,
        income_shock_start_month=3,
        income_shock_duration_months=6,
        expense_increase_percent=0.10,
        expense_increase_start_month=3,
    )

    assert strategy.investment_allocation == 0.25
    assert scenario.income_shock_duration_months == 6
