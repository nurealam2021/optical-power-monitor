from datetime import datetime

from pydantic import BaseModel, Field

from app.routers.models import (
    RouterConnectionType,
    RouterCredentialStatus,
    RouterVendor,
)


class RouterCredentialBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    vendor: RouterVendor
    username: str = Field(..., min_length=1, max_length=100)
    ssh_port: int = Field(default=22, ge=1, le=65535)
    connection_type: RouterConnectionType = RouterConnectionType.SSH
    enable_required: bool = False


class RouterCredentialCreate(RouterCredentialBase):
    password: str = Field(..., min_length=1, max_length=200)


class RouterCredentialUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    vendor: RouterVendor | None = None
    username: str | None = Field(default=None, min_length=1, max_length=100)
    password: str | None = Field(default=None, min_length=1, max_length=200)
    ssh_port: int | None = Field(default=None, ge=1, le=65535)
    connection_type: RouterConnectionType | None = None
    enable_required: bool | None = None
    status: RouterCredentialStatus | None = None


class RouterCredentialResponse(BaseModel):
    id: int
    name: str
    vendor: RouterVendor
    username: str
    ssh_port: int
    connection_type: RouterConnectionType
    enable_required: bool
    status: RouterCredentialStatus
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }