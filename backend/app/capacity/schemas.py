from datetime import datetime

from pydantic import BaseModel, IPvAnyAddress

from app.routers.models import RouterVendor


class CapacityCheckRequest(BaseModel):
    router_ip: IPvAnyAddress


class PortInfo(BaseModel):
    interface_name: str
    speed: str
    status: str
    description: str | None = None
    is_free: bool


class SpeedBreakdown(BaseModel):
    speed: str
    total: int
    free: int
    used: int


class CapacityCheckResponse(BaseModel):
    router_ip: str
    vendor: RouterVendor | None = None
    total_ports: int
    free_ports: int
    used_ports: int
    total_capacity_gbps: float
    used_capacity_gbps: float
    free_capacity_gbps: float
    breakdown_by_speed: list[SpeedBreakdown]
    ports: list[PortInfo]
    checked_at: datetime
    message: str | None = None
    raw_output: str | None = None
