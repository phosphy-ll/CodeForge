"""add skill_tag to tasks

Revision ID: ec8610e0e125
Revises: e12bc15c07f6
Create Date: 2026-04-30 16:33:07.717375

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision = "ec8610e0e125"
down_revision = "e12bc15c07f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("skill_tag", sa.String(length=80), nullable=True))
    op.create_index("ix_tasks_skill_tag", "tasks", ["skill_tag"])


def downgrade() -> None:
    op.drop_index("ix_tasks_skill_tag", table_name="tasks")
    op.drop_column("tasks", "skill_tag")