"""add email verification code

Revision ID: 84ee297ace9d
Revises: 3da20376d54c
Create Date: 2026-05-13 20:15:57.279608

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '84ee297ace9d'
down_revision: Union[str, Sequence[str], None] = '3da20376d54c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("email_verification_code", sa.String(length=10), nullable=True),
    )

    op.add_column(
        "users",
        sa.Column("email_verification_expires_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "email_verification_expires_at")
    op.drop_column("users", "email_verification_code")