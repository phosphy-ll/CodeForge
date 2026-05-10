"""add submission review details

Revision ID: af0cc1731221
Revises: 35e975e5c688
Create Date: 2026-04-29 00:15:19.593932

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'af0cc1731221'
down_revision = "8d18594ce3cf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
