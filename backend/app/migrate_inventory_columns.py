"""Legacy compatibility helper.

New deployments must use `alembic upgrade head`. This script remains available
for older installations that predate Alembic and only need these columns added.
"""
from sqlalchemy import inspect, text

from app.database import engine


COLUMNS_TO_ADD = [
    ("device_id", "VARCHAR(50)"),
    ("os_name", "VARCHAR(100)"),
    ("version", "VARCHAR(150)"),
]


def get_existing_columns() -> set[str]:
    return {column["name"] for column in inspect(engine).get_columns("router_inventory")}


def add_missing_columns() -> None:
    existing_columns = get_existing_columns()
    with engine.begin() as connection:
        for column_name, column_type in COLUMNS_TO_ADD:
            if column_name in existing_columns:
                print(f"Column already exists: {column_name}")
                continue
            connection.execute(
                text(f"ALTER TABLE router_inventory ADD COLUMN {column_name} {column_type}")
            )
            print(f"Added column: {column_name}")


if __name__ == "__main__":
    print("Legacy helper: prefer `alembic upgrade head` for normal deployments.")
    add_missing_columns()
