from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.constants import STARTER_GROUPS
from app.models import Group
from app.support import new_id


def seed_groups_for_user(db: Session, user_id: str) -> None:
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)
    for index, item in enumerate(STARTER_GROUPS):
        db.add(
            Group(
                id=new_id(),
                user_id=user_id,
                name=item["name"],
                color=item["color"],
                created_at=base + timedelta(seconds=index),
            )
        )
