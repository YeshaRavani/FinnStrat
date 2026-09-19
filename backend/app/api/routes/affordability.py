from fastapi import APIRouter

from app.schemas.financial import AffordabilityResult, StrategyGenerationRequest
from app.services.affordability import assess_affordability

router = APIRouter(prefix="/api/v1/affordability", tags=["affordability"])


@router.post("/check", response_model=AffordabilityResult)
def check_affordability(request: StrategyGenerationRequest) -> AffordabilityResult:
    return assess_affordability(request.profile, request.goal, request.max_months)
