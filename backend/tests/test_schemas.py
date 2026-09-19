import pytest
from pydantic import ValidationError

from app.schemas.financial import FinancialProfile


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
