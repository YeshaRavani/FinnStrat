from app.schemas.financial import FinancialGoal, FinancialProfile, Scenario, Strategy
from app.services.simulation_engine import calculate_emi, inflation_adjusted_goal_cost, simulate


def test_calculate_emi_returns_positive_payment():
    assert calculate_emi(1_000_000, 0.08, 60) > 0


def test_calculate_emi_handles_zero_interest_loan():
    assert calculate_emi(120_000, 0, 12) == 10_000


def test_goal_cost_inflates_over_time():
    goal = FinancialGoal(name="Car", category="vehicle", target_amount=1_000_000)

    assert inflation_adjusted_goal_cost(goal, 12) > goal.target_amount


def test_simulation_returns_monthly_results_and_score():
    result = simulate(
        profile=FinancialProfile(
            monthly_income=250000,
            monthly_expenses=100000,
            cash_savings=800000,
            investments=500000,
            existing_debt=0,
            monthly_debt_payment=0,
        ),
        goal=FinancialGoal(name="Car", category="vehicle", target_amount=1800000),
        strategy=Strategy(
            id="save-1",
            name="Save then buy",
            type="save_then_buy",
            monthly_contribution=50000,
        ),
        scenario=Scenario(id="normal", name="Normal"),
        max_months=12,
    )

    assert result.status == "completed"
    assert len(result.monthly_results) == 12
    assert result.resilience_score is not None


def test_saving_strategy_records_purchase_event_at_maturity():
    result = simulate(
        profile=FinancialProfile(
            monthly_income=250000,
            monthly_expenses=100000,
            cash_savings=1200000,
            investments=0,
            existing_debt=0,
            monthly_debt_payment=0,
            emergency_reserve_months=3,
        ),
        goal=FinancialGoal(
            name="Education",
            category="education",
            target_amount=600000,
            inflation_rate=0,
            asset_type="consumable",
        ),
        strategy=Strategy(
            id="save",
            name="Save then buy",
            type="save_then_buy",
            monthly_contribution=0,
        ),
        scenario=Scenario(id="normal", name="Normal"),
        max_months=3,
    )

    purchase_month = result.monthly_results[result.maturity_month - 1]
    assert result.goal_acquired is True
    assert purchase_month.purchase_amount == 600000
    assert purchase_month.down_payment_paid == 600000
    assert purchase_month.goal_asset_value == 0


def test_appreciating_goal_value_grows_after_purchase():
    result = simulate(
        profile=FinancialProfile(
            monthly_income=250000,
            monthly_expenses=100000,
            cash_savings=1500000,
            investments=0,
            existing_debt=0,
            monthly_debt_payment=0,
            emergency_reserve_months=3,
        ),
        goal=FinancialGoal(
            name="Land",
            category="land",
            target_amount=1000000,
            inflation_rate=0,
            appreciation_rate=0.12,
            asset_type="appreciating_asset",
        ),
        strategy=Strategy(id="save-land", name="Save", type="save_then_buy"),
        scenario=Scenario(id="normal", name="Normal"),
        max_months=13,
    )

    assert result.maturity_month == 1
    assert result.monthly_results[12].goal_asset_value > result.monthly_results[0].goal_asset_value


def test_financed_purchase_waits_out_structurally_negative_cash_flow():
    result = simulate(
        profile=FinancialProfile(
            monthly_income=100000,
            monthly_expenses=70000,
            cash_savings=1000000,
            investments=0,
            existing_debt=0,
            monthly_debt_payment=0,
            emergency_reserve_months=3,
        ),
        goal=FinancialGoal(name="Vehicle", category="vehicle", target_amount=900000, inflation_rate=0),
        strategy=Strategy(
            id="finance-unstable",
            name="Unstable finance",
            type="financed_purchase",
            down_payment=100000,
            loan_amount=800000,
            monthly_contribution=20000,
            annual_interest_rate=0.10,
            loan_term_months=36,
        ),
        scenario=Scenario(id="normal", name="Normal"),
        max_months=6,
    )

    assert result.maturity_month is None


