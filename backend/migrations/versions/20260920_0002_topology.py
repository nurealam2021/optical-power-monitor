"""Add LLDP network topology links.

Revision ID: 20260920_0002
Revises: 20260820_0001
Create Date: 2026-09-20
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260920_0002"
down_revision: Union[str, Sequence[str], None] = "20260820_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "topology_links",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source_router_id", sa.Integer(), nullable=False),
        sa.Column("local_interface", sa.String(length=150), nullable=False),
        sa.Column("remote_router_name", sa.String(length=150), nullable=True),
        sa.Column("remote_management_ip", sa.String(length=100), nullable=True),
        sa.Column("remote_interface", sa.String(length=150), nullable=True),
        sa.Column("remote_vendor", sa.String(length=50), nullable=True),
        sa.Column("discovery_method", sa.String(length=30), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["source_router_id"],
            ["router_inventory.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_topology_links_id",
        "topology_links",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_topology_links_source_router_id",
        "topology_links",
        ["source_router_id"],
        unique=False,
    )
    op.create_index(
        "ix_topology_links_remote_management_ip",
        "topology_links",
        ["remote_management_ip"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_topology_links_remote_management_ip",
        table_name="topology_links",
    )
    op.drop_index(
        "ix_topology_links_source_router_id",
        table_name="topology_links",
    )
    op.drop_index("ix_topology_links_id", table_name="topology_links")
    op.drop_table("topology_links")
