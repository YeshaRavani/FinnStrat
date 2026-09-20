from fastapi import APIRouter, Depends

from app.api.dependencies import current_user
from app.schemas.auth import SavedGoal, UserPublic
from app.schemas.financial import FinancialGoal
from app.services.auth_store import list_goals, save_goal


router = APIRouter(prefix="/api/v1/goals", tags=["goals"])


@router.get("", response_model=list[SavedGoal])
def get_goals(user: UserPublic = Depends(current_user)) -> list[SavedGoal]:
    return list_goals(user.id)


@router.post("", response_model=SavedGoal)
def create_goal(goal: FinancialGoal, user: UserPublic = Depends(current_user)) -> SavedGoal:
    return save_goal(user.id, goal)
