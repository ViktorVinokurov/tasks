from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser
from app.models import Thought
from app.schemas import ThoughtCreate, ThoughtRead, ThoughtUpdate
from app.support import new_id, utcnow

router = APIRouter(prefix="/thoughts", tags=["Мысли"])


def _get_thought(db: Session, thought_id: str, user_id: str) -> Thought:
    thought = db.get(Thought, thought_id)
    if thought is None or thought.user_id != user_id:
        raise HTTPException(status_code=404, detail="Мысль не найдена")
    return thought


@router.get("", response_model=list[ThoughtRead])
def list_thoughts(
    user: CurrentUser,
    day: date | None = Query(default=None, alias="date", description="День в формате ГГГГ-ММ-ДД"),
    db: Session = Depends(get_db),
) -> list[Thought]:
    stmt = select(Thought).where(Thought.user_id == user.id)
    if day is not None:
        stmt = stmt.where(Thought.date == day)
    stmt = stmt.order_by(Thought.created_at.asc(), Thought.id.asc())
    return list(db.scalars(stmt))


@router.post("", response_model=ThoughtRead, status_code=201)
def create_thought(payload: ThoughtCreate, user: CurrentUser, db: Session = Depends(get_db)) -> Thought:
    now = utcnow()
    thought = Thought(
        id=new_id(),
        user_id=user.id,
        text=payload.text,
        date=payload.date,
        created_at=now,
        updated_at=now,
    )
    db.add(thought)
    db.commit()
    db.refresh(thought)
    return thought


@router.get("/{thought_id}", response_model=ThoughtRead)
def read_thought(thought_id: str, user: CurrentUser, db: Session = Depends(get_db)) -> Thought:
    return _get_thought(db, thought_id, user.id)


@router.patch("/{thought_id}", response_model=ThoughtRead)
def update_thought(
    thought_id: str,
    payload: ThoughtUpdate,
    user: CurrentUser,
    db: Session = Depends(get_db),
) -> Thought:
    thought = _get_thought(db, thought_id, user.id)
    thought.text = payload.text
    thought.updated_at = utcnow()
    db.commit()
    db.refresh(thought)
    return thought


@router.delete("/{thought_id}", status_code=204)
def delete_thought(thought_id: str, user: CurrentUser, db: Session = Depends(get_db)) -> Response:
    thought = _get_thought(db, thought_id, user.id)
    db.delete(thought)
    db.commit()
    return Response(status_code=204)
