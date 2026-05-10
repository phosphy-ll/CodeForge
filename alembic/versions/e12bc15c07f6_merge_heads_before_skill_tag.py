"""merge heads before skill tag

Revision ID: e12bc15c07f6
Revises: 00b0b1a99f1e, af0cc1731221
Create Date: 2026-04-30 16:32:43.500986

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e12bc15c07f6'
down_revision: Union[str, Sequence[str], None] = ('00b0b1a99f1e', 'af0cc1731221')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
