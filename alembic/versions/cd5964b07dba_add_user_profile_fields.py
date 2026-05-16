"""add user profile fields

Revision ID: cd5964b07dba
Revises: 84ee297ace9d
Create Date: 2026-05-14 21:49:06.129127

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cd5964b07dba'
down_revision: Union[str, Sequence[str], None] = '84ee297ace9d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_url", sa.String(length=500), nullable=True))
    op.add_column("users", sa.Column("bio", sa.String(length=300), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "bio")
    op.drop_column("users", "avatar_url")
