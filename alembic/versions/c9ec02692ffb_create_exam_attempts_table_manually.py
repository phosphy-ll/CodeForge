"""create exam attempts table manually

Revision ID: c9ec02692ffb
Revises: 148576596388
Create Date: 2026-05-10 22:31:33.100062

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9ec02692ffb'
down_revision: Union[str, Sequence[str], None] = '148576596388'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "exam_attempts",

        sa.Column("id", sa.Integer(), primary_key=True),

        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),

        sa.Column(
            "skill_name",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "exam_title",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "content_text",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "content_code",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "score",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "earned_points",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "max_points",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "status",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "feedback",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "suspicion_score",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),

        sa.Column(
            "followup_question",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "manual_review_requested",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),

        sa.Column(
            "affects_streak",
            sa.Boolean(),
            nullable=False,
            server_default="true",
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

def downgrade() -> None:
    op.drop_table("exam_attempts")
