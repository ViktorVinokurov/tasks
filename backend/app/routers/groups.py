from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser
from app.models import Group, Task
from app.schemas import GroupCreate, GroupRead, GroupUpdate
from app.support import new_id, utcnow

router = APIRouter(prefix="/groups", tags=["Группы"])


def _get_group(db: Session, group_id: str, user_id: str) -> Group:
    group = db.get(Group, group_id)
    if group is None or group.user_id != user_id:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    return group


@router.get("", response_model=list[GroupRead])
def list_groups(user: CurrentUser, db: Session = Depends(get_db)) -> list[Group]:
    stmt = (
        select(Group)
        .where(Group.user_id == user.id)
        .order_by(Group.created_at.asc(), Group.id.asc())
    )
    return list(db.scalars(stmt))


@router.post("", response_model=GroupRead, status_code=201)
def create_group(payload: GroupCreate, user: CurrentUser, db: Session = Depends(get_db)) -> Group:
    group = Group(
        id=new_id(),
        user_id=user.id,
        name=payload.name,
        color=payload.color,
        created_at=utcnow(),
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.get("/{group_id}", response_model=GroupRead)
def read_group(group_id: str, user: CurrentUser, db: Session = Depends(get_db)) -> Group:
    return _get_group(db, group_id, user.id)


@router.patch("/{group_id}", response_model=GroupRead)
def update_group(
    group_id: str,
    payload: GroupUpdate,
    user: CurrentUser,
    db: Session = Depends(get_db),
) -> Group:
    group = _get_group(db, group_id, user.id)
    group.name = payload.name
    group.color = payload.color
    db.commit()
    db.refresh(group)
    return group


@router.delete("/{group_id}", status_code=204)
def delete_group(group_id: str, user: CurrentUser, db: Session = Depends(get_db)) -> Response:
    group = _get_group(db, group_id, user.id)
    tasks = db.scalars(
        select(Task).where(Task.group_id == group_id, Task.user_id == user.id)
    )
    for task in tasks:
        task.group_id = None
    db.delete(group)
    db.commit()
    return Response(status_code=204)
