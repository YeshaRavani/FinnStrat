import hashlib
import hmac
import os
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.schemas.auth import SavedGoal, UserPublic
from app.schemas.financial import FinancialGoal, FinancialProfile


DEFAULT_APP_DATABASE_PATH = Path(__file__).resolve().parents[3] / "data" / "finnstrat_app.sqlite"
PBKDF2_ITERATIONS = 310_000
SESSION_DAYS = 30


def database_path() -> Path:
    return Path(os.getenv("FINNSTRAT_APP_DB_PATH", str(DEFAULT_APP_DATABASE_PATH))).expanduser()


def _connect() -> sqlite3.Connection:
    path = database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database() -> None:
    with _connect() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS financial_profiles (
                user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                monthly_income REAL NOT NULL,
                monthly_expenses REAL NOT NULL,
                cash_savings REAL NOT NULL,
                investments REAL NOT NULL,
                existing_debt REAL NOT NULL,
                monthly_debt_payment REAL NOT NULL,
                existing_debt_annual_interest_rate REAL NOT NULL DEFAULT 0,
                emergency_reserve_months REAL NOT NULL,
                risk_tolerance TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                target_amount REAL NOT NULL,
                target_date TEXT,
                priority TEXT NOT NULL,
                flexibility TEXT NOT NULL,
                inflation_rate REAL NOT NULL,
                appreciation_rate REAL NOT NULL,
                asset_type TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(user_id, name)
            );
            """
        )


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _password_hash(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${derived.hex()}"


def _verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        derived = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations))
        return hmac.compare_digest(derived.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _profile_values(profile: FinancialProfile) -> tuple:
    return (
        profile.monthly_income,
        profile.monthly_expenses,
        profile.cash_savings,
        profile.investments,
        profile.existing_debt,
        profile.monthly_debt_payment,
        profile.existing_debt_annual_interest_rate,
        profile.emergency_reserve_months,
        profile.risk_tolerance,
    )


def _profile_from_row(row: sqlite3.Row) -> FinancialProfile:
    return FinancialProfile(
        monthly_income=row["monthly_income"],
        monthly_expenses=row["monthly_expenses"],
        cash_savings=row["cash_savings"],
        investments=row["investments"],
        existing_debt=row["existing_debt"],
        monthly_debt_payment=row["monthly_debt_payment"],
        existing_debt_annual_interest_rate=row["existing_debt_annual_interest_rate"],
        emergency_reserve_months=row["emergency_reserve_months"],
        risk_tolerance=row["risk_tolerance"],
    )


def _user_from_row(row: sqlite3.Row) -> UserPublic:
    return UserPublic(id=row["id"], username=row["username"], created_at=row["created_at"])


def _goal_from_row(row: sqlite3.Row) -> SavedGoal:
    return SavedGoal(
        id=row["id"],
        name=row["name"],
        category=row["category"],
        target_amount=row["target_amount"],
        target_date=row["target_date"],
        priority=row["priority"],
        flexibility=row["flexibility"],
        inflation_rate=row["inflation_rate"],
        appreciation_rate=row["appreciation_rate"],
        asset_type=row["asset_type"],
        created_at=row["created_at"],
    )


def create_user(username: str, password: str, profile: FinancialProfile) -> UserPublic:
    initialize_database()
    now = _now().isoformat()
    try:
        with _connect() as connection:
            cursor = connection.execute(
                "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
                (username, _password_hash(password), now),
            )
            user_id = cursor.lastrowid
            connection.execute(
                """INSERT INTO financial_profiles
                (user_id, monthly_income, monthly_expenses, cash_savings, investments,
                 existing_debt, monthly_debt_payment, existing_debt_annual_interest_rate,
                 emergency_reserve_months, risk_tolerance, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (user_id, *_profile_values(profile), now),
            )
            row = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            return _user_from_row(row)
    except sqlite3.IntegrityError as error:
        raise ValueError("That username is already taken.") from error


def authenticate(username: str, password: str) -> UserPublic | None:
    initialize_database()
    with _connect() as connection:
        row = connection.execute("SELECT * FROM users WHERE username = ? COLLATE NOCASE", (username,)).fetchone()
        if row is None or not _verify_password(password, row["password_hash"]):
            return None
        return _user_from_row(row)


def create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    now = _now()
    with _connect() as connection:
        connection.execute(
            "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
            (_token_hash(token), user_id, (now + timedelta(days=SESSION_DAYS)).isoformat(), now.isoformat()),
        )
    return token


def user_for_token(token: str) -> UserPublic | None:
    initialize_database()
    now = _now()
    with _connect() as connection:
        row = connection.execute(
            """SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
               WHERE s.token_hash = ? AND s.expires_at > ?""",
            (_token_hash(token), now.isoformat()),
        ).fetchone()
        return _user_from_row(row) if row else None


def get_profile(user_id: int) -> FinancialProfile:
    with _connect() as connection:
        row = connection.execute("SELECT * FROM financial_profiles WHERE user_id = ?", (user_id,)).fetchone()
    if row is None:
        raise ValueError("Financial profile not found.")
    return _profile_from_row(row)


def update_profile(user_id: int, profile: FinancialProfile) -> FinancialProfile:
    now = _now().isoformat()
    with _connect() as connection:
        connection.execute(
            """UPDATE financial_profiles SET monthly_income = ?, monthly_expenses = ?, cash_savings = ?,
               investments = ?, existing_debt = ?, monthly_debt_payment = ?,
               existing_debt_annual_interest_rate = ?, emergency_reserve_months = ?,
               risk_tolerance = ?, updated_at = ? WHERE user_id = ?""",
            (*_profile_values(profile), now, user_id),
        )
    return get_profile(user_id)


def list_goals(user_id: int) -> list[SavedGoal]:
    with _connect() as connection:
        rows = connection.execute("SELECT * FROM goals WHERE user_id = ? ORDER BY updated_at DESC", (user_id,)).fetchall()
    return [_goal_from_row(row) for row in rows]


def save_goal(user_id: int, goal: FinancialGoal) -> SavedGoal:
    now = _now().isoformat()
    with _connect() as connection:
        connection.execute(
            """INSERT INTO goals (user_id, name, category, target_amount, target_date, priority, flexibility,
               inflation_rate, appreciation_rate, asset_type, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(user_id, name) DO UPDATE SET category = excluded.category,
               target_amount = excluded.target_amount, target_date = excluded.target_date,
               priority = excluded.priority, flexibility = excluded.flexibility,
               inflation_rate = excluded.inflation_rate, appreciation_rate = excluded.appreciation_rate,
               asset_type = excluded.asset_type, updated_at = excluded.updated_at""",
            (user_id, goal.name, goal.category, goal.target_amount, goal.target_date, goal.priority,
             goal.flexibility, goal.inflation_rate, goal.appreciation_rate, goal.asset_type, now, now),
        )
        row = connection.execute("SELECT * FROM goals WHERE user_id = ? AND name = ?", (user_id, goal.name)).fetchone()
    return _goal_from_row(row)


def delete_session(token: str) -> None:
    with _connect() as connection:
        connection.execute("DELETE FROM sessions WHERE token_hash = ?", (_token_hash(token),))
