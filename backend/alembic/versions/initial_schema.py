"""initial schema

Revision ID: initial_schema
Revises:
Create Date: 2026-10-06

"""

import sqlalchemy as sa
from alembic import op

revision = "initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "groups",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=40), nullable=False),
        sa.Column("color", sa.String(length=7), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "tasks",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("note", sa.String(length=2000), nullable=False, server_default=""),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("group_id", sa.String(length=36), nullable=True),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_tasks_date", "tasks", ["date"])
    op.create_index("ix_tasks_group_id", "tasks", ["group_id"])
    op.create_table(
        "thoughts",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("text", sa.String(length=4000), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_thoughts_date", "thoughts", ["date"])


def downgrade() -> None:
    op.drop_index("ix_thoughts_date", table_name="thoughts")
    op.drop_table("thoughts")
    op.drop_index("ix_tasks_group_id", table_name="tasks")
    op.drop_index("ix_tasks_date", table_name="tasks")
    op.drop_table("tasks")
    op.drop_table("groups")
