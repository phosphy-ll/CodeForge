"""merge heads

Revision ID: 35e975e5c688
Revises: 58ffcb5883dd, add_why_not_verified_to_submissions
Create Date: 2026-04-29 00:14:59.132137

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '35e975e5c688'
down_revision = ("58ffcb5883dd", "8d18594ce3cf")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
