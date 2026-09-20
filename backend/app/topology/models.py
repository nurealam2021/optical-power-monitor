from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TopologyLink(Base):
    __tablename__ = "topology_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    source_router_id: Mapped[int] = mapped_column(
        ForeignKey("router_inventory.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    local_interface: Mapped[str] = mapped_column(String(150), nullable=False)

    remote_router_name: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )

    remote_management_ip: Mapped[str | None] = mapped_column(
        String(100), nullable=True, index=True
    )

    remote_interface: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )

    remote_vendor: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )

    discovery_method: Mapped[str] = mapped_column(
        String(30), default="lldp", nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30), default="up", nullable=False
    )

    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
