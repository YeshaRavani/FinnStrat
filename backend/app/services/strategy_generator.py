from app.schemas.financial import (
    FinancialGoal,
    FinancialProfile,
    RankedStrategy,
    Strategy,
    StrategyGenerationRequest,
)
from app.services.scenario_catalog import get_normal_and_stress_scenarios
from app.services.simulation_engine import calculate_emi, simulate
from app.services.strategy_ranker import (
    build_ranked_strategy,
    calculate_strategy_scores,
    remove_dominated_strategies,
)


def _goal_interest_rate(goal: FinancialGoal, profile: FinancialProfile) -> float:
    rates = {
        "vehicle": 0.095,
        "home": 0.085,
        "land": 0.10,
        "education": 0.11,
        "business": 0.13,
    }
    base_rate = rates.get(goal.category.lower(), 0.10)
    if profile.risk_tolerance == "low":
        return max(0.0, base_rate - 0.005)
    if profile.risk_tolerance == "high":
        return base_rate + 0.005
    return base_rate


def _is_immediately_feasible(profile: FinancialProfile, strategy: Strategy) -> bool:
    surplus = profile.monthly_income - profile.monthly_expenses - profile.monthly_debt_payment
    if strategy.monthly_contribution > max(0.0, surplus):
        return False
    if strategy.loan_amount <= 0:
        return True
    initial_emi = 0.0
    if strategy.loan_term_months > 0:
        initial_emi = calculate_emi(
            strategy.loan_amount,
            strategy.annual_interest_rate,
            strategy.loan_term_months,
        )
    return (
        profile.monthly_income > 0
        and (initial_emi + profile.monthly_debt_payment) / profile.monthly_income
        <= profile.max_emi_to_income_ratio
    )


def _candidate_strategies(profile: FinancialProfile, goal: FinancialGoal) -> list[Strategy]:
    surplus = max(0, profile.monthly_income - profile.monthly_expenses - profile.monthly_debt_payment)
    down_payment_percentages = [0.10, 0.20, 0.30, 0.40]
    monthly_contribution_percentages = [0.25, 0.50, 0.75]
    loan_terms = [36, 60, 84, 120]
    investment_allocations = [0.25, 0.50]
    purchase_delays = [0, 6, 12, 24]
    interest_rate = _goal_interest_rate(goal, profile)
    candidates: list[Strategy] = []

    for contribution_percent in monthly_contribution_percentages:
        for delay in purchase_delays:
            contribution = surplus * contribution_percent
            candidates.append(Strategy(
                id=f"save_{int(contribution_percent * 100)}_0_{delay}",
                name="Save then buy",
                type="save_then_buy",
                monthly_contribution=contribution,
                investment_allocation=0,
                purchase_month=delay,
                explanation="Build the full purchase amount in cash before acquiring the goal.",
            ))
            for allocation in investment_allocations:
                invest_strategy = Strategy(
                    id=f"invest_{int(contribution_percent * 100)}_{int(allocation * 100)}_{delay}",
                    name="Invest while saving",
                    type="invest_then_buy",
                    monthly_contribution=contribution,
                    investment_allocation=allocation,
                    purchase_month=delay,
                    explanation="Use monthly surplus and investments to reach the goal amount.",
                )
                candidates.append(invest_strategy)

    for down_percent in down_payment_percentages:
        down_payment = goal.target_amount * down_percent
        loan_amount = max(0.0, goal.target_amount - down_payment)
        for contribution_percent in monthly_contribution_percentages:
            for allocation in investment_allocations:
                for delay in purchase_delays:
                    for term in loan_terms:
                        contribution = surplus * contribution_percent
                        candidates.append(Strategy(
                            id=(
                                f"finance_dp{int(down_percent * 100)}_"
                                f"c{int(contribution_percent * 100)}_"
                                f"a{int(allocation * 100)}_m{delay}_t{term}"
                            ),
                            name="Finance with planned down payment",
                            type="financed_purchase",
                            down_payment=down_payment,
                            loan_amount=loan_amount,
                            monthly_contribution=contribution,
                            investment_allocation=allocation,
                            purchase_month=delay,
                            annual_interest_rate=interest_rate,
                            loan_term_months=term,
                            explanation="Use a target down payment and finance the remaining amount.",
                        ))
                        hybrid_down_payment = goal.target_amount * min(0.50, down_percent + 0.10)
                        candidates.append(Strategy(
                            id=(
                                f"hybrid_dp{int((down_percent + 0.10) * 100)}_"
                                f"c{int(contribution_percent * 100)}_"
                                f"a{int(allocation * 100)}_m{delay}_t{term}"
                            ),
                            name="Hybrid reserve-first plan",
                            type="hybrid",
                            down_payment=hybrid_down_payment,
                            loan_amount=max(0.0, goal.target_amount - hybrid_down_payment),
                            monthly_contribution=contribution,
                            investment_allocation=allocation,
                            purchase_month=delay,
                            annual_interest_rate=max(0.0, interest_rate - 0.005),
                            loan_term_months=term,
                            explanation="Preserve liquidity, invest some surplus, and finance the remainder.",
                        ))

    return [strategy for strategy in candidates if _is_immediately_feasible(profile, strategy)]


