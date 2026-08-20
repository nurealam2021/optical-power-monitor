from sqlalchemy.orm import Session

from app.auth.security import hash_password
from app.users.models import User, UserStatus
from app.users.schemas import UserCreate, UserUpdate


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return (
        db.query(User)
        .filter(User.id == user_id)
        .filter(User.status != UserStatus.DELETED)
        .first()
    )


def get_user_by_email(db: Session, email: str) -> User | None:
    return (
        db.query(User)
        .filter(User.email == email.lower())
        .filter(User.status != UserStatus.DELETED)
        .first()
    )


def list_users(db: Session) -> list[User]:
    return (
        db.query(User)
        .filter(User.status != UserStatus.DELETED)
        .order_by(User.id.desc())
        .all()
    )


def create_user(
    db: Session,
    user_data: UserCreate,
    created_by: int | None = None,
) -> User:
    user = User(
        name=user_data.name,
        email=user_data.email.lower(),
        phone=user_data.phone,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        created_by=created_by,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def update_user(
    db: Session,
    user: User,
    user_data: UserUpdate,
) -> User:
    update_data = user_data.model_dump(exclude_unset=True)

    if "email" in update_data and update_data["email"]:
        update_data["email"] = update_data["email"].lower()

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user


def update_user_password(
    db: Session,
    user: User,
    new_password: str,
) -> User:
    user.password_hash = hash_password(new_password)

    db.commit()
    db.refresh(user)

    return user


def soft_delete_user(db: Session, user: User) -> User:
    user.status = UserStatus.DELETED

    db.commit()
    db.refresh(user)

    return user