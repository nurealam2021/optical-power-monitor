from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class OpticalCheckLog(Base):
    __tablename__ = "optical_check_logs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    router_ip: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    vendor: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    interface_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    rx_power: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    tx_power: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    raw_output: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    checked_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )