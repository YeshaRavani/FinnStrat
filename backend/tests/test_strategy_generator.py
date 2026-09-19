from app.schemas.financial import FinancialGoal, FinancialProfile, StrategyGenerationRequest
from app.services.scenario_catalog import get_normal_and_stress_scenarios
from app.services.simulation_engine import simulate
from app.services.strategy_generator import (
    _candidate_strategies,
    _strategy_configuration,
    generate_ranked_strategies,
)


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

    assert 1 <= len(results) <= 7
    assert results[0].overall_score >= results[-1].overall_score
    assert all(item.normal_simulation.status == "completed" for item in results)
    assert all(item.normal_simulation.goal_acquired for item in results)


def test_candidate_grid_produces_different_maturity_times():
    profile = FinancialProfile(
        monthly_income=250000,
        monthly_expenses=100000,
        cash_savings=3000000,
        investments=1500000,
        existing_debt=0,
        monthly_debt_payment=0,
    )
    goal = FinancialGoal(name="Car", category="vehicle", target_amount=1800000)
    normal, _ = get_normal_and_stress_scenarios()
    maturities = {
        simulate(profile, goal, candidate, normal, 36).maturity_month
        for candidate in _candidate_strategies(profile, goal)
    }

    assert {1, 6, 12, 24}.issubset(maturities)


def test_candidate_grid_has_unique_configs_and_distinct_save_invest_semantics():
    profile = FinancialProfile(
        monthly_income=250000,
        monthly_expenses=100000,
        cash_savings=3000000,
        investments=1500000,
        existing_debt=0,
        monthly_debt_payment=0,
    )
    goal = FinancialGoal(name="Car", category="vehicle", target_amount=1800000)
    candidates = _candidate_strategies(profile, goal)
    configurations = [_strategy_configuration(candidate) for candidate in candidates]

    assert len(configurations) == len(set(configurations))
    assert all(item.investment_allocation == 0 for item in candidates if item.type == "save_then_buy")
    assert all(item.investment_allocation > 0 for item in candidates if item.type == "invest_then_buy")


def test_ranked_shortlist_deduplicates_configs_and_limits_repeated_families():
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
    configurations = [_strategy_configuration(item.strategy) for item in results]
    family_counts = {}
    for item in results:
        family_counts[item.strategy.type] = family_counts.get(item.strategy.type, 0) + 1

    assert len(configurations) == len(set(configurations))
    assert max(family_counts.values()) <= 3
    assert set(family_counts) == {
        "save_then_buy", "invest_then_buy", "financed_purchase", "hybrid"
    }


def test_strategy_generator_supports_low_debt_preference():
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
        ranking_preference="low_debt",
    ))

    assert 1 <= len(results) <= 7
    assert all(item.debt_score >= 0 for item in results)
