from app.schemas.financial import (
    FinancialGoal,
    FinancialProfile,
    MonthlyResult,
    Scenario,
    SimulationResult,
    Strategy,
)


def calculate_emi(principal: float, annual_rate: float, term_months: int) -> float:
    if principal <= 0 or term_months <= 0:
        return 0.0
    monthly_rate = annual_rate / 12
    if monthly_rate == 0:
        return principal / term_months
    factor = (1 + monthly_rate) ** term_months
    return principal * monthly_rate * factor / (factor - 1)


def simulate(
    profile: FinancialProfile,
    goal: FinancialGoal,
    strategy: Strategy,
    scenario: Scenario,
    max_months: int,
) -> SimulationResult:
    cash = profile.cash_savings
    investments = profile.investments
    loan_balance = strategy.loan_amount
    target_cost = goal.target_amount
    reserve_target = profile.monthly_expenses * profile.emergency_reserve_months
    base_emi = calculate_emi(
        strategy.loan_amount,
        strategy.annual_interest_rate,
        strategy.loan_term_months,
    )
    maturity_month = None
    breaking_month = None
    breaking_cause = None
    recovery_month = None
    breached = False
    recovered = False
    consecutive_negative = 0
    monthly_results: list[MonthlyResult] = []

    for month in range(1, max_months + 1):
        income = profile.monthly_income * scenario.income_multiplier
        expenses = profile.monthly_expenses * ((1 + goal.inflation_rate) ** (month / 12))
        monthly_emi = base_emi
        if strategy.loan_amount > 0 and scenario.interest_rate_increase and month >= 1:
            monthly_emi = calculate_emi(
                strategy.loan_amount,
                strategy.annual_interest_rate + scenario.interest_rate_increase,
                strategy.loan_term_months,
            )

        investment_return = investments * ((1 + 0.10) ** (1 / 12) - 1)
        investments += investment_return
        if month == scenario.investment_shock_month:
            investments *= 1 - scenario.investment_decline

        one_time_expense = (
            scenario.emergency_expense
            if month == scenario.emergency_expense_month
            else 0
        )
        contribution = strategy.monthly_contribution
        monthly_cash_flow = income - expenses - profile.monthly_debt_payment - monthly_emi - contribution - one_time_expense
        cash += monthly_cash_flow
        investments += contribution

        if loan_balance > 0 and monthly_emi > 0:
            monthly_rate = (strategy.annual_interest_rate + scenario.interest_rate_increase) / 12
            interest = loan_balance * monthly_rate
            loan_balance = max(0, loan_balance - (monthly_emi - interest))

        if maturity_month is None:
            if strategy.type == "financed_purchase":
                maturity_ready = cash >= reserve_target
            else:
                maturity_ready = cash + investments >= target_cost
            if maturity_ready:
                maturity_month = month

        breaches: list[str] = []
        if cash < reserve_target:
            breaches.append("emergency_reserve_breached")
        if monthly_cash_flow < 0:
            consecutive_negative += 1
        else:
            consecutive_negative = 0
        if consecutive_negative >= 3:
            breaches.append("negative_cash_flow")
        if income > 0 and monthly_emi / income > 0.45:
            breaches.append("emi_affordability_limit")
        if cash < 0:
            breaches.append("cash_depleted")

        if breaches and not breached:
            breached = True
            breaking_month = month
            breaking_cause = breaches[0]
        if breached and not breaches and not recovered:
            recovered = True
            recovery_month = month

        net_worth = cash + investments - loan_balance
        monthly_results.append(
            MonthlyResult(
                month=month,
                cash_balance=round(cash, 2),
                investment_value=round(investments, 2),
                loan_balance=round(loan_balance, 2),
                net_worth=round(net_worth, 2),
                monthly_cash_flow=round(monthly_cash_flow, 2),
                constraint_breaches=breaches,
            )
        )

    score = 100.0
    if breaking_month is not None:
        score -= 25
    if any("cash_depleted" in result.constraint_breaches for result in monthly_results):
        score -= 25
    if any("emi_affordability_limit" in result.constraint_breaches for result in monthly_results):
        score -= 15
    if recovery_month is None and breaking_month is not None:
        score -= 20
    elif recovery_month and breaking_month and recovery_month - breaking_month > 24:
        score -= 10
    if maturity_month is None:
        score -= 15

    return SimulationResult(
        strategy_id=strategy.id,
        scenario_id=scenario.id,
        maturity_month=maturity_month,
        breaking_point_month=breaking_month,
        breaking_point_cause=breaking_cause,
        recovery_month=recovery_month,
        resilience_score=max(0, min(100, score)),
        monthly_results=monthly_results,
        status="completed",
    )
