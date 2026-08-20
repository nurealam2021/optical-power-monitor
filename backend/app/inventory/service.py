from sqlalchemy.orm import Session

from app.inventory.models import RouterInventory, RouterInventoryStatus
from app.inventory.schemas import RouterInventoryCreate, RouterInventoryUpdate


def list_router_inventory(db: Session) -> list[RouterInventory]:
    return (
        db.query(RouterInventory)
        .order_by(RouterInventory.id.desc())
        .all()
    )


def get_router_inventory_by_id(
    db: Session,
    router_id: int,
) -> RouterInventory | None:
    return (
        db.query(RouterInventory)
        .filter(RouterInventory.id == router_id)
        .first()
    )


def get_router_inventory_by_ip(
    db: Session,
    management_ip: str,
) -> RouterInventory | None:
    return (
        db.query(RouterInventory)
        .filter(RouterInventory.management_ip == management_ip)
        .filter(RouterInventory.status == RouterInventoryStatus.ACTIVE)
        .first()
    )


def create_router_inventory(
    db: Session,
    router_data: RouterInventoryCreate,
) -> RouterInventory:
    router = RouterInventory(
        device_id=router_data.device_id,
        router_name=router_data.router_name,
        management_ip=str(router_data.management_ip),
        vendor=router_data.vendor,
        model=router_data.model,
        os_name=router_data.os_name,
        version=router_data.version,
        site_name=router_data.site_name,
        router_role=router_data.router_role,
        backbone_capacity_mbps=router_data.backbone_capacity_mbps,
        status=router_data.status,
    )

    db.add(router)
    db.commit()
    db.refresh(router)

    return router


def update_router_inventory(
    db: Session,
    router: RouterInventory,
    router_data: RouterInventoryUpdate,
) -> RouterInventory:
    update_data = router_data.model_dump(exclude_unset=True)

    if "management_ip" in update_data and update_data["management_ip"]:
        update_data["management_ip"] = str(update_data["management_ip"])

    for field, value in update_data.items():
        setattr(router, field, value)

    db.commit()
    db.refresh(router)

    return router


def delete_router_inventory(
    db: Session,
    router: RouterInventory,
) -> None:
    db.delete(router)
    db.commit()