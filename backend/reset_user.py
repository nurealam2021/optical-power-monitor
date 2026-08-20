import argparse
import getpass
import os

from app.database import SessionLocal
from app.users.service import get_user_by_email, update_user_password


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Reset an existing user's password.")
    parser.add_argument("email", nargs="?", default=os.getenv("RESET_USER_EMAIL"))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    email = args.email or input("User email: ").strip()
    password = os.getenv("RESET_USER_PASSWORD") or getpass.getpass(
        "New password (minimum 8 characters): "
    )

    if len(password) < 8:
        raise SystemExit("Password must be at least 8 characters.")

    db = SessionLocal()
    try:
        user = get_user_by_email(db, email)
        if not user:
            raise SystemExit(f"User not found: {email}")

        update_user_password(db, user, password)
        print(f"Password updated successfully for {user.email}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
