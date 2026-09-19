from dataclasses import dataclass

from app.schemas.financial import (
    FinancialGoal,
    FinancialProfile,
    RankedStrategy,
    Scenario,
    Strategy,
    StrategyGenerationRequest,
)
from app.services.simulation_engine import simulate


@dataclass(frozen=True)
class Candidate:
    strategy: Strategy
    maturity_month: int | None
    resilience: float
    success: float
    liquidity: float
    speed: float
    score: float
    normal: object
    stress: object


def _scenarios() -> tuple[Scenario, Scenario]:
    return (
        Scenario(id="normal", name="Normal conditions"),
        Scenario(
            id="stress",
            name="Combined shock",
            income_multiplier=0.0,
            investment_shock_month=6,
            investment_decline=0.30,
            emergency_expense_month=6,
            emergency_expense=500000,
            interest_rate_increase=0.02,
        ),
    )


def _candidate_strategies(profile: FinancialProfile, goal: FinancialGoal) -> list[Strategy]:
    surplus = max(0, profile.monthly_income - profile.monthly_expenses - profile.monthly_debt_payment)
    reserve = profile.monthly_expenses * profile.emergency_reserve_months
    available_after_reserve = max(0, profile.cash_savings - reserve)
    loan_amount = max(0, goal.target_amount - available_after_reserve)
    return [
        Strategy(
            id="save_then_buy",
            name="Save and buy later",
            type="save_then_buy",
            monthly_contribution=surplus * 0.60,
        ),
        Strategy(
            id="financed_purchase",
            name="Buy now with financing",
            type="financed_purchase",
            down_payment=min(available_after_reserve, goal.target_amount * 0.30),
            loan_amount=loan_amount,
            annual_interest_rate=0.085,
            loan_term_months=60,
        ),
        Strategy(
            id="invest_then_buy",
            name="Invest while saving",
            type="invest_then_buy",
            monthly_contribution=surplus * 0.50,
        ),
        Strategy(
            id="hybrid",
            name="Hybrid reserve-first plan",
            type="hybrid",
            down_payment=min(available_after_reserve * 0.50, goal.target_amount * 0.20),
            loan_amount=max(0, goal.target_amount - min(available_after_reserve * 0.50, goal.target_amount * 0.20)),
            monthly_contribution=surplus * 0.25,
            annual_interest_rate=0.08,
            loan_term_months=84,
        ),
    ]


def generate_ranked_strategies(request: StrategyGenerationRequest) -> list[RankedStrategy]:
    normal_scenario, stress_scenario = _scenarios()
    ranked: list[RankedStrategy] = []
    weights = {
        "balanced": (0.35, 0.20, 0.20, 0.15, 0.10),
        "resilience": (0.55, 0.15, 0.20, 0.05, 0.05),
        "speed": (0.20, 0.25, 0.15, 0.35, 0.05),
        "wealth": (0.25, 0.25, 0.10, 0.10, 0.30),
        "liquidity": (0.40, 0.15, 0.35, 0.05, 0.05),
    }[request.ranking_preference]

    for strategy in _candidate_strategies(request.profile, request.goal):
        normal = simulate(request.profile, request.goal, strategy, normal_scenario, request.max_months)
        stress = simulate(request.profile, request.goal, strategy, stress_scenario, request.max_months)
        maturity = normal.maturity_month
        speed = max(0, 100 - ((maturity or request.max_months) / request.max_months * 100))
        liquidity = 100 if not stress.breaking_point_month else max(0, 100 - stress.breaking_point_month)
        success = 100 if maturity is not None else 0
        overall = (
            weights[0] * stress.resilience_score
            + weights[1] * success
            + weights[2] * liquidity
            + weights[3] * speed
            + weights[4] * max(0, min(100, normal.resilience_score + 10))
        )
        ranked.append(RankedStrategy(
            strategy=strategy,
            maturity_month=maturity,
            resilience_score=stress.resilience_score or 0,
            goal_success_score=success,
            liquidity_score=liquidity,
            speed_score=round(speed, 2),
            overall_score=round(overall, 2),
            normal_simulation=normal,
            stress_simulation=stress,
        ))

    return sorted(ranked, key=lambda item: item.overall_score, reverse=True)
