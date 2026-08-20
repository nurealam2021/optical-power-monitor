from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.optical.schemas import OpticalCheckRequest, OpticalCheckResponse
from app.optical.service import check_optical_power
from app.users.models import User


router = APIRouter(
    prefix="/optical",
    tags=["Optical Power"],
)


@router.post("/check", response_model=OpticalCheckResponse)
def check_router_optical_power(
    check_data: OpticalCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return check_optical_power(
        db=db,
        check_data=check_data,
        user_id=current_user.id,
    )