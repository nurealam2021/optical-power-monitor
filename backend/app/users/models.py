from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SqlEnum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    USER = "user"


class UserStatus(str, Enum):
    ACTIVE = "active"
    DISABLED = "disabled"
    DELETED = "deleted"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        index=True,
        nullable=False,
    )

    phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[UserRole] = mapped_column(
        SqlEnum(UserRole, native_enum=False),
        default=UserRole.USER,
        nullable=False,
    )

    status: Mapped[UserStatus] = mapped_column(
        SqlEnum(UserStatus, native_enum=False),
        default=UserStatus.ACTIVE,
        nullable=False,
    )

    created_by: Mapped[int | None] = mapped_column(
        Integer,
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