def test_financed_purchase_creates_loan_and_reduces_balance():
    result = simulate(
        profile=FinancialProfile(
            monthly_income=300000,
            monthly_expenses=80000,
            cash_savings=700000,
            investments=0,
            existing_debt=0,
            monthly_debt_payment=0,
            emergency_reserve_months=3,
        ),
        goal=FinancialGoal(name="Car", category="vehicle", target_amount=1000000, inflation_rate=0),
        strategy=Strategy(
            id="finance",
            name="Finance",
            type="financed_purchase",
            down_payment=300000,
            loan_amount=700000,
            annual_interest_rate=0.08,
            loan_term_months=60,
        ),
        scenario=Scenario(id="normal", name="Normal"),
        max_months=3,
    )

    purchase_month = result.monthly_results[result.maturity_month - 1]
    later_month = result.monthly_results[-1]
    assert purchase_month.loan_created == 700000
    assert later_month.loan_balance < purchase_month.loan_balance


def test_investment_crash_income_loss_and_emergency_expense_affect_results():
    normal = simulate(
        profile=FinancialProfile(
            monthly_income=250000,
            monthly_expenses=100000,
            cash_savings=900000,
            investments=500000,
            existing_debt=0,
            monthly_debt_payment=0,
            emergency_reserve_months=3,
        ),
        goal=FinancialGoal(name="Car", category="vehicle", target_amount=1000000, inflation_rate=0),
        strategy=Strategy(id="save", name="Save", type="save_then_buy", monthly_contribution=50000),
        scenario=Scenario(id="normal", name="Normal"),
        max_months=6,
    )
    stressed = simulate(
        profile=FinancialProfile(
            monthly_income=250000,
            monthly_expenses=100000,
            cash_savings=900000,
            investments=500000,
            existing_debt=0,
            monthly_debt_payment=0,
            emergency_reserve_months=3,
        ),
        goal=FinancialGoal(name="Car", category="vehicle", target_amount=1000000, inflation_rate=0),
        strategy=Strategy(id="save", name="Save", type="save_then_buy", monthly_contribution=50000),
        scenario=Scenario(
            id="stress",
            name="Stress",
            income_reduction_percent=0.5,
            income_shock_start_month=2,
            income_shock_duration_months=2,
            investment_shock_month=2,
            investment_decline=0.4,
            emergency_expense_month=2,
            emergency_expense=250000,
        ),
        max_months=6,
    )

    assert stressed.monthly_results[1].monthly_cash_flow < normal.monthly_results[1].monthly_cash_flow
    assert stressed.monthly_results[1].investment_value < normal.monthly_results[1].investment_value


def test_reserve_breach_and_recovery_are_detected():
    result = simulate(
        profile=FinancialProfile(
            monthly_income=300000,
            monthly_expenses=100000,
            cash_savings=500000,
            investments=0,
            existing_debt=0,
            monthly_debt_payment=0,
            emergency_reserve_months=3,
        ),
        goal=FinancialGoal(name="Car", category="vehicle", target_amount=2000000, inflation_rate=0),
        strategy=Strategy(id="save", name="Save", type="save_then_buy", monthly_contribution=0),
        scenario=Scenario(
            id="emergency",
            name="Emergency",
            emergency_expense_month=1,
            emergency_expense=600000,
        ),
        max_months=6,
    )

    assert result.breaking_point_month == 1
    assert result.breaking_point_cause == "emergency_reserve_breached"
    assert result.recovery_month is not None


def test_identical_inputs_produce_identical_simulation_results():
    profile = FinancialProfile(
        monthly_income=250000,
        monthly_expenses=100000,
        cash_savings=900000,
        investments=500000,
        existing_debt=0,
        monthly_debt_payment=0,
    )
    goal = FinancialGoal(name="Land", category="land", target_amount=1000000)
    strategy = Strategy(id="save", name="Save", type="save_then_buy", monthly_contribution=40000)
    scenario = Scenario(id="normal", name="Normal")

    first = simulate(profile, goal, strategy, scenario, 24)
    second = simulate(profile, goal, strategy, scenario, 24)

    assert first == second
