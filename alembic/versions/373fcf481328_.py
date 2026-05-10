"""empty message

Revision ID: 373fcf481328
Revises: 8257723cb26f
Create Date: 2026-05-09 02:12:37.098245

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '373fcf481328'
down_revision: Union[str, Sequence[str], None] = '8257723cb26f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
