from app.schemas.financial import FinancialGoal, FinancialProfile
from app.services.affordability import assess_affordability


def test_affordability_identifies_unfeasible_goal():
    result = assess_affordability(
        FinancialProfile(monthly_income=50000, monthly_expenses=45000, cash_savings=10000, investments=0, existing_debt=0, monthly_debt_payment=0),
        FinancialGoal(name="Land", category="land", target_amount=10000000),
        120,
    )
    assert result.goal_status == "not_feasible"
    assert result.shortfall > 0
