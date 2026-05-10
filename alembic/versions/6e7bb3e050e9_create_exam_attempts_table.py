from alembic import op
import sqlalchemy as sa


revision = "6e7bb3e050e9"
down_revision = "16a53c608735"
branch_labels = None
depends_on = None


def upgrade():
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
        sa.Column("earned_points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_points", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="pending_review"),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("suspicion_score", sa.Integer(), nullable=True),
        sa.Column("followup_question", sa.Text(), nullable=True),
        sa.Column("affects_streak", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("manual_review_requested", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["goal_id"], ["goals.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("exam_attempts", if_exists=True)