"""users own groups, tasks and thoughts

Revision ID: user_ownership
Revises: initial_schema
Create Date: 2026-10-06

"""

import sqlalchemy as sa
from alembic import op

revision = "user_ownership"
down_revision = "initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # Записи без владельца нельзя отдать ни одному аккаунту.
    op.execute("DELETE FROM tasks")
    op.execute("DELETE FROM thoughts")
    op.execute("DELETE FROM groups")

    _bind_owner("groups", "fk_groups_user_id", "ix_groups_user_id")
    _bind_owner("tasks", "fk_tasks_user_id", "ix_tasks_user_id")
    _bind_owner("thoughts", "fk_thoughts_user_id", "ix_thoughts_user_id")


def downgrade() -> None:
    _unbind_owner("thoughts", "fk_thoughts_user_id", "ix_thoughts_user_id")
    _unbind_owner("tasks", "fk_tasks_user_id", "ix_tasks_user_id")
    _unbind_owner("groups", "fk_groups_user_id", "ix_groups_user_id")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")


def _bind_owner(table: str, fk_name: str, index_name: str) -> None:
    with op.batch_alter_table(table) as batch:
        batch.add_column(sa.Column("user_id", sa.String(length=36), nullable=False))
        batch.create_foreign_key(fk_name, "users", ["user_id"], ["id"], ondelete="CASCADE")
        batch.create_index(index_name, ["user_id"])


def _unbind_owner(table: str, fk_name: str, index_name: str) -> None:
    with op.batch_alter_table(table) as batch:
        batch.drop_constraint(fk_name, type_="foreignkey")
        batch.drop_index(index_name)
        batch.drop_column("user_id")
