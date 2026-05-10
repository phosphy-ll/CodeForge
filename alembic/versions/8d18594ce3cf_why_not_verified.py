from alembic import op
import sqlalchemy as sa


revision = "8d18594ce3cf"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("task_submissions", sa.Column("why_not_verified", sa.Text(), nullable=True))
    op.add_column("task_submissions", sa.Column("improvement_steps", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("task_submissions", "improvement_steps")
    op.drop_column("task_submissions", "why_not_verified")