from dataclasses import dataclass

from app.schemas.financial import (
    FinancialProfile,
    RankedStrategy,
    RankingPreference,
    SimulationResult,
    Strategy,
)


@dataclass(frozen=True)
class StrategyScores:
    resilience_score: float
    goal_success_score: float
    liquidity_score: float
    speed_score: float
    wealth_score: float
    debt_score: float
    overall_score: float


def _final_result(simulation: SimulationResult):
    if not simulation.monthly_results:
        return None
    return simulation.monthly_results[-1]


def _score_speed(maturity_month: int | None, max_months: int) -> float:
    if maturity_month is None:
        return 0.0
    return max(0.0, 100 - ((maturity_month - 1) / max_months * 100))


def _score_liquidity(profile: FinancialProfile, simulation: SimulationResult) -> float:
    reserve_target = profile.monthly_expenses * profile.emergency_reserve_months
    if reserve_target <= 0 or not simulation.monthly_results:
        return 100.0
    lowest_cash = min(result.cash_balance for result in simulation.monthly_results)
    return max(0.0, min(100.0, lowest_cash / reserve_target * 100))


def _score_wealth(goal_amount: float, simulation: SimulationResult) -> float:
    final = _final_result(simulation)
    if final is None or goal_amount <= 0:
        return 0.0
    return max(0.0, min(100.0, final.net_worth / goal_amount * 50))


def _score_debt(strategy: Strategy, simulation: SimulationResult) -> float:
    final = _final_result(simulation)
    if final is None:
        return 0.0
    starting_debt = max(strategy.loan_amount, simulation.loan_created, 1)
    return max(0.0, min(100.0, 100 - (final.loan_balance / starting_debt * 100)))


def calculate_strategy_scores(
    *,
    profile: FinancialProfile,
    strategy: Strategy,
    normal_simulation: SimulationResult,
    stress_simulation: SimulationResult,
    goal_amount: float,
    max_months: int,
    ranking_preference: RankingPreference,
) -> StrategyScores:
    resilience = float(stress_simulation.resilience_score or 0)
    success = 100.0 if normal_simulation.goal_acquired else 0.0
    liquidity = _score_liquidity(profile, stress_simulation)
    speed = _score_speed(normal_simulation.maturity_month, max_months)
    wealth = _score_wealth(goal_amount, normal_simulation)
    debt = _score_debt(strategy, normal_simulation)
    weights = {
        "balanced": (0.30, 0.20, 0.15, 0.15, 0.10, 0.10),
        "resilience": (0.55, 0.15, 0.15, 0.05, 0.05, 0.05),
        "speed": (0.20, 0.20, 0.10, 0.35, 0.05, 0.10),
        "wealth": (0.20, 0.20, 0.10, 0.10, 0.30, 0.10),
        "liquidity": (0.25, 0.15, 0.40, 0.05, 0.05, 0.10),
        "low_debt": (0.25, 0.15, 0.15, 0.05, 0.10, 0.30),
    }[ranking_preference]
    overall = (
        weights[0] * resilience
        + weights[1] * success
        + weights[2] * liquidity
        + weights[3] * speed
        + weights[4] * wealth
        + weights[5] * debt
    )
    return StrategyScores(
        resilience_score=round(resilience, 2),
        goal_success_score=round(success, 2),
        liquidity_score=round(liquidity, 2),
        speed_score=round(speed, 2),
        wealth_score=round(wealth, 2),
        debt_score=round(debt, 2),
        overall_score=round(overall, 2),
    )


def build_ranked_strategy(
    *,
    strategy: Strategy,
    normal_simulation: SimulationResult,
    stress_simulation: SimulationResult,
    scores: StrategyScores,
) -> RankedStrategy:
    return RankedStrategy(
        strategy=strategy,
        maturity_month=normal_simulation.maturity_month,
        resilience_score=scores.resilience_score,
        goal_success_score=scores.goal_success_score,
        liquidity_score=scores.liquidity_score,
        speed_score=scores.speed_score,
        wealth_score=scores.wealth_score,
        debt_score=scores.debt_score,
        overall_score=scores.overall_score,
        normal_simulation=normal_simulation,
        stress_simulation=stress_simulation,
    )


def remove_dominated_strategies(candidates: list[RankedStrategy]) -> list[RankedStrategy]:
    non_dominated: list[RankedStrategy] = []
    for candidate in candidates:
        dominated = False
        for challenger in candidates:
            if candidate is challenger:
                continue
            comparable_scores = [
                challenger.resilience_score >= candidate.resilience_score,
                challenger.speed_score >= candidate.speed_score,
                challenger.liquidity_score >= candidate.liquidity_score,
                challenger.goal_success_score >= candidate.goal_success_score,
            ]
            strictly_better = any([
                challenger.resilience_score > candidate.resilience_score,
                challenger.speed_score > candidate.speed_score,
                challenger.liquidity_score > candidate.liquidity_score,
                challenger.goal_success_score > candidate.goal_success_score,
            ])
            if all(comparable_scores) and strictly_better:
                dominated = True
                break
        if not dominated:
            non_dominated.append(candidate)
    return non_dominated
