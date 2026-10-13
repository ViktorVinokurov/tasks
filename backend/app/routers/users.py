from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser
from app.models import User
from app.schemas import UserSearchRead

router = APIRouter(prefix="/users", tags=["Пользователи"])

SEARCH_LIMIT = 8


@router.get("", response_model=list[UserSearchRead])
def search_users(
    user: CurrentUser,
    q: str = Query(default="", description="Часть имени"),
    db: Session = Depends(get_db),
) -> list[User]:
    needle = q.strip().casefold()
    if not needle:
        return []
    people = db.scalars(select(User).where(User.id != user.id))
    found = [person for person in people if needle in person.name.casefold()]
    found.sort(key=lambda person: (person.name.casefold(), person.id))
    return found[:SEARCH_LIMIT]
