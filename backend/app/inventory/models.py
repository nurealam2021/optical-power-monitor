from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SqlEnum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.routers.models import RouterVendor


class RouterInventoryStatus(str, Enum):
    ACTIVE = "active"
    DISABLED = "disabled"


class RouterInventory(Base):
    __tablename__ = "router_inventory"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    device_id: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )

    router_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    management_ip: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    vendor: Mapped[RouterVendor] = mapped_column(
        SqlEnum(RouterVendor, native_enum=False),
        nullable=False,
        index=True,
    )

    model: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    os_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    version: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    site_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    router_role: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    backbone_capacity_mbps: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    status: Mapped[RouterInventoryStatus] = mapped_column(
        SqlEnum(RouterInventoryStatus, native_enum=False),
        default=RouterInventoryStatus.ACTIVE,
        nullable=False,
    )

    detected_vendor: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    last_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )