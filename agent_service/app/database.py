"""Database connection, session management, and table initialization."""

from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from urllib.parse import quote_plus, unquote
from .config import get_settings

settings = get_settings()


def get_formatted_database_url(raw_url: str) -> str:
    """Safely formats and URL-encodes user credentials for PostgreSQL + psycopg."""
    if not raw_url or raw_url.startswith("sqlite"):
        return raw_url

    prefix = ""
    if raw_url.startswith("postgresql+psycopg://"):
        prefix = "postgresql+psycopg://"
    elif raw_url.startswith("postgresql://"):
        prefix = "postgresql://"

    if prefix:
        remainder = raw_url[len(prefix):]
        last_at = remainder.rfind("@")
        if last_at != -1:
            userinfo = remainder[:last_at]
            hostinfo = remainder[last_at + 1:]
            colon = userinfo.find(":")
            if colon != -1:
                user = userinfo[:colon]
                pwd = userinfo[colon + 1:]
                clean_user = quote_plus(unquote(user))
                clean_pwd = quote_plus(unquote(pwd))
                return f"postgresql+psycopg://{clean_user}:{clean_pwd}@{hostinfo}"
        if prefix == "postgresql://":
            return raw_url.replace("postgresql://", "postgresql+psycopg://", 1)

    return raw_url


formatted_db_url = get_formatted_database_url(settings.DATABASE_URL)

# Configure engine connection parameters
connect_args = {}
if formatted_db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    formatted_db_url,
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
    from .models import complaint_monitoring, agent_event  # noqa: F401
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
