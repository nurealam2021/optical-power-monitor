from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.users.models import User
from app.users.schemas import UserResponse


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user