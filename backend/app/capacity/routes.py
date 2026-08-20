from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.capacity.schemas import CapacityCheckRequest, CapacityCheckResponse
from app.capacity.service import check_router_capacity
from app.database import get_db
from app.users.models import User


router = APIRouter(
    prefix="/capacity",
    tags=["Router Capacity"],
)


@router.post("/check", response_model=CapacityCheckResponse)
def check_capacity(
    check_data: CapacityCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return check_router_capacity(
        db=db,
        check_data=check_data,
    )
