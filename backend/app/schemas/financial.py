from typing import Literal

from pydantic import BaseModel, Field, field_validator


RiskTolerance = Literal["low", "medium", "high"]
GoalPriority = Literal["low", "medium", "high"]
GoalFlexibility = Literal["low", "medium", "high"]


class FinancialProfile(BaseModel):
    monthly_income: float = Field(gt=0)
    monthly_expenses: float = Field(ge=0)
    cash_savings: float = Field(ge=0)
    investments: float = Field(ge=0)
    existing_debt: float = Field(ge=0)
    monthly_debt_payment: float = Field(ge=0)
    emergency_reserve_months: float = Field(default=6, ge=1, le=36)
    risk_tolerance: RiskTolerance = "medium"

    @field_validator("monthly_expenses")
    @classmethod
    def expenses_cannot_exceed_income(cls, value: float, info):
        income = info.data.get("monthly_income")
        if income is not None and value > income:
            raise ValueError("monthly expenses cannot exceed monthly income")
        return value


class FinancialGoal(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: str = Field(min_length=1, max_length=60)
    target_amount: float = Field(gt=0)
    target_date: str | None = None
    priority: GoalPriority = "medium"
    flexibility: GoalFlexibility = "medium"
    inflation_rate: float = Field(default=0.06, ge=0, le=1)
    appreciation_rate: float = Field(default=0, ge=-1, le=1)


class Strategy(BaseModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=120)
    type: Literal["save_then_buy", "financed_purchase", "invest_then_buy", "hybrid"]
    down_payment: float = Field(default=0, ge=0)
    loan_amount: float = Field(default=0, ge=0)
    monthly_contribution: float = Field(default=0, ge=0)
    annual_interest_rate: float = Field(default=0, ge=0, le=1)
    loan_term_months: int = Field(default=0, ge=0)


class Scenario(BaseModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=120)
    income_multiplier: float = Field(default=1, ge=0, le=2)
    investment_shock_month: int | None = Field(default=None, ge=1)
    investment_decline: float = Field(default=0, ge=0, le=1)
    emergency_expense_month: int | None = Field(default=None, ge=1)
    emergency_expense: float = Field(default=0, ge=0)
    interest_rate_increase: float = Field(default=0, ge=0, le=1)


class SimulationRequest(BaseModel):
    profile: FinancialProfile
    goal: FinancialGoal
    strategy: Strategy
    scenario: Scenario
    max_months: int = Field(default=120, ge=1, le=600)


class MonthlyResult(BaseModel):
    month: int
    cash_balance: float
    investment_value: float
    loan_balance: float
    net_worth: float
    monthly_cash_flow: float
    constraint_breaches: list[str] = []


class SimulationResult(BaseModel):
    strategy_id: str
    scenario_id: str
    maturity_month: int | None = None
    breaking_point_month: int | None = None
    breaking_point_cause: str | None = None
    recovery_month: int | None = None
    resilience_score: float | None = None
    monthly_results: list[MonthlyResult] = []
    status: Literal["pending", "completed"] = "pending"
