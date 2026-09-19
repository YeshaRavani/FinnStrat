from fastapi import APIRouter

from app.schemas.financial import SimulationRequest, SimulationResult
from app.services.simulation_engine import simulate

router = APIRouter(prefix="/api/v1/simulations", tags=["simulations"])


@router.post("", response_model=SimulationResult)
def create_simulation(request: SimulationRequest) -> SimulationResult:
    return simulate(
        profile=request.profile,
        goal=request.goal,
        strategy=request.strategy,
        scenario=request.scenario,
        max_months=request.max_months,
    )
