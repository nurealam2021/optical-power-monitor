from sqlalchemy.orm import Session

from app.optical.models import OpticalCheckLog
from app.optical.schemas import OpticalCheckResponse
from app.routers.models import RouterVendor


def create_optical_check_log(
    db: Session,
    user_id: int,
    router_ip: str,
    vendor: RouterVendor,
    interface_name: str,
    result: OpticalCheckResponse,
    raw_output: str | None = None,
    error_message: str | None = None,
) -> OpticalCheckLog:
    log = OpticalCheckLog(
        user_id=user_id,
        router_ip=router_ip,
        vendor=vendor.value,
        interface_name=interface_name,
        rx_power=result.rx_power,
        tx_power=result.tx_power,
        status=result.status,
        raw_output=raw_output,
        error_message=error_message,
        checked_at=result.checked_at,
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    return log


def list_optical_check_logs(
    db: Session,
    limit: int = 100,
) -> list[OpticalCheckLog]:
    return (
        db.query(OpticalCheckLog)
        .order_by(OpticalCheckLog.id.desc())
        .limit(limit)
        .all()
    )


def list_user_optical_check_logs(
    db: Session,
    user_id: int,
    limit: int = 100,
) -> list[OpticalCheckLog]:
    return (
        db.query(OpticalCheckLog)
        .filter(OpticalCheckLog.user_id == user_id)
        .order_by(OpticalCheckLog.id.desc())
        .limit(limit)
        .all()
    )