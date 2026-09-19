# FinnStrat

AI-powered financial resilience and strategy engine.

## Stack

- Frontend: React + TypeScript + Vite
- Backend: FastAPI + Pydantic
- API style: REST under `/api/v1`

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
