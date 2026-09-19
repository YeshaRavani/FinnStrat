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


def inflation_adjusted_goal_cost(goal: FinancialGoal, month: int) -> float:
    return goal.target_amount * ((1 + goal.inflation_rate) ** (month / 12))


def _is_income_shock_active(scenario: Scenario, month: int) -> bool:
    if scenario.income_shock_start_month is None:
        return False
    end_month = scenario.income_shock_start_month + scenario.income_shock_duration_months
    return scenario.income_shock_start_month <= month < end_month


def _is_rate_shock_active(scenario: Scenario, month: int) -> bool:
    if scenario.interest_rate_increase <= 0:
        return False
    if scenario.interest_rate_shock_start_month is None:
        return True
    return month >= scenario.interest_rate_shock_start_month


def _is_expense_shock_active(scenario: Scenario, month: int) -> bool:
    if scenario.expense_increase_percent <= 0:
        return False
    if scenario.expense_increase_start_month is None:
        return True
    return month >= scenario.expense_increase_start_month


def _goal_asset_value(goal: FinancialGoal, purchase_amount: float, months_owned: int) -> float:
    if goal.asset_type == "consumable":
        return 0.0
    appreciation = (1 + goal.appreciation_rate) ** (months_owned / 12)
    return max(0.0, purchase_amount * appreciation)


def _available_for_purchase(cash: float, investments: float, reserve_target: float) -> float:
    return max(0.0, cash - reserve_target) + investments


def _liquidate_for_purchase(
    cash: float,
    investments: float,
    reserve_target: float,
    amount: float,
) -> tuple[float, float]:
    cash_available = max(0.0, cash - reserve_target)
    cash_used = min(cash_available, amount)
    remaining = amount - cash_used
    investments_used = min(investments, remaining)
    return cash - cash_used, investments - investments_used


