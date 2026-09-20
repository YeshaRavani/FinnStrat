import os
import sqlite3
from functools import lru_cache
from pathlib import Path


DEFAULT_DATABASE_PATH = Path(__file__).resolve().parents[3] / "data" / "finnstrat.sqlite"


def connect_dataset() -> sqlite3.Connection:
    """Open the bundled SQLite dataset read-only, with an optional path override."""
    database_path = Path(os.getenv("FINNSTRAT_DB_PATH", str(DEFAULT_DATABASE_PATH))).expanduser()
    if not database_path.is_file():
        raise FileNotFoundError(f"FinnStrat SQLite dataset not found: {database_path}")
    connection = sqlite3.connect(f"file:{database_path.resolve()}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    return connection


@lru_cache(maxsize=4)
def get_dataset_investment_returns(database_path: str) -> dict[str, float]:
    """Infer annualized returns from baseline synthetic investment series by risk band."""
    connection = sqlite3.connect(f"file:{Path(database_path).resolve()}?mode=ro", uri=True)
    try:
        rows = connection.execute(
            """
            WITH investment_series AS (
                SELECT p.risk_tolerance, m.month, m.home_owned, m.investment_value,
                       LAG(m.investment_value) OVER (
                           PARTITION BY m.profile_id, m.strategy_id ORDER BY m.month
                       ) AS previous_value
                FROM monthly_simulations AS m
                JOIN financial_profiles AS p USING (profile_id)
                JOIN strategies AS s USING (strategy_id)
                WHERE m.scenario_id = 'baseline' AND s.strategy_code = 'full_cash'
            )
            SELECT risk_tolerance, investment_value * 1.0 / previous_value AS monthly_growth
            FROM investment_series
            WHERE month > 1 AND home_owned = 0 AND previous_value > 0
            """
        ).fetchall()
    finally:
        connection.close()

    samples: dict[str, list[float]] = {}
    for risk_tolerance, growth in rows:
        samples.setdefault(risk_tolerance, []).append(growth)

    result = {}
    for risk_tolerance, values in samples.items():
        values.sort()
        middle = len(values) // 2
        monthly_growth = values[middle] if len(values) % 2 else (values[middle - 1] + values[middle]) / 2
        result[risk_tolerance] = monthly_growth**12 - 1
    return result


def calibrated_investment_return(risk_tolerance: str) -> float:
    database_path = Path(os.getenv("FINNSTRAT_DB_PATH", str(DEFAULT_DATABASE_PATH))).expanduser()
    dataset_risk = {"low": "conservative", "medium": "balanced", "high": "growth"}[risk_tolerance]
    calibrated = get_dataset_investment_returns(str(database_path))
    defaults = {"conservative": 0.07, "balanced": 0.095, "growth": 0.12}
    return calibrated.get(dataset_risk, defaults[dataset_risk])
