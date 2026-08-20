from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.capacity.commands import build_capacity_command
from app.capacity.parsers import (
    ParsedPort,
    is_physical_interface,
    parse_cisco_capacity,
    parse_huawei_capacity,
    parse_zte_capacity,
)
from app.capacity.schemas import (
    CapacityCheckRequest,
    CapacityCheckResponse,
    PortInfo,
    SpeedBreakdown,
)
from app.capacity.speed import infer_port_speed, speed_to_gbps
from app.inventory.service import get_router_inventory_by_ip
from app.routers.models import RouterVendor
from app.routers.service import get_active_router_credential_by_vendor
from app.routers.ssh_client import run_show_command


_PARSERS = {
    RouterVendor.HUAWEI: parse_huawei_capacity,
    RouterVendor.ZTE: parse_zte_capacity,
    RouterVendor.CISCO: parse_cisco_capacity,
}


def _empty_response(
    router_ip: str,
    vendor: RouterVendor | None,
    message: str,
    raw_output: str | None = None,
) -> CapacityCheckResponse:
    return CapacityCheckResponse(
        router_ip=router_ip,
        vendor=vendor,
        total_ports=0,
        free_ports=0,
        used_ports=0,
        total_capacity_gbps=0.0,
        used_capacity_gbps=0.0,
        free_capacity_gbps=0.0,
        breakdown_by_speed=[],
        ports=[],
        checked_at=datetime.now(timezone.utc),
        message=message,
        raw_output=raw_output,
    )


def _build_port_info(parsed: ParsedPort) -> PortInfo:
    speed = infer_port_speed(parsed.interface_name)

    # A port is considered "free" only if it is currently down AND
    # has no description assigned. A down port WITH a description is
    # treated as reserved/assigned, not free. This is a heuristic --
    # not a guarantee -- since not every network follows a strict
    # tagging convention.
    is_free = (not parsed.is_up) and (not parsed.description)

    return PortInfo(
        interface_name=parsed.interface_name,
        speed=speed,
        status="up" if parsed.is_up else "down",
        description=parsed.description or None,
        is_free=is_free,
    )


def check_router_capacity(
    db: Session,
    check_data: CapacityCheckRequest,
) -> CapacityCheckResponse:
    router_ip = str(check_data.router_ip)

    inventory = get_router_inventory_by_ip(db=db, management_ip=router_ip)

    if inventory is None:
        return _empty_response(
            router_ip=router_ip,
            vendor=None,
            message=(
                "Router not found in active inventory. "
                "Add it under Router Inventory first."
            ),
        )

    credential = get_active_router_credential_by_vendor(
        db=db,
        vendor=inventory.vendor,
    )

    if credential is None:
        return _empty_response(
            router_ip=router_ip,
            vendor=inventory.vendor,
            message=(
                f"No active saved credentials for vendor "
                f"'{inventory.vendor.value}'. Add one under Router Credentials."
            ),
        )

    try:
        command = build_capacity_command(inventory.vendor)
    except ValueError as error:
        return _empty_response(
            router_ip=router_ip,
            vendor=inventory.vendor,
            message=str(error),
        )

    try:
        raw_output = run_show_command(
            router_ip=router_ip,
            vendor=inventory.vendor,
            interface="",
            command=command,
            credential=credential,
        )
    except Exception as error:
        return _empty_response(
            router_ip=router_ip,
            vendor=inventory.vendor,
            message=f"Failed to connect or run command on router: {error}",
        )

    parser = _PARSERS.get(inventory.vendor)
    parsed_ports = parser(raw_output) if parser else []

    # Drop logical/virtual interfaces (LAG bundles, VLAN sub-interfaces,
    # loopbacks, NULL, tunnels) -- these aren't separate physical ports
    # and would double-count against the physical member ports they
    # ride on.
    parsed_ports = [
        parsed
        for parsed in parsed_ports
        if is_physical_interface(parsed.interface_name)
    ]

    if not parsed_ports:
        return _empty_response(
            router_ip=router_ip,
            vendor=inventory.vendor,
            message=(
                "Connected successfully, but no physical interfaces "
                "could be parsed from the router output. The command "
                "output format may differ from what this app expects "
                "for this platform."
            ),
            raw_output=raw_output,
        )

    ports = [_build_port_info(parsed) for parsed in parsed_ports]

    speed_counts: dict[str, dict[str, int]] = {}

    for port in ports:
        bucket = speed_counts.setdefault(
            port.speed,
            {"total": 0, "free": 0, "used": 0},
        )
        bucket["total"] += 1

        if port.is_free:
            bucket["free"] += 1
        else:
            bucket["used"] += 1

    breakdown = [
        SpeedBreakdown(
            speed=speed,
            total=counts["total"],
            free=counts["free"],
            used=counts["used"],
        )
        for speed, counts in sorted(speed_counts.items())
    ]

    total_ports = len(ports)
    free_ports = sum(1 for port in ports if port.is_free)
    used_ports = total_ports - free_ports

    total_capacity_gbps = round(
        sum(speed_to_gbps(port.speed) for port in ports), 2
    )
    free_capacity_gbps = round(
        sum(speed_to_gbps(port.speed) for port in ports if port.is_free), 2
    )
    used_capacity_gbps = round(total_capacity_gbps - free_capacity_gbps, 2)

    return CapacityCheckResponse(
        router_ip=router_ip,
        vendor=inventory.vendor,
        total_ports=total_ports,
        free_ports=free_ports,
        used_ports=used_ports,
        total_capacity_gbps=total_capacity_gbps,
        used_capacity_gbps=used_capacity_gbps,
        free_capacity_gbps=free_capacity_gbps,
        breakdown_by_speed=breakdown,
        ports=ports,
        checked_at=datetime.now(timezone.utc),
        message=None,
        raw_output=raw_output,
    )
