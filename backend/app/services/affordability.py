import math

from app.schemas.financial import AffordabilityResult, FinancialGoal, FinancialProfile


def assess_affordability(profile: FinancialProfile, goal: FinancialGoal, max_months: int) -> AffordabilityResult:
    surplus = profile.monthly_income - profile.monthly_expenses - profile.monthly_debt_payment
    reserve = profile.monthly_expenses * profile.emergency_reserve_months
    usable_cash = max(0.0, profile.cash_savings - reserve)
    target = goal.target_amount
    if usable_cash >= target and surplus >= 0:
        return AffordabilityResult(goal_status="affordable_now", affordability_reason="goal_funded_while_reserve_intact", available_monthly_surplus=surplus, required_monthly_contribution=0, required_emi_ratio=0, maximum_allowed_emi_ratio=profile.max_emi_to_income_ratio, estimated_maturity_month=0, recovery_options=[])

    contribution = max(0.0, surplus * 0.75)
    remaining = max(0.0, target - usable_cash)
    months = math.ceil(remaining / contribution) if contribution > 0 else None
    if months is not None and months <= max_months:
        return AffordabilityResult(goal_status="affordable_later", affordability_reason="goal_requires_additional_saving", available_monthly_surplus=surplus, required_monthly_contribution=contribution, required_emi_ratio=0, maximum_allowed_emi_ratio=profile.max_emi_to_income_ratio, estimated_maturity_month=months, recovery_options=["Keep the emergency reserve intact", "Review the plan after each income or expense change"])

    shortfall = max(0.0, remaining - max(0.0, contribution) * max_months)
    return AffordabilityResult(goal_status="not_feasible", affordability_reason="monthly_surplus_insufficient_for_goal_horizon", available_monthly_surplus=surplus, required_monthly_contribution=remaining / max_months, required_emi_ratio=0, maximum_allowed_emi_ratio=profile.max_emi_to_income_ratio, shortfall=shortfall, recovery_options=["Increase the timeline", "Reduce the target amount", "Increase monthly savings", "Reduce monthly expenses", "Choose a lower-cost alternative"])
