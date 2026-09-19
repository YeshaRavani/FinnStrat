from app.schemas.financial import FinancialGoal, FinancialProfile, StrategyGenerationRequest
from app.services.strategy_generator import generate_ranked_strategies


def test_strategy_generator_returns_ranked_candidates():
    results = generate_ranked_strategies(StrategyGenerationRequest(
        profile=FinancialProfile(
            monthly_income=250000,
            monthly_expenses=100000,
            cash_savings=3000000,
            investments=1500000,
            existing_debt=0,
            monthly_debt_payment=0,
        ),
        goal=FinancialGoal(name="Car", category="vehicle", target_amount=1800000),
        max_months=36,
    ))

    assert len(results) == 4
    assert results[0].overall_score >= results[-1].overall_score
    assert all(item.normal_simulation.status == "completed" for item in results)
