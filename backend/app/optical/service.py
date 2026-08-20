from datetime import datetime

from sqlalchemy.orm import Session

from app.inventory.service import get_router_inventory_by_ip
from app.optical.commands import get_optical_command
from app.optical.logging_service import create_optical_check_log
from app.optical.parsers import parse_optical_power
from app.optical.schemas import OpticalCheckRequest, OpticalCheckResponse
from app.optical.status import get_optical_status
from app.optical.validation import is_valid_interface_name
from app.routers.models import RouterVendor
from app.routers.service import get_active_router_credential_by_vendor
from app.routers.ssh_client import run_show_command


def _build_response(
    check_data: OpticalCheckRequest,
    interface: str,
    vendor: RouterVendor,
    rx_power: str | None,
    tx_power: str | None,
    status: str,
    message: str | None,
    port_status: str | None = None,
) -> OpticalCheckResponse:
    return OpticalCheckResponse(
        router_ip=str(check_data.router_ip),
        vendor=vendor,
        interface=interface,
        port_status=port_status,
        rx_power=rx_power,
        tx_power=tx_power,
        status=status,
        checked_at=datetime.utcnow(),
        message=message,
    )


def _resolve_vendor(
    db: Session,
    check_data: OpticalCheckRequest,
) -> RouterVendor | None:
    if check_data.vendor:
        return check_data.vendor

    router_inventory = get_router_inventory_by_ip(
        db=db,
        management_ip=str(check_data.router_ip),
    )

    if not router_inventory:
        return None

    return router_inventory.vendor


def check_optical_power(
    db: Session,
    check_data: OpticalCheckRequest,
    user_id: int,
) -> OpticalCheckResponse:
    interface = check_data.interface.strip()

    resolved_vendor = _resolve_vendor(
        db=db,
        check_data=check_data,
    )

    if not resolved_vendor:
        fallback_vendor = RouterVendor.CISCO

        result = _build_response(
            check_data=check_data,
            interface=interface,
            vendor=fallback_vendor,
            rx_power=None,
            tx_power=None,
            status="failed",
            message="Router IP was not found in inventory and vendor was not provided",
            port_status=None,
        )

        create_optical_check_log(
            db=db,
            user_id=user_id,
            router_ip=str(check_data.router_ip),
            vendor=fallback_vendor,
            interface_name=interface,
            result=result,
            error_message=result.message,
        )

        return result

    if not is_valid_interface_name(interface):
        result = _build_response(
            check_data=check_data,
            interface=interface,
            vendor=resolved_vendor,
            rx_power=None,
            tx_power=None,
            status="failed",
            message="Invalid interface name",
            port_status=None,
        )

        create_optical_check_log(
            db=db,
            user_id=user_id,
            router_ip=str(check_data.router_ip),
            vendor=resolved_vendor,
            interface_name=interface,
            result=result,
            error_message=result.message,
        )

        return result

    credential = get_active_router_credential_by_vendor(
        db=db,
        vendor=resolved_vendor,
    )

    if not credential:
        result = _build_response(
            check_data=check_data,
            interface=interface,
            vendor=resolved_vendor,
            rx_power=None,
            tx_power=None,
            status="failed",
            message="No active router credential found for this vendor",
            port_status=None,
        )

        create_optical_check_log(
            db=db,
            user_id=user_id,
            router_ip=str(check_data.router_ip),
            vendor=resolved_vendor,
            interface_name=interface,
            result=result,
            error_message=result.message,
        )

        return result

    command = get_optical_command(
        vendor=resolved_vendor,
        interface=interface,
    )

    raw_output: str | None = None

    try:
        raw_output = run_show_command(
            router_ip=str(check_data.router_ip),
            vendor=resolved_vendor,
            interface=interface,
            command=command,
            credential=credential,
        )

        rx_power, tx_power = parse_optical_power(
            vendor=resolved_vendor,
            output=raw_output,
        )

        status = get_optical_status(rx_power)

        if rx_power is None and tx_power is None:
            result = _build_response(
                check_data=check_data,
                interface=interface,
                vendor=resolved_vendor,
                rx_power=None,
                tx_power=None,
                status="unknown",
                message="Command ran but optical power values were not found",
                port_status=None,
            )

            create_optical_check_log(
                db=db,
                user_id=user_id,
                router_ip=str(check_data.router_ip),
                vendor=resolved_vendor,
                interface_name=interface,
                result=result,
                raw_output=raw_output,
            )

            return result

        result = _build_response(
            check_data=check_data,
            interface=interface,
            vendor=resolved_vendor,
            rx_power=rx_power,
            tx_power=tx_power,
            status=status,
            message="Optical power read successfully",
            port_status="UP",
        )

        create_optical_check_log(
            db=db,
            user_id=user_id,
            router_ip=str(check_data.router_ip),
            vendor=resolved_vendor,
            interface_name=interface,
            result=result,
            raw_output=raw_output,
        )

        return result

    except Exception as error:
        result = _build_response(
            check_data=check_data,
            interface=interface,
            vendor=resolved_vendor,
            rx_power=None,
            tx_power=None,
            status="failed",
            message=str(error),
            port_status=None,
        )

        create_optical_check_log(
            db=db,
            user_id=user_id,
            router_ip=str(check_data.router_ip),
            vendor=resolved_vendor,
            interface_name=interface,
            result=result,
            raw_output=raw_output,
            error_message=str(error),
        )

        return result