from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.financial import FinancialGoal, FinancialProfile


class Credentials(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        value = value.strip().lower()
        if not value.replace("_", "").replace("-", "").replace(".", "").isalnum():
            raise ValueError("Username may contain only letters, numbers, dots, hyphens, and underscores.")
        return value


class SignupRequest(Credentials):
    profile: FinancialProfile


class UserPublic(BaseModel):
    id: int
    username: str
    created_at: datetime


class SavedGoal(FinancialGoal):
    id: int
    created_at: datetime


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic
    profile: FinancialProfile
    goals: list[SavedGoal] = Field(default_factory=list)


class SessionResponse(BaseModel):
    user: UserPublic
    profile: FinancialProfile
    goals: list[SavedGoal] = Field(default_factory=list)
