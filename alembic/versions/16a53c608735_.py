"""empty message

Revision ID: 16a53c608735
Revises: 07a8261671c6
Create Date: 2026-05-10 03:49:50.001543

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '16a53c608735'
down_revision: Union[str, Sequence[str], None] = '07a8261671c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
