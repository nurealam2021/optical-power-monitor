from datetime import datetime

from pydantic import BaseModel, Field, IPvAnyAddress

from app.inventory.models import RouterInventoryStatus
from app.routers.models import RouterVendor


class RouterInventoryBase(BaseModel):
    device_id: str | None = Field(default=None, max_length=50)
    router_name: str | None = Field(default=None, max_length=150)
    management_ip: IPvAnyAddress
    vendor: RouterVendor
    model: str | None = Field(default=None, max_length=150)
    os_name: str | None = Field(default=None, max_length=100)
    version: str | None = Field(default=None, max_length=150)
    site_name: str | None = Field(default=None, max_length=150)
    router_role: str | None = Field(default=None, max_length=100)
    backbone_capacity_mbps: int | None = Field(default=None, ge=0)
    status: RouterInventoryStatus = RouterInventoryStatus.ACTIVE


class RouterInventoryCreate(RouterInventoryBase):
    pass


class RouterInventoryUpdate(BaseModel):
    device_id: str | None = Field(default=None, max_length=50)
    router_name: str | None = Field(default=None, max_length=150)
    management_ip: IPvAnyAddress | None = None
    vendor: RouterVendor | None = None
    model: str | None = Field(default=None, max_length=150)
    os_name: str | None = Field(default=None, max_length=100)
    version: str | None = Field(default=None, max_length=150)
    site_name: str | None = Field(default=None, max_length=150)
    router_role: str | None = Field(default=None, max_length=100)
    backbone_capacity_mbps: int | None = Field(default=None, ge=0)
    status: RouterInventoryStatus | None = None
    detected_vendor: str | None = Field(default=None, max_length=50)
    last_verified_at: datetime | None = None


class RouterInventoryResponse(BaseModel):
    id: int
    device_id: str | None
    router_name: str | None
    management_ip: str
    vendor: RouterVendor
    model: str | None
    os_name: str | None
    version: str | None
    site_name: str | None
    router_role: str | None
    backbone_capacity_mbps: int | None
    status: RouterInventoryStatus
    detected_vendor: str | None
    last_verified_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }