from app.schemas.financial import RankedStrategy, SimulationResult, Strategy
from app.services.strategy_ranker import remove_dominated_strategies


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
