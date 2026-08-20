from passlib.context import CryptContext
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_super_admin
from app.database import get_db
from app.users.models import User
from app.users.schemas import (
    UserCreate,
    UserPasswordUpdate,
    UserResponse,
    UserUpdate,
)
from app.users.service import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    list_users,
)


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)

password_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def _hash_password(plain_password: str) -> str:
    return password_context.hash(plain_password)


def _set_user_password(user: User, plain_password: str) -> None:
    hashed_password = _hash_password(plain_password)

    if hasattr(user, "hashed_password"):
        user.hashed_password = hashed_password
        return

    if hasattr(user, "password_hash"):
        user.password_hash = hashed_password
        return

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="User password field not found",
    )


@router.get("", response_model=list[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    return list_users(db)


@router.post("", response_model=UserResponse)
def add_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    existing_user = get_user_by_email(
        db=db,
        email=user_data.email,
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists",
        )

    return create_user(
        db=db,
        user_data=user_data,
    )


@router.put("/{user_id}", response_model=UserResponse)
def edit_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    user = get_user_by_id(
        db=db,
        user_id=user_id,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    update_data = user_data.model_dump(exclude_unset=True)

    if "email" in update_data and update_data["email"]:
        existing_user = get_user_by_email(
            db=db,
            email=update_data["email"],
        )

        if existing_user and existing_user.id != user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user


@router.delete("/{user_id}")
def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    user = get_user_by_id(
        db=db,
        user_id=user_id,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account",
        )

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }


@router.put("/{user_id}/password")
def reset_user_password(
    user_id: int,
    password_data: UserPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    user = get_user_by_id(
        db=db,
        user_id=user_id,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    new_password = None

    if hasattr(password_data, "new_password"):
        new_password = password_data.new_password

    if not new_password and hasattr(password_data, "password"):
        new_password = password_data.password

    if not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required",
        )

    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters",
        )

    _set_user_password(
        user=user,
        plain_password=new_password,
    )

    db.commit()

    return {
        "message": "Password updated successfully"
    }