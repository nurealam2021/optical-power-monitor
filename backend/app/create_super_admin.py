import argparse
import getpass
import os

from app.database import SessionLocal
from app.users.models import UserRole
from app.users.schemas import UserCreate
from app.users.service import create_user, get_user_by_email


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create the initial super-admin account.")
    parser.add_argument("--name", default=os.getenv("SUPER_ADMIN_NAME"))
    parser.add_argument("--email", default=os.getenv("SUPER_ADMIN_EMAIL"))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    name = args.name or input("Super-admin name: ").strip()
    email = args.email or input("Super-admin email: ").strip()
    password = os.getenv("SUPER_ADMIN_PASSWORD") or getpass.getpass(
        "Super-admin password (minimum 8 characters): "
    )

    if not name or not email:
        raise SystemExit("Name and email are required.")
    if len(password) < 8:
        raise SystemExit("Password must be at least 8 characters.")

    db = SessionLocal()
    try:
        existing_user = get_user_by_email(db, email)
        if existing_user:
            raise SystemExit(f"A user already exists with email: {email}")

        user = create_user(
            db=db,
            user_data=UserCreate(
                name=name,
                email=email,
                password=password,
                role=UserRole.SUPER_ADMIN,
            ),
            created_by=None,
        )

        print(f"Super admin created successfully (id={user.id}, email={user.email}).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
