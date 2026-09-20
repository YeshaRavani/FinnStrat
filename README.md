# FinnStrat

Input-driven financial resilience and strategy engine.

## Stack

- Frontend: React + TypeScript + Vite
- Backend: FastAPI + Pydantic
- API style: REST under `/api/v1`

## Dataset

The project dataset is available in two forms under `data/`:

- `data/finnstrat.sqlite`: runtime SQLite database used by the backend and ready for local queries.
- `data/finnstrat.sql`: portable SQL dump for inspection, backup, or rebuilding the SQLite database.

The backend opens the bundled SQLite database read-only. Its `stress_scenarios` rows provide the live API scenario catalog and the same scenario definitions used during strategy generation. Set `FINNSTRAT_DB_PATH` to use another compatible SQLite file. The SQL dump is not loaded on every server start; it is the portable export of the dataset, while SQLite is the efficient runtime format. The two checked-in files currently contain identical rows.

For investment growth, the backend estimates a default annual return from month-to-month changes in baseline `full_cash` investment series in `monthly_simulations`, grouped by dataset risk band and mapped to the form's low/medium/high choices. An explicit `expected_annual_investment_return` in an API profile overrides this calibration. These monthly rows are synthetic model outputs, not observed market prices or verified real-world historical returns; the calibration reproduces the dataset's assumptions and should not be interpreted as a forecast.

Existing debt is represented as one aggregate balance with a blended annual interest rate and monthly payment. The simulator accrues monthly interest, applies the payment up to the amount due, stops charging the installment once the modeled balance is paid, and reports the remaining balance in net worth. This is an estimate for multiple debts; it does not model separate loan schedules, fees, changing rates, or missed payments. New financed purchases use a fixed base EMI recalculated over the remaining contractual term when a scenario changes the interest rate; the first installment is paid one month after purchase.

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

Generation is input-driven and deterministic: the same profile, goal, preference, and code produce the same candidate set and ranking. It does not use random sampling or an external AI model. Goals can set `asset_type` to `appreciating_asset`, `depreciating_asset`, or `consumable`; consumables have no retained asset value after purchase.

High priority and low flexibility increase the speed weight in the overall score; lower priority and greater flexibility shift weight toward resilience. The six ranking preferences then apply their documented base weights.

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

### Run a scenario for one strategy

`POST /api/v1/simulations`

Accepts a profile, goal, selected strategy, scenario from the catalog, and `max_months`; returns monthly cash, investment, debt, net-worth, and purchase-event results.

Validation errors use FastAPI's standard `422` response with a `detail` field. The frontend displays that detail and distinguishes it from an unavailable backend.

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

Frontend checks:

```bash
npm test
npm run test:e2e
npm run build
```

The end-to-end check uses locally installed Chrome configured in `frontend/playwright.config.ts`. It checks for horizontal overflow at 320px and 1440px and exercises the live strategy and scenario endpoints. Run it after installing backend requirements; Playwright starts or reuses FastAPI and Vite on their development ports.

From the dashboard, users can also adjust a monthly contribution or down payment and re-run the chosen scenario against the modified strategy.

The backend exposes Swagger documentation at `http://localhost:8000/docs`.
