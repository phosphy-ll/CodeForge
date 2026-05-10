"""create exam attempts table

Revision ID: d07eadf6d55d
Revises: 6e7bb3e050e9
Create Date: 2026-05-10 03:51:32.310032

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd07eadf6d55d'
down_revision: Union[str, Sequence[str], None] = '6e7bb3e050e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "exam_attempts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("goal_id", sa.Integer(), nullable=True),
        sa.Column("attempt_type", sa.String(length=20), nullable=False),
        sa.Column("skill_name", sa.String(length=200), nullable=False),
        sa.Column("content_text", sa.Text(), nullable=True),
        sa.Column("content_code", sa.Text(), nullable=True),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("earned_points", sa.Integer(), server_default="0", nullable=False),
        sa.Column("max_points", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=40), server_default="pending_review", nullable=False),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("suspicion_score", sa.Integer(), nullable=True),
        sa.Column("followup_question", sa.Text(), nullable=True),
        sa.Column("affects_streak", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("manual_review_requested", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["goal_id"], ["goals.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS exam_attempts")
