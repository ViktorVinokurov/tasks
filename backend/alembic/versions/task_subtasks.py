"""task subtasks

Revision ID: task_subtasks
Revises: user_ownership
Create Date: 2026-10-12

"""

import sqlalchemy as sa
from alembic import op

revision = "task_subtasks"
down_revision = "user_ownership"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        from sqlalchemy.dialects.postgresql import JSONB

        column = sa.Column(
            "subtasks",
            JSONB(),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        )
    else:
        column = sa.Column("subtasks", sa.JSON(), nullable=False, server_default=sa.text("'[]'"))

    with op.batch_alter_table("tasks") as batch:
        batch.add_column(column)


def downgrade() -> None:
    with op.batch_alter_table("tasks") as batch:
        batch.drop_column("subtasks")
