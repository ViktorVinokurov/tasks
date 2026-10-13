"""user avatar

Revision ID: user_avatar
Revises: task_subtasks
Create Date: 2026-10-13

"""

import sqlalchemy as sa
from alembic import op

revision = "user_avatar"
down_revision = "task_subtasks"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("avatar", sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.drop_column("avatar")
