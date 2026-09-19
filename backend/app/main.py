from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.simulations import router as simulations_router
from app.api.routes.scenarios import router as scenarios_router
from app.api.routes.strategies import router as strategies_router

app = FastAPI(
    title="FinnStrat API",
    version="0.1.0",
    description="Financial strategy generation and resilience simulation API.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulations_router)
app.include_router(scenarios_router)
app.include_router(strategies_router)


@app.get("/api/v1/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "finnstrat-api"}
