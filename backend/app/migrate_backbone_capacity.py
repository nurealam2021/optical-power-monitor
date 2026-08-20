"""Legacy compatibility helper.

New deployments must use `alembic upgrade head`. This script remains available
for older installations that predate Alembic and only need this column added.
"""
from sqlalchemy import inspect, text

from app.database import engine


COLUMN_NAME = "backbone_capacity_mbps"
COLUMN_TYPE = "INTEGER"


def add_missing_column() -> None:
    columns = {column["name"] for column in inspect(engine).get_columns("router_inventory")}
    if COLUMN_NAME in columns:
        print(f"Column already exists: {COLUMN_NAME}")
        return

    with engine.begin() as connection:
        connection.execute(
            text(f"ALTER TABLE router_inventory ADD COLUMN {COLUMN_NAME} {COLUMN_TYPE}")
        )
    print(f"Added column: {COLUMN_NAME}")


if __name__ == "__main__":
    print("Legacy helper: prefer `alembic upgrade head` for normal deployments.")
    add_missing_column()
