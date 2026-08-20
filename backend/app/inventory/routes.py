from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_admin_or_super_admin
from app.database import get_db
from app.inventory.schemas import (
    RouterInventoryCreate,
    RouterInventoryResponse,
    RouterInventoryUpdate,
)
from app.inventory.service import (
    create_router_inventory,
    delete_router_inventory,
    get_router_inventory_by_id,
    get_router_inventory_by_ip,
    list_router_inventory,
    update_router_inventory,
)


router = APIRouter(
    prefix="/router-inventory",
    tags=["Router Inventory"],
)


@router.get("", response_model=list[RouterInventoryResponse])
def get_router_inventory_list(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super_admin),
):
    return list_router_inventory(db)


@router.post("", response_model=RouterInventoryResponse)
def add_router_inventory(
    router_data: RouterInventoryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super_admin),
):
    existing_router = get_router_inventory_by_ip(
        db=db,
        management_ip=str(router_data.management_ip),
    )

    if existing_router:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Management IP already exists in inventory",
        )

    return create_router_inventory(
        db=db,
        router_data=router_data,
    )


@router.put("/{router_id}", response_model=RouterInventoryResponse)
def edit_router_inventory(
    router_id: int,
    router_data: RouterInventoryUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super_admin),
):
    router = get_router_inventory_by_id(
        db=db,
        router_id=router_id,
    )

    if not router:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Router inventory not found",
        )

    if router_data.management_ip:
        existing_router = get_router_inventory_by_ip(
            db=db,
            management_ip=str(router_data.management_ip),
        )

        if existing_router and existing_router.id != router.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Management IP already exists in inventory",
            )

    return update_router_inventory(
        db=db,
        router=router,
        router_data=router_data,
    )


@router.delete("/{router_id}")
def remove_router_inventory(
    router_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super_admin),
):
    router = get_router_inventory_by_id(
        db=db,
        router_id=router_id,
    )

    if not router:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Router inventory not found",
        )

    delete_router_inventory(
        db=db,
        router=router,
    )

    return {
        "message": "Router inventory deleted successfully"
    }