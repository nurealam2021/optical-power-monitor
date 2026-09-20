from datetime import datetime

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.inventory.models import RouterInventory
from app.inventory.service import get_router_inventory_by_id
from app.routers.service import get_active_router_credential_by_vendor
from app.routers.ssh_client import run_show_command
from app.topology.discovery import DiscoveredNeighbor, lldp_commands, parse_lldp_neighbors
from app.topology.models import TopologyLink
from app.topology.schemas import (
    TopologyDiscoverResponse,
    TopologyEdge,
    TopologyNode,
    TopologyResponse,
)


def _managed_node(router: RouterInventory) -> TopologyNode:
    return TopologyNode(
        key=f"router:{router.id}",
        router_id=router.id,
        name=router.router_name or router.management_ip,
        management_ip=router.management_ip,
        vendor=getattr(router.vendor, "value", str(router.vendor)),
        model=router.model,
        site_name=router.site_name,
        router_role=router.router_role,
        status=getattr(router.status, "value", str(router.status)),
        managed=True,
    )


def _neighbor_key(neighbor: DiscoveredNeighbor, source_router_id: int) -> str:
    if neighbor.remote_management_ip:
        return f"ip:{neighbor.remote_management_ip}"

    name = (neighbor.remote_name or "unknown").strip().lower()
    return f"neighbor:{source_router_id}:{name}"


def _resolve_inventory_neighbor(
    db: Session,
    neighbor: DiscoveredNeighbor,
) -> RouterInventory | None:
    if not neighbor.remote_management_ip:
        return None

    return (
        db.query(RouterInventory)
        .filter(RouterInventory.management_ip == neighbor.remote_management_ip)
        .first()
    )


def _upsert_link(
    db: Session,
    source_router: RouterInventory,
    neighbor: DiscoveredNeighbor,
) -> TopologyLink:
    query = (
        db.query(TopologyLink)
        .filter(TopologyLink.source_router_id == source_router.id)
        .filter(TopologyLink.local_interface == neighbor.local_interface)
    )

    link = query.first()

    if link is None:
        link = TopologyLink(
            source_router_id=source_router.id,
            local_interface=neighbor.local_interface,
        )
        db.add(link)

    link.remote_router_name = neighbor.remote_name
    link.remote_management_ip = neighbor.remote_management_ip
    link.remote_interface = neighbor.remote_interface
    link.remote_vendor = neighbor.remote_vendor
    link.discovery_method = "lldp"
    link.status = "up"
    link.last_seen_at = datetime.utcnow()

    return link


def discover_topology(
    db: Session,
    seed_router_id: int | None,
    depth: int,
) -> TopologyDiscoverResponse:
    if seed_router_id is not None:
        seed = get_router_inventory_by_id(db, seed_router_id)
        if not seed:
            raise ValueError("Seed router was not found")
        queue: list[tuple[RouterInventory, int]] = [(seed, 0)]
    else:
        queue = [
            (router, 0)
            for router in db.query(RouterInventory)
            .filter(RouterInventory.status == "active")
            .order_by(RouterInventory.id.asc())
            .all()
        ]

    visited: set[int] = set()
    errors: list[str] = []
    routers_scanned = 0
    links_found = 0
    unmanaged_neighbors = 0

    while queue:
        router, current_depth = queue.pop(0)

        if router.id in visited or current_depth >= depth:
            continue

        visited.add(router.id)
        routers_scanned += 1

        vendor = getattr(router.vendor, "value", str(router.vendor))
        credential = get_active_router_credential_by_vendor(
            db=db,
            vendor=router.vendor,
        )

        if not credential:
            errors.append(
                f"{router.management_ip}: no active {vendor} credential"
            )
            continue

        output = None

        for command in lldp_commands(vendor):
            try:
                output = run_show_command(
                    router_ip=router.management_ip,
                    vendor=router.vendor,
                    interface="",
                    command=command,
                    credential=credential,
                )
                if output and "invalid" not in output.lower() and "unknown command" not in output.lower():
                    break
            except Exception as exc:
                output = None
                last_error = str(exc)

        if not output:
            errors.append(
                f"{router.management_ip}: LLDP discovery failed"
                + (f" ({last_error})" if "last_error" in locals() else "")
            )
            continue

        neighbors = parse_lldp_neighbors(output)
        links_found += len(neighbors)

        for neighbor in neighbors:
            link = _upsert_link(db, router, neighbor)

            target = _resolve_inventory_neighbor(db, neighbor)

            if target is None:
                unmanaged_neighbors += 1
            elif target.id not in visited and current_depth + 1 < depth:
                queue.append((target, current_depth + 1))

    db.commit()

    return TopologyDiscoverResponse(
        message="Network topology discovery completed",
        routers_scanned=routers_scanned,
        links_found=links_found,
        unmanaged_neighbors=unmanaged_neighbors,
        errors=errors,
    )


def get_topology(db: Session) -> TopologyResponse:
    routers = (
        db.query(RouterInventory)
        .filter(RouterInventory.status == "active")
        .order_by(RouterInventory.id.asc())
        .all()
    )

    links = (
        db.query(TopologyLink)
        .join(RouterInventory, RouterInventory.id == TopologyLink.source_router_id)
        .filter(RouterInventory.status == "active")
        .order_by(TopologyLink.id.asc())
        .all()
    )

    nodes: dict[str, TopologyNode] = {
        f"router:{router.id}": _managed_node(router)
        for router in routers
    }

    edges: list[TopologyEdge] = []

    for link in links:
        target = None

        if link.remote_management_ip:
            target = (
                db.query(RouterInventory)
                .filter(
                    RouterInventory.management_ip == link.remote_management_ip
                )
                .first()
            )

        if target:
            target_key = f"router:{target.id}"
            nodes[target_key] = _managed_node(target)
        else:
            target_key = (
                f"ip:{link.remote_management_ip}"
                if link.remote_management_ip
                else f"neighbor:{link.source_router_id}:{(link.remote_router_name or 'unknown').strip().lower()}"
            )

            nodes.setdefault(
                target_key,
                TopologyNode(
                    key=target_key,
                    router_id=None,
                    name=link.remote_router_name
                    or link.remote_management_ip
                    or "Unmanaged Neighbor",
                    management_ip=link.remote_management_ip,
                    vendor=link.remote_vendor,
                    model=None,
                    site_name=None,
                    router_role=None,
                    status="discovered",
                    managed=False,
                ),
            )

        edges.append(
            TopologyEdge(
                id=link.id,
                source=f"router:{link.source_router_id}",
                target=target_key,
                source_router_id=link.source_router_id,
                local_interface=link.local_interface,
                remote_interface=link.remote_interface,
                remote_management_ip=link.remote_management_ip,
                remote_router_name=link.remote_router_name,
                remote_vendor=link.remote_vendor,
                discovery_method=link.discovery_method,
                status=link.status,
                last_seen_at=link.last_seen_at,
            )
        )

    return TopologyResponse(
        nodes=list(nodes.values()),
        edges=edges,
    )
