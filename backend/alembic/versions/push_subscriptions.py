"""push subscriptions

Revision ID: push_subscriptions
Revises: user_avatar
Create Date: 2026-10-13

"""

import sqlalchemy as sa
from alembic import op

revision = "push_subscriptions"
down_revision = "user_avatar"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "push_subscriptions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("endpoint", sa.Text(), nullable=False),
        sa.Column("p256dh", sa.String(length=200), nullable=False),
        sa.Column("auth", sa.String(length=200), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_push_subscriptions_user_id", "push_subscriptions", ["user_id"])
    op.create_index(
        "ix_push_subscriptions_endpoint",
        "push_subscriptions",
        ["endpoint"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_push_subscriptions_endpoint", table_name="push_subscriptions")
    op.drop_index("ix_push_subscriptions_user_id", table_name="push_subscriptions")
    op.drop_table("push_subscriptions")
