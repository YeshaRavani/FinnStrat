from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.financial import FinancialGoal, FinancialProfile, Strategy


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatSimulationSummary(BaseModel):
    maturity_month: int | None = None
    goal_acquired: bool = False
    breaking_point_month: int | None = None
    breaking_point_cause: str | None = None
    recovery_month: int | None = None
    resilience_score: float | None = None
    lowest_cash: float | None = None
    final_cash: float = 0
    final_investments: float = 0
    final_debt: float = 0
    final_net_worth: float = 0


class ChatStrategySummary(BaseModel):
    strategy: Strategy
    maturity_month: int | None = None
    resilience_score: float
    goal_success_score: float
    liquidity_score: float
    speed_score: float
    wealth_score: float
    debt_score: float
    overall_score: float
    normal: ChatSimulationSummary
    stress: ChatSimulationSummary


class StrategyChatRequest(BaseModel):
    profile: FinancialProfile
    goal: FinancialGoal
    strategies: list[ChatStrategySummary] = Field(min_length=1, max_length=10)
    selected_strategy_id: str | None = None
    messages: list[ChatMessage] = Field(min_length=1, max_length=12)


class StrategyChatResponse(BaseModel):
    message: str
    model: str
