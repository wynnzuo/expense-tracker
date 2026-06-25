# Python Agent Service

This service hosts the LangGraph-based bookkeeping agent for the A2A expense tracker.

## Stack

- `FastAPI`
- `LangGraph`
- `LangChain`
- `Pydantic`

## Run

1. Create a virtual environment
2. Install dependencies from `requirements.txt`
3. Fill `LLM_API_KEY` in the project `.env`
4. Set `DATABASE_URL` if you want SQLAlchemy to create tables and persist logs
5. Start the API server with `uvicorn app.main:app --reload --port 8000`

## Endpoints

- `GET /health`
- `POST /agent`
- `POST /voice`
