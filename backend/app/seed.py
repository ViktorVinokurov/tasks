from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.constants import INITIAL_GROUPS
from app.models import Group


def seed_groups(db: Session) -> None:
    count = db.scalar(select(func.count()).select_from(Group))
    if count:
        return
    for item in INITIAL_GROUPS:
        db.add(Group(**item))
