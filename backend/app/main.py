from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.routes.simulations import router as simulations_router
from app.api.routes.scenarios import router as scenarios_router
from app.api.routes.strategies import router as strategies_router
from app.api.routes.affordability import router as affordability_router
from app.api.routes.auth import router as auth_router
from app.api.routes.goals import router as goals_router
from app.api.routes.chat import router as chat_router
from app.services.auth_store import initialize_database


load_dotenv(Path(__file__).resolve().parents[2] / ".env")


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    yield

app = FastAPI(
    title="FinnStrat API",
    version="0.1.0",
    description="Financial strategy generation and resilience simulation API.",
    lifespan=lifespan,
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
app.include_router(affordability_router)
app.include_router(auth_router)
app.include_router(goals_router)
app.include_router(chat_router)


@app.get("/api/v1/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "finnstrat-api"}
