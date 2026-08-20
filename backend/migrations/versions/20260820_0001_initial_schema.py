"""Create the initial application schema.

Revision ID: 20260820_0001
Revises:
Create Date: 2026-08-20
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260820_0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=150), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("SUPER_ADMIN", "ADMIN", "USER", name="userrole", native_enum=False),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("ACTIVE", "DISABLED", "DELETED", name="userstatus", native_enum=False),
            nullable=False,
        ),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "router_credentials",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column(
            "vendor",
            sa.Enum("HUAWEI", "ZTE", "CISCO", name="routervendor", native_enum=False),
            nullable=False,
        ),
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("password_encrypted", sa.String(length=500), nullable=False),
        sa.Column("ssh_port", sa.Integer(), nullable=False),
        sa.Column(
            "connection_type",
            sa.Enum("SSH", "TELNET", name="routerconnectiontype", native_enum=False),
            nullable=False,
        ),
        sa.Column("enable_required", sa.Boolean(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("ACTIVE", "DISABLED", name="routercredentialstatus", native_enum=False),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_router_credentials_id"), "router_credentials", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_router_credentials_vendor"),
        "router_credentials",
        ["vendor"],
        unique=False,
    )

    op.create_table(
        "router_inventory",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("device_id", sa.String(length=50), nullable=True),
        sa.Column("router_name", sa.String(length=150), nullable=True),
        sa.Column("management_ip", sa.String(length=100), nullable=False),
        sa.Column(
            "vendor",
            sa.Enum("HUAWEI", "ZTE", "CISCO", name="routervendor", native_enum=False),
            nullable=False,
        ),
        sa.Column("model", sa.String(length=150), nullable=True),
        sa.Column("os_name", sa.String(length=100), nullable=True),
        sa.Column("version", sa.String(length=150), nullable=True),
        sa.Column("site_name", sa.String(length=150), nullable=True),
        sa.Column("router_role", sa.String(length=100), nullable=True),
        sa.Column("backbone_capacity_mbps", sa.Integer(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("ACTIVE", "DISABLED", name="routerinventorystatus", native_enum=False),
            nullable=False,
        ),
        sa.Column("detected_vendor", sa.String(length=50), nullable=True),
        sa.Column("last_verified_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_router_inventory_device_id"),
        "router_inventory",
        ["device_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_router_inventory_id"), "router_inventory", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_router_inventory_management_ip"),
        "router_inventory",
        ["management_ip"],
        unique=True,
    )
    op.create_index(
        op.f("ix_router_inventory_vendor"),
        "router_inventory",
        ["vendor"],
        unique=False,
    )

    op.create_table(
        "optical_check_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("router_ip", sa.String(length=100), nullable=False),
        sa.Column("vendor", sa.String(length=50), nullable=False),
        sa.Column("interface_name", sa.String(length=100), nullable=False),
        sa.Column("rx_power", sa.String(length=50), nullable=True),
        sa.Column("tx_power", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("raw_output", sa.Text(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("checked_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_optical_check_logs_id"), "optical_check_logs", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_optical_check_logs_router_ip"),
        "optical_check_logs",
        ["router_ip"],
        unique=False,
    )
    op.create_index(
        op.f("ix_optical_check_logs_user_id"),
        "optical_check_logs",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_optical_check_logs_vendor"),
        "optical_check_logs",
        ["vendor"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_optical_check_logs_vendor"), table_name="optical_check_logs")
    op.drop_index(op.f("ix_optical_check_logs_user_id"), table_name="optical_check_logs")
    op.drop_index(op.f("ix_optical_check_logs_router_ip"), table_name="optical_check_logs")
    op.drop_index(op.f("ix_optical_check_logs_id"), table_name="optical_check_logs")
    op.drop_table("optical_check_logs")

    op.drop_index(op.f("ix_router_inventory_vendor"), table_name="router_inventory")
    op.drop_index(op.f("ix_router_inventory_management_ip"), table_name="router_inventory")
    op.drop_index(op.f("ix_router_inventory_id"), table_name="router_inventory")
    op.drop_index(op.f("ix_router_inventory_device_id"), table_name="router_inventory")
    op.drop_table("router_inventory")

    op.drop_index(op.f("ix_router_credentials_vendor"), table_name="router_credentials")
    op.drop_index(op.f("ix_router_credentials_id"), table_name="router_credentials")
    op.drop_table("router_credentials")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
