"""Database connection, session management, and table initialization."""

from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from .config import get_settings

settings = get_settings()

# Configure engine connection parameters
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initializes and creates all registered SQLAlchemy tables in the database."""
    # Ensure models are imported so they are registered with Base.metadata
    from .models import complaint_monitoring  # noqa: F401
    Base.metadata.create_all(bind=engine)


def check_db_connection() -> bool:
    """Verifies that the database engine can execute a test query."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


if __name__ == "__main__":
    print(f"Creating tables using DATABASE_URL: {settings.DATABASE_URL}")
    init_db()
    print("Database tables initialized successfully.")
