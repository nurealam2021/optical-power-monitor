from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_admin_or_super_admin
from app.database import get_db
from app.optical.models import OpticalCheckLog
from app.users.models import User


router = APIRouter(
    prefix="/optical-logs",
    tags=["Optical Logs"],
)


def serialize_log(log: OpticalCheckLog) -> dict:
    return {
        "id": log.id,
        "user_id": getattr(log, "user_id", None),
        "router_ip": getattr(log, "router_ip", None),
        "vendor": str(getattr(log, "vendor", "")).replace("RouterVendor.", "").lower(),
        "interface_name": getattr(log, "interface_name", None),
        "port_status": getattr(log, "port_status", None),
        "rx_power": getattr(log, "rx_power", None),
        "tx_power": getattr(log, "tx_power", None),
        "status": getattr(log, "status", None),
        "message": getattr(log, "message", None),
        "error_message": getattr(log, "error_message", None),
        "raw_output": getattr(log, "raw_output", None),
        "checked_at": getattr(log, "checked_at", None),
        "created_at": getattr(log, "created_at", None),
    }


@router.get("/my")
def get_my_optical_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logs = (
        db.query(OpticalCheckLog)
        .filter(OpticalCheckLog.user_id == current_user.id)
        .order_by(OpticalCheckLog.id.desc())
        .limit(300)
        .all()
    )

    return [serialize_log(log) for log in logs]


@router.get("")
def get_all_optical_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_super_admin),
):
    logs = (
        db.query(OpticalCheckLog)
        .order_by(OpticalCheckLog.id.desc())
        .limit(1000)
        .all()
    )

    return [serialize_log(log) for log in logs]


@router.get("/all")
def get_all_optical_logs_alt(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_super_admin),
):
    logs = (
        db.query(OpticalCheckLog)
        .order_by(OpticalCheckLog.id.desc())
        .limit(1000)
        .all()
    )

    return [serialize_log(log) for log in logs]