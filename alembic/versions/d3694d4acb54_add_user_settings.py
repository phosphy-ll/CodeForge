from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d3694d4acb54"
down_revision: Union[str, None] = "ec8610e0e125"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("theme", sa.String(length=20), nullable=False, server_default="dark"))
    op.add_column("users", sa.Column("pressure_level", sa.String(length=20), nullable=False, server_default="normal"))
    op.add_column("users", sa.Column("ai_strictness", sa.String(length=20), nullable=False, server_default="balanced"))
    op.add_column("users", sa.Column("daily_reminder_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.add_column("users", sa.Column("streak_warning_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.add_column("users", sa.Column("inactivity_alert_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")))


def downgrade() -> None:
    op.drop_column("users", "inactivity_alert_enabled")
    op.drop_column("users", "streak_warning_enabled")
    op.drop_column("users", "daily_reminder_enabled")
    op.drop_column("users", "ai_strictness")
    op.drop_column("users", "pressure_level")
    op.drop_column("users", "theme")