"""add analytics events

Revision ID: 90f34c663ad8
Revises: 9a66e0d48330
Create Date: 2026-05-22 23:18:50.661583

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '90f34c663ad8'
down_revision: Union[str, Sequence[str], None] = '9a66e0d48330'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "analytics_events",

        sa.Column("id", sa.Integer(), nullable=False),

        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=True,
        ),

        sa.Column(
            "session_id",
            sa.String(length=100),
            nullable=True,
        ),

        sa.Column(
            "event_name",
            sa.String(length=80),
            nullable=False,
        ),

        sa.Column(
            "path",
            sa.String(length=500),
            nullable=True,
        ),

        sa.Column(
            "metadata_json",
            sa.JSON(),
            nullable=True,
        ),

        sa.Column(
            "ip_address",
            sa.String(length=80),
            nullable=True,
        ),

        sa.Column(
            "user_agent",
            sa.String(length=500),
            nullable=True,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),

        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_analytics_events_id",
        "analytics_events",
        ["id"],
    )

    op.create_index(
        "ix_analytics_events_event_name",
        "analytics_events",
        ["event_name"],
    )

    op.create_index(
        "ix_analytics_events_created_at",
        "analytics_events",
        ["created_at"],
    )

    op.create_index(
        "ix_analytics_events_session_id",
        "analytics_events",
        ["session_id"],
    )


def downgrade() -> None:
    pass