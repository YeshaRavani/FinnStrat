from fastapi import APIRouter

from app.schemas.financial import RankedStrategy, StrategyGenerationRequest
from app.services.strategy_generator import generate_ranked_strategies

router = APIRouter(prefix="/api/v1/strategies", tags=["strategies"])


@router.post("/generate", response_model=list[RankedStrategy])
def generate_strategies(request: StrategyGenerationRequest) -> list[RankedStrategy]:
    return generate_ranked_strategies(request)
