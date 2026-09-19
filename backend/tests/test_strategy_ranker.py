from app.schemas.financial import FinancialProfile, MonthlyResult, RankedStrategy, SimulationResult, Strategy
from app.services.strategy_ranker import calculate_strategy_scores, remove_dominated_strategies


def _ranked(
    strategy_id: str,
    resilience: float,
    success: float,
    liquidity: float,
    speed: float,
) -> RankedStrategy:
    simulation = SimulationResult(
        strategy_id=strategy_id,
        scenario_id="normal",
        status="completed",
    )
    return RankedStrategy(
        strategy=Strategy(id=strategy_id, name=strategy_id, type="save_then_buy"),
        maturity_month=1,
        resilience_score=resilience,
        goal_success_score=success,
        liquidity_score=liquidity,
        speed_score=speed,
        overall_score=resilience,
        normal_simulation=simulation,
        stress_simulation=simulation,
    )


def test_remove_dominated_strategies_keeps_only_pareto_candidates():
    dominated = _ranked("dominated", 80, 100, 70, 60)
    stronger = _ranked("stronger", 85, 100, 70, 60)
    tradeoff = _ranked("tradeoff", 70, 100, 95, 55)

    results = remove_dominated_strategies([dominated, stronger, tradeoff])

    assert dominated not in results
    assert stronger in results
    assert tradeoff in results


def test_ranking_preference_changes_weighted_overall_score():
    profile = FinancialProfile(
        monthly_income=200000,
        monthly_expenses=100000,
        cash_savings=1000000,
        investments=500000,
        existing_debt=0,
        monthly_debt_payment=0,
    )
    fast_strategy = Strategy(id="fast", name="Fast", type="save_then_buy")
    slow_strategy = Strategy(id="slow", name="Slow", type="save_then_buy")
    fast_simulation = SimulationResult(
        strategy_id="fast",
        scenario_id="normal",
        maturity_month=2,
        goal_acquired=True,
        resilience_score=80,
        monthly_results=[MonthlyResult(month=1, cash_balance=700000, investment_value=0, loan_balance=0, net_worth=700000, monthly_cash_flow=0)],
    )
    slow_simulation = SimulationResult(
        strategy_id="slow",
        scenario_id="normal",
        maturity_month=18,
        goal_acquired=True,
        resilience_score=85,
        monthly_results=[MonthlyResult(month=1, cash_balance=1500000, investment_value=0, loan_balance=0, net_worth=1500000, monthly_cash_flow=0)],
    )

    fast_for_speed = calculate_strategy_scores(
        profile=profile, strategy=fast_strategy, normal_simulation=fast_simulation,
        stress_simulation=fast_simulation, goal_amount=1000000, max_months=120,
        ranking_preference="speed",
    )
    slow_for_resilience = calculate_strategy_scores(
        profile=profile, strategy=slow_strategy, normal_simulation=slow_simulation,
        stress_simulation=slow_simulation, goal_amount=1000000, max_months=120,
        ranking_preference="resilience",
    )
    slow_for_speed = calculate_strategy_scores(
        profile=profile, strategy=slow_strategy, normal_simulation=slow_simulation,
        stress_simulation=slow_simulation, goal_amount=1000000, max_months=120,
        ranking_preference="speed",
    )
    fast_for_resilience = calculate_strategy_scores(
        profile=profile, strategy=fast_strategy, normal_simulation=fast_simulation,
        stress_simulation=fast_simulation, goal_amount=1000000, max_months=120,
        ranking_preference="resilience",
    )

    assert fast_for_speed.overall_score > slow_for_speed.overall_score
    assert slow_for_resilience.overall_score > fast_for_resilience.overall_score


def test_goal_priority_and_flexibility_adjust_speed_weight():
    profile = FinancialProfile(
        monthly_income=200000,
        monthly_expenses=100000,
        cash_savings=1000000,
        investments=500000,
        existing_debt=0,
        monthly_debt_payment=0,
    )
    strategy = Strategy(id="candidate", name="Candidate", type="save_then_buy")
    simulation = SimulationResult(
        strategy_id="candidate",
        scenario_id="normal",
        maturity_month=6,
        goal_acquired=True,
        resilience_score=70,
        monthly_results=[MonthlyResult(month=1, cash_balance=900000, investment_value=0, loan_balance=0, net_worth=900000, monthly_cash_flow=0)],
    )
    urgent = calculate_strategy_scores(
        profile=profile, strategy=strategy, normal_simulation=simulation,
        stress_simulation=simulation, goal_amount=1000000, max_months=120,
        ranking_preference="balanced", goal_priority="high", goal_flexibility="low",
    )
    flexible = calculate_strategy_scores(
        profile=profile, strategy=strategy, normal_simulation=simulation,
        stress_simulation=simulation, goal_amount=1000000, max_months=120,
        ranking_preference="balanced", goal_priority="low", goal_flexibility="high",
    )

    assert urgent.overall_score > flexible.overall_score
