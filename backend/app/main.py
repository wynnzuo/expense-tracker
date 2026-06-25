from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import database_ready, engine
from app.db_models import Base
from app.routes.agent import router as agent_router
from app.routes.conversation import router as conversation_router
from app.routes.transactions import router as transactions_router
from app.routes.voice import router as voice_router

load_dotenv()

if database_ready():
    Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Expense Tracker",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(agent_router)
app.include_router(conversation_router)
app.include_router(transactions_router)
app.include_router(voice_router)
