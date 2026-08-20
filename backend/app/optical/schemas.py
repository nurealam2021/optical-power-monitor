from datetime import datetime

from pydantic import BaseModel, Field, IPvAnyAddress

from app.routers.models import RouterVendor


class OpticalCheckRequest(BaseModel):
    router_ip: IPvAnyAddress
    interface: str = Field(..., min_length=1, max_length=100)

    # Optional now.
    # If vendor is not provided, backend will find vendor from Router Inventory by router_ip.
    vendor: RouterVendor | None = None


class OpticalCheckResponse(BaseModel):
    router_ip: str
    vendor: RouterVendor
    interface: str
    port_status: str | None = None
    rx_power: str | None
    tx_power: str | None
    status: str
    checked_at: datetime
    message: str | None = None