from contextlib import closing

from app.schemas.financial import Scenario
from app.services.dataset import connect_dataset


def get_scenarios() -> list[Scenario]:
    ids = {
        "baseline": "normal",
        "job_loss_6m": "job_loss",
        "rate_hike": "interest_rate_rise",
        "compound_shock": "combined_shock",
    }
    with closing(connect_dataset()) as connection:
        rows = connection.execute(
            "SELECT * FROM stress_scenarios ORDER BY rowid"
        ).fetchall()

    scenarios = []
    for row in rows:
        dataset_id = row["scenario_id"]
        scenarios.append(Scenario(
            id=ids.get(dataset_id, dataset_id),
            name={
                "baseline": "Normal conditions",
                "job_loss_6m": "Job loss",
                "market_crash": "Market crash",
                "medical_emergency": "Medical emergency",
                "rate_hike": "Interest-rate rise",
                "compound_shock": "Combined shock",
            }.get(dataset_id, row["scenario_name"]),
            income_multiplier=1,
            income_reduction_percent=row["income_loss_percent"],
            income_shock_start_month=row["income_loss_start_month"],
            income_shock_duration_months=row["income_loss_duration_months"],
            investment_shock_month=row["market_drop_month"],
            investment_decline=row["market_drop_percent"],
            emergency_expense_month=row["unexpected_expense_month"],
            emergency_expense=row["unexpected_expense_amount"],
            interest_rate_increase=row["rate_hike_percent_points"],
            interest_rate_shock_start_month=row["rate_hike_start_month"],
        ))
    return scenarios


def get_normal_and_stress_scenarios() -> tuple[Scenario, Scenario]:
    scenarios = {scenario.id: scenario for scenario in get_scenarios()}
    return scenarios["normal"], scenarios["combined_shock"]
