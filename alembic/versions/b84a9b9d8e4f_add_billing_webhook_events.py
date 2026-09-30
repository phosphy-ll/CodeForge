"""add billing webhook events

Revision ID: b84a9b9d8e4f
Revises: 90f34c663ad8
Create Date: 2026-09-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b84a9b9d8e4f"
down_revision: Union[str, Sequence[str], None] = "90f34c663ad8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "billing_webhook_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(length=30), nullable=False),
        sa.Column("external_event_id", sa.String(length=255), nullable=False),
        sa.Column("event_type", sa.String(length=80), nullable=False),
        sa.Column("payload_hash", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "external_event_id",
            name="uq_billing_webhook_events_external_event_id",
        ),
    )
    op.create_index(
        "ix_billing_webhook_events_id",
        "billing_webhook_events",
        ["id"],
    )
    op.create_index(
        "ix_billing_webhook_events_external_event_id",
        "billing_webhook_events",
        ["external_event_id"],
        unique=True,
    )
    op.create_index(
        "ix_billing_webhook_events_event_type",
        "billing_webhook_events",
        ["event_type"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_billing_webhook_events_event_type",
        table_name="billing_webhook_events",
    )
    op.drop_index(
        "ix_billing_webhook_events_external_event_id",
        table_name="billing_webhook_events",
    )
    op.drop_index(
        "ix_billing_webhook_events_id",
        table_name="billing_webhook_events",
    )
    op.drop_table("billing_webhook_events")
