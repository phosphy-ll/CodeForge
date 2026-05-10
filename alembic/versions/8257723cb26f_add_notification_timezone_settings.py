"""add notification timezone settings

Revision ID: 8257723cb26f
Revises: 7f62aa2b9ab8
Create Date: 2026-05-06 20:10:09.645514

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8257723cb26f'
down_revision: Union[str, Sequence[str], None] = '7f62aa2b9ab8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("timezone", sa.String(length=64), nullable=False, server_default="Asia/Almaty"))
    op.add_column("users", sa.Column("daily_reminder_hour", sa.Integer(), nullable=False, server_default="12"))
    op.add_column("users", sa.Column("streak_warning_hour", sa.Integer(), nullable=False, server_default="20"))


def downgrade() -> None:
    op.drop_column("users", "streak_warning_hour")
    op.drop_column("users", "daily_reminder_hour")
    op.drop_column("users", "timezone")