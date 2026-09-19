from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


RiskTolerance = Literal["low", "medium", "high"]
GoalPriority = Literal["low", "medium", "high"]
GoalFlexibility = Literal["low", "medium", "high"]
StrategyType = Literal["save_then_buy", "financed_purchase", "invest_then_buy", "hybrid"]
GoalAssetType = Literal["appreciating_asset", "depreciating_asset", "consumable"]
RankingPreference = Literal["balanced", "resilience", "speed", "wealth", "liquidity", "low_debt"]


class FinancialProfile(BaseModel):
    monthly_income: float = Field(gt=0)
    monthly_expenses: float = Field(ge=0)
    cash_savings: float = Field(ge=0)
    investments: float = Field(ge=0)
    existing_debt: float = Field(ge=0)
    monthly_debt_payment: float = Field(ge=0)
    emergency_reserve_months: float = Field(default=6, ge=1, le=36)
    risk_tolerance: RiskTolerance = "medium"
    expected_annual_investment_return: float = Field(default=0.10, ge=-1, le=1)
    max_emi_to_income_ratio: float = Field(default=0.45, ge=0, le=1)

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
    asset_type: GoalAssetType = "appreciating_asset"


class Strategy(BaseModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=120)
    type: StrategyType
    down_payment: float = Field(default=0, ge=0)
    loan_amount: float = Field(default=0, ge=0)
    monthly_contribution: float = Field(default=0, ge=0)
    investment_allocation: float = Field(default=0, ge=0, le=1)
    purchase_month: int | None = Field(default=None, ge=0)
    annual_interest_rate: float = Field(default=0, ge=0, le=1)
    loan_term_months: int = Field(default=0, ge=0)
    explanation: str = Field(default="", max_length=500)

    @model_validator(mode="after")
    def loan_terms_match_loan_amount(self):
        if self.loan_amount == 0 and self.loan_term_months == 0:
            return self
        if self.loan_amount > 0 and self.loan_term_months > 0:
            return self
        raise ValueError("loan_amount and loan_term_months must both be positive for financed strategies")


class Scenario(BaseModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=120)
    income_multiplier: float = Field(default=1, ge=0, le=2)
    income_reduction_percent: float = Field(default=0, ge=0, le=1)
    income_shock_start_month: int | None = Field(default=None, ge=1)
    income_shock_duration_months: int = Field(default=0, ge=0)
    investment_shock_month: int | None = Field(default=None, ge=1)
    investment_decline: float = Field(default=0, ge=0, le=1)
    emergency_expense_month: int | None = Field(default=None, ge=1)
    emergency_expense: float = Field(default=0, ge=0)
    interest_rate_increase: float = Field(default=0, ge=0, le=1)
    interest_rate_shock_start_month: int | None = Field(default=None, ge=1)
    expense_increase_percent: float = Field(default=0, ge=0, le=1)
    expense_increase_start_month: int | None = Field(default=None, ge=1)


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
    goal_asset_value: float = 0
    net_worth: float
    monthly_cash_flow: float
    goal_acquired: bool = False
    purchase_amount: float = 0
    down_payment_paid: float = 0
    loan_created: float = 0
    constraint_breaches: list[str] = Field(default_factory=list)


class SimulationResult(BaseModel):
    strategy_id: str
    scenario_id: str
    maturity_month: int | None = None
    goal_acquired: bool = False
    purchase_amount: float = 0
    down_payment_paid: float = 0
    loan_created: float = 0
    breaking_point_month: int | None = None
    breaking_point_cause: str | None = None
    recovery_month: int | None = None
    resilience_score: float | None = None
    monthly_results: list[MonthlyResult] = Field(default_factory=list)
    status: Literal["pending", "completed"] = "pending"


class StrategyGenerationRequest(BaseModel):
    profile: FinancialProfile
    goal: FinancialGoal
    max_months: int = Field(default=120, ge=1, le=600)
    ranking_preference: RankingPreference = "balanced"


class RankedStrategy(BaseModel):
    strategy: Strategy
    maturity_month: int | None
    resilience_score: float
    goal_success_score: float
    liquidity_score: float
    speed_score: float
    wealth_score: float = 0
    debt_score: float = 0
    overall_score: float
    normal_simulation: SimulationResult
    stress_simulation: SimulationResult
