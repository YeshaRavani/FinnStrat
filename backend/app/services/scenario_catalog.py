from app.schemas.financial import Scenario


def get_scenarios() -> list[Scenario]:
    return [
        Scenario(id="normal", name="Normal conditions"),
        Scenario(
            id="job_loss",
            name="Job loss",
            income_reduction_percent=0.60,
            income_shock_start_month=6,
            income_shock_duration_months=6,
        ),
        Scenario(
            id="market_crash",
            name="Market crash",
            investment_shock_month=6,
            investment_decline=0.30,
        ),
        Scenario(
            id="medical_emergency",
            name="Medical emergency",
            emergency_expense_month=6,
            emergency_expense=500000,
        ),
        Scenario(
            id="interest_rate_rise",
            name="Interest-rate rise",
            interest_rate_increase=0.02,
            interest_rate_shock_start_month=6,
        ),
        Scenario(
            id="combined_shock",
            name="Combined shock",
            income_reduction_percent=0.60,
            income_shock_start_month=6,
            income_shock_duration_months=6,
            investment_shock_month=6,
            investment_decline=0.30,
            emergency_expense_month=6,
            emergency_expense=500000,
            interest_rate_increase=0.02,
            interest_rate_shock_start_month=6,
            expense_increase_percent=0.10,
            expense_increase_start_month=6,
        ),
    ]


def get_normal_and_stress_scenarios() -> tuple[Scenario, Scenario]:
    scenarios = {scenario.id: scenario for scenario in get_scenarios()}
    return scenarios["normal"], scenarios["combined_shock"]
