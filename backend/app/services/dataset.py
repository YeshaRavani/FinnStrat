import os
import sqlite3
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
