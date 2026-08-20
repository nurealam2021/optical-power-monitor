from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SqlEnum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RouterVendor(str, Enum):
    HUAWEI = "huawei"
    ZTE = "zte"
    CISCO = "cisco"


class RouterConnectionType(str, Enum):
    SSH = "ssh"
    TELNET = "telnet"


class RouterCredentialStatus(str, Enum):
    ACTIVE = "active"
    DISABLED = "disabled"


class RouterCredential(Base):
    __tablename__ = "router_credentials"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    vendor: Mapped[RouterVendor] = mapped_column(
        SqlEnum(RouterVendor, native_enum=False),
        nullable=False,
        index=True,
    )

    username: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    password_encrypted: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    ssh_port: Mapped[int] = mapped_column(
        Integer,
        default=22,
        nullable=False,
    )

    connection_type: Mapped[RouterConnectionType] = mapped_column(
        SqlEnum(RouterConnectionType, native_enum=False),
        default=RouterConnectionType.SSH,
        nullable=False,
    )

    enable_required: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    status: Mapped[RouterCredentialStatus] = mapped_column(
        SqlEnum(RouterCredentialStatus, native_enum=False),
        default=RouterCredentialStatus.ACTIVE,
        nullable=False,
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