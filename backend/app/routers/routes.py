from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_admin_or_super_admin
from app.database import get_db
from app.routers.schemas import (
    RouterCredentialCreate,
    RouterCredentialResponse,
    RouterCredentialUpdate,
)
from app.routers.service import (
    create_router_credential,
    delete_router_credential,
    get_router_credential_by_id,
    list_router_credentials,
    update_router_credential,
)


router = APIRouter(
    prefix="/router-credentials",
    tags=["Router Credentials"],
)


@router.get("", response_model=list[RouterCredentialResponse])
def get_router_credentials(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super_admin),
):
    return list_router_credentials(db)


@router.post("", response_model=RouterCredentialResponse)
def add_router_credential(
    credential_data: RouterCredentialCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super_admin),
):
    return create_router_credential(
        db=db,
        credential_data=credential_data,
    )


@router.put("/{credential_id}", response_model=RouterCredentialResponse)
def edit_router_credential(
    credential_id: int,
    credential_data: RouterCredentialUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super_admin),
):
    credential = get_router_credential_by_id(
        db=db,
        credential_id=credential_id,
    )

    if not credential:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Router credential not found",
        )

    return update_router_credential(
        db=db,
        credential=credential,
        credential_data=credential_data,
    )


@router.delete("/{credential_id}")
def remove_router_credential(
    credential_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super_admin),
):
    credential = get_router_credential_by_id(
        db=db,
        credential_id=credential_id,
    )

    if not credential:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Router credential not found",
        )

    delete_router_credential(
        db=db,
        credential=credential,
    )

    return {
        "message": "Router credential deleted successfully"
    }