def simulate(
    profile: FinancialProfile,
    goal: FinancialGoal,
    strategy: Strategy,
    scenario: Scenario,
    max_months: int,
) -> SimulationResult:
    cash = profile.cash_savings
    investments = profile.investments
    loan_balance = 0.0
    goal_asset_value = 0.0
    reserve_target = profile.monthly_expenses * profile.emergency_reserve_months
    maturity_month = None
    purchase_amount = 0.0
    down_payment_paid = 0.0
    loan_created = 0.0
    loan_start_month = None
    breaking_month = None
    breaking_cause = None
    recovery_month = None
    breached = False
    recovered = False
    consecutive_negative = 0
    monthly_results: list[MonthlyResult] = []

    for month in range(1, max_months + 1):
        income = profile.monthly_income * scenario.income_multiplier
        if _is_income_shock_active(scenario, month):
            income *= 1 - scenario.income_reduction_percent

        expenses = profile.monthly_expenses * ((1 + goal.inflation_rate) ** (month / 12))
        if _is_expense_shock_active(scenario, month):
            expenses *= 1 + scenario.expense_increase_percent

        active_rate = strategy.annual_interest_rate
        if _is_rate_shock_active(scenario, month):
            active_rate += scenario.interest_rate_increase

        remaining_term = strategy.loan_term_months
        if loan_start_month is not None:
            remaining_term = max(1, strategy.loan_term_months - (month - loan_start_month))
        monthly_emi = 0.0
        if loan_balance > 0:
            monthly_emi = calculate_emi(
                loan_balance,
                active_rate,
                remaining_term,
            )

        investment_return = investments * ((1 + profile.expected_annual_investment_return) ** (1 / 12) - 1)
        investments += investment_return
        if month == scenario.investment_shock_month:
            investments *= 1 - scenario.investment_decline

        one_time_expense = (
            scenario.emergency_expense
            if month == scenario.emergency_expense_month
            else 0
        )
        contribution = strategy.monthly_contribution
        contribution_to_investments = contribution * strategy.investment_allocation
        contribution_to_cash = contribution - contribution_to_investments
        monthly_cash_flow = (
            income
            - expenses
            - profile.monthly_debt_payment
            - monthly_emi
            - contribution
            - one_time_expense
        )
        cash += monthly_cash_flow
        cash += contribution_to_cash
        investments += contribution_to_investments

        if loan_balance > 0 and monthly_emi > 0:
            monthly_rate = active_rate / 12
            interest = loan_balance * monthly_rate
            loan_balance = max(0, loan_balance - (monthly_emi - interest))

        if maturity_month is None:
            target_cost = inflation_adjusted_goal_cost(goal, month)
            planned_purchase_month = strategy.purchase_month or 0
            purchase_timing_ready = month >= planned_purchase_month
            if strategy.type in {"save_then_buy", "invest_then_buy"}:
                amount_needed_from_assets = target_cost
                planned_loan = 0.0
                affordable_emi = True
            else:
                planned_loan = min(strategy.loan_amount, target_cost)
                planned_down_payment = strategy.down_payment or max(0.0, target_cost - planned_loan)
                amount_needed_from_assets = min(target_cost, planned_down_payment)
                planned_loan = max(0.0, target_cost - amount_needed_from_assets)
                test_emi = calculate_emi(
                    planned_loan,
                    active_rate,
                    strategy.loan_term_months,
                )
                affordable_emi = (
                    income > 0
                    and test_emi / income <= profile.max_emi_to_income_ratio
                    and income - expenses - profile.monthly_debt_payment - test_emi >= 0
                )
            maturity_ready = (
                purchase_timing_ready
                and _available_for_purchase(cash, investments, reserve_target) >= amount_needed_from_assets
                and affordable_emi
            )
            if maturity_ready:
                maturity_month = month
                purchase_amount = target_cost
                down_payment_paid = amount_needed_from_assets
                loan_created = planned_loan
                cash, investments = _liquidate_for_purchase(
                    cash,
                    investments,
                    reserve_target,
                    down_payment_paid,
                )
                loan_balance += loan_created
                if loan_created > 0:
                    loan_start_month = month
                goal_asset_value = _goal_asset_value(goal, purchase_amount, 0)
        elif maturity_month is not None:
            goal_asset_value = _goal_asset_value(
                goal,
                purchase_amount,
                month - maturity_month,
            )

        breaches: list[str] = []
        if cash < reserve_target:
            breaches.append("emergency_reserve_breached")
        if monthly_cash_flow < 0:
            consecutive_negative += 1
        else:
            consecutive_negative = 0
        if consecutive_negative >= 3:
            breaches.append("negative_cash_flow")
        if income > 0 and monthly_emi / income > profile.max_emi_to_income_ratio:
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

        net_worth = cash + investments + goal_asset_value - loan_balance - profile.existing_debt
        monthly_results.append(
            MonthlyResult(
                month=month,
                cash_balance=round(cash, 2),
                investment_value=round(investments, 2),
                loan_balance=round(loan_balance, 2),
                goal_asset_value=round(goal_asset_value, 2),
                net_worth=round(net_worth, 2),
                monthly_cash_flow=round(monthly_cash_flow, 2),
                goal_acquired=maturity_month is not None,
                purchase_amount=round(purchase_amount, 2) if maturity_month == month else 0,
                down_payment_paid=round(down_payment_paid, 2) if maturity_month == month else 0,
                loan_created=round(loan_created, 2) if maturity_month == month else 0,
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
        goal_acquired=maturity_month is not None,
        purchase_amount=round(purchase_amount, 2),
        down_payment_paid=round(down_payment_paid, 2),
        loan_created=round(loan_created, 2),
        breaking_point_month=breaking_month,
        breaking_point_cause=breaking_cause,
        recovery_month=recovery_month,
        resilience_score=max(0, min(100, score)),
        monthly_results=monthly_results,
        status="completed",
    )
