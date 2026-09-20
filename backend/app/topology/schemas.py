from datetime import datetime

from pydantic import BaseModel, Field


class TopologyNode(BaseModel):
    key: str
    router_id: int | None = None
    name: str
    management_ip: str | None = None
    vendor: str | None = None
    model: str | None = None
    site_name: str | None = None
    router_role: str | None = None
    status: str
    managed: bool


class TopologyEdge(BaseModel):
    id: int
    source: str
    target: str
    source_router_id: int
    local_interface: str
    remote_interface: str | None = None
    remote_management_ip: str | None = None
    remote_router_name: str | None = None
    remote_vendor: str | None = None
    discovery_method: str
    status: str
    last_seen_at: datetime


class TopologyResponse(BaseModel):
    nodes: list[TopologyNode]
    edges: list[TopologyEdge]


class TopologyDiscoverRequest(BaseModel):
    router_id: int | None = None
    depth: int = Field(default=1, ge=1, le=3)


class TopologyDiscoverResponse(BaseModel):
    message: str
    routers_scanned: int
    links_found: int
    unmanaged_neighbors: int
    errors: list[str]
