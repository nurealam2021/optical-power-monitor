from sqlalchemy.orm import Session

from app.auth.jwt import create_access_token
from app.auth.security import verify_password
from app.users.models import User, UserStatus
from app.users.service import get_user_by_email


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:
    user = get_user_by_email(db, email)

    if not user:
        return None

    if user.status != UserStatus.ACTIVE:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


def create_login_token(user: User) -> str:
    return create_access_token(
        subject=str(user.id),
        extra_data={
            "email": user.email,
            "role": user.role.value,
        },
    )