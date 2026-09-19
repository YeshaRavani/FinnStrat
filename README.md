# FinnStrat

AI-powered financial resilience and strategy engine.

## Stack

- Frontend: React + TypeScript + Vite
- Backend: FastAPI + Pydantic
- API style: REST under `/api/v1`

## Dataset

The project dataset is available as SQL under `data/`:

- `data/finnstrat.sqlite`: SQLite database ready for local queries.
- `data/finnstrat.sql`: portable SQL dump generated from the dataset.

Tables:

- `financial_profiles`
- `strategies`
- `stress_scenarios`
- `monthly_simulations`
- `breaking_points`
- `data_dictionary`

Example:

```bash
sqlite3 data/finnstrat.sqlite "SELECT COUNT(*) FROM monthly_simulations;"
```

## Backend API

### Generate strategies

`POST /api/v1/strategies/generate`

Returns a ranked shortlist of strategy candidates for a generic financial goal. Strategies include purchase-event metadata, normal simulation results, stress simulation results, and explicit scoring dimensions:

- `resilience_score`
- `goal_success_score`
- `liquidity_score`
- `speed_score`
- `wealth_score`
- `debt_score`
- `overall_score`

Supported `ranking_preference` values:

- `balanced`
- `resilience`
- `speed`
- `wealth`
- `liquidity`
- `low_debt`

### List scenarios

`GET /api/v1/scenarios`

Returns the reusable stress scenario catalog used by the strategy engine:

- Normal conditions
- Job loss
- Market crash
- Medical emergency
- Interest-rate rise
- Combined shock

## Local development

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The backend exposes Swagger documentation at `http://localhost:8000/docs`.
