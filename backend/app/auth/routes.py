from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.schemas import LoginRequest, LoginResponse
from app.auth.service import authenticate_user, create_login_token
from app.database import get_db


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post("/login", response_model=LoginResponse)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    user = authenticate_user(
        db=db,
        email=login_data.email,
        password=login_data.password,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_login_token(user)

    return LoginResponse(
        access_token=access_token,
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
    )