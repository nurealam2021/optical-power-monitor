from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


engine_options: dict = {
    "pool_pre_ping": True,
}

if settings.database_url.startswith("sqlite:"):
    # FastAPI sync endpoints can execute in worker threads. SQLite otherwise
    # rejects a connection when it is used outside the creating thread.
    engine_options["connect_args"] = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    **engine_options,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
