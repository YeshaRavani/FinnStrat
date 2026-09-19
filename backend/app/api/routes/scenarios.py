from fastapi import APIRouter

from app.schemas.financial import Scenario
from app.services.scenario_catalog import get_scenarios

router = APIRouter(prefix="/api/v1/scenarios", tags=["scenarios"])


@router.get("", response_model=list[Scenario])
def list_scenarios() -> list[Scenario]:
    return get_scenarios()