def _strategy_configuration(strategy: Strategy) -> tuple:
    values = strategy.model_dump(exclude={"id", "name", "explanation", "type"})
    values["purchase_mode"] = (
        "financed" if strategy.type in {"financed_purchase", "hybrid"} else "cash"
    )
    return tuple(sorted(values.items()))


def generate_ranked_strategies(request: StrategyGenerationRequest) -> list[RankedStrategy]:
    normal_scenario, stress_scenario = get_normal_and_stress_scenarios()
    ranked: list[RankedStrategy] = []

    for strategy in _candidate_strategies(request.profile, request.goal):
        normal = simulate(request.profile, request.goal, strategy, normal_scenario, request.max_months)
        stress = simulate(request.profile, request.goal, strategy, stress_scenario, request.max_months)
        if normal.maturity_month is None:
            continue
        scores = calculate_strategy_scores(
            profile=request.profile,
            strategy=strategy,
            normal_simulation=normal,
            stress_simulation=stress,
            goal_amount=request.goal.target_amount,
            max_months=request.max_months,
            ranking_preference=request.ranking_preference,
            goal_priority=request.goal.priority,
            goal_flexibility=request.goal.flexibility,
        )
        ranked.append(build_ranked_strategy(
            strategy=strategy,
            normal_simulation=normal,
            stress_simulation=stress,
            scores=scores,
        ))

    rank_key = lambda item: (
            -item.overall_score,
            -item.resilience_score,
            -item.liquidity_score,
            -item.speed_score,
            item.maturity_month or request.max_months + 1,
            item.strategy.id,
        )
    ordered = sorted(ranked, key=rank_key)
    unique: list[RankedStrategy] = []
    seen_configurations: set[tuple] = set()
    for item in ordered:
        configuration = _strategy_configuration(item.strategy)
        if configuration in seen_configurations:
            continue
        seen_configurations.add(configuration)
        unique.append(item)

    non_dominated = remove_dominated_strategies(unique)
    selected: list[RankedStrategy] = []
    family_counts: dict[str, int] = {}

    # Reserve one slot for each feasible strategy family before filling by score.
    for item in unique:
        family = item.strategy.type
        if family in family_counts:
            continue
        selected.append(item)
        family_counts[family] = 1

    selected_configurations = {
        _strategy_configuration(item.strategy) for item in selected
    }
    for item in non_dominated:
        family = item.strategy.type
        configuration = _strategy_configuration(item.strategy)
        if configuration in selected_configurations or family_counts.get(family, 0) >= 3:
            continue
        selected.append(item)
        selected_configurations.add(configuration)
        family_counts[family] = family_counts.get(family, 0) + 1
        if len(selected) == 7:
            break

    selected.sort(key=rank_key)
    return selected
