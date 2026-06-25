import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()


def resolve_database_url() -> str:
    configured_url = os.getenv("DATABASE_URL", "").strip()
    if configured_url:
        return configured_url

    data_dir = Path(__file__).resolve().parents[1] / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{data_dir / 'expense_tracker.db'}"


DATABASE_URL = resolve_database_url()

engine = create_engine(
    DATABASE_URL,
    future=True,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def database_ready() -> bool:
    return engine is not None and SessionLocal is not None
