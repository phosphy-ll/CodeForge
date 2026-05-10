"""create user skills

Revision ID: 00b0b1a99f1e
Revises: 35e975e5c688
Create Date: 2026-04-29 23:53:22.574099

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '00b0b1a99f1e'
down_revision: Union[str, Sequence[str], None] = '35e975e5c688'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table("user_skills", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("skill_name", sa.String(length=100), nullable=False), sa.Column("weakness_score", sa.Float(), nullable=False, server_default="0.5"), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True))
    op.create_index("ix_user_skills_user_id", "user_skills", ["user_id"])
    op.create_index("ix_user_skills_user_skill", "user_skills", ["user_id", "skill_name"], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_user_skills_user_skill", table_name="user_skills")
    op.drop_index("ix_user_skills_user_id", table_name="user_skills")
    op.drop_table("user_skills")
