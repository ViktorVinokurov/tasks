from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Group, Task
from app.schemas import TaskCreate, TaskRead, TaskUpdate
from app.support import contains_pattern, new_id, utcnow

router = APIRouter(prefix="/tasks", tags=["Дела"])


def _get_task(db: Session, task_id: str) -> Task:
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Дело не найдено")
    return task


def ensure_group(db: Session, group_id: str | None) -> str | None:
    if not group_id:
        return None
    if db.get(Group, group_id) is None:
        raise HTTPException(status_code=422, detail="Такой группы нет")
    return group_id


@router.get("", response_model=list[TaskRead])
def list_tasks(
    day: date | None = Query(default=None, alias="date", description="День в формате ГГГГ-ММ-ДД"),
    status: Literal["all", "active", "completed"] = Query(
        default="all",
        description="all — все, active — невыполненные, completed — выполненные",
    ),
    group_id: str | None = Query(
        default=None,
        alias="groupId",
        description="Идентификатор группы, all — без фильтра, none — дела без группы",
    ),
    q: str | None = Query(default=None, description="Поиск по названию и пометке"),
    db: Session = Depends(get_db),
) -> list[Task]:
    stmt = select(Task)
    if day is not None:
        stmt = stmt.where(Task.date == day)
    if status == "active":
        stmt = stmt.where(Task.completed.is_(False))
    elif status == "completed":
        stmt = stmt.where(Task.completed.is_(True))
    if group_id not in (None, "", "all"):
        if group_id == "none":
            stmt = stmt.where(Task.group_id.is_(None))
        else:
            stmt = stmt.where(Task.group_id == group_id)
    if q and q.strip():
        pattern = contains_pattern(q)
        stmt = stmt.where(
            or_(
                func.lower(Task.title).like(pattern, escape="\\"),
                func.lower(Task.note).like(pattern, escape="\\"),
            )
        )
    stmt = stmt.order_by(Task.completed.asc(), Task.created_at.asc(), Task.id.asc())
    return list(db.scalars(stmt))


@router.post("", response_model=TaskRead, status_code=201)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)) -> Task:
    group_id = ensure_group(db, payload.group_id)
    now = utcnow()
    task = Task(
        id=new_id(),
        title=payload.title,
        note=payload.note,
        date=payload.date,
        group_id=group_id,
        completed=False,
        created_at=now,
        updated_at=now,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskRead)
def read_task(task_id: str, db: Session = Depends(get_db)) -> Task:
    return _get_task(db, task_id)


@router.patch("/{task_id}", response_model=TaskRead)
def update_task(task_id: str, payload: TaskUpdate, db: Session = Depends(get_db)) -> Task:
    task = _get_task(db, task_id)
    changed = False
    fields = payload.model_fields_set

    if "title" in fields:
        if payload.title is None:
            raise HTTPException(status_code=422, detail="Дайте делу название")
        task.title = payload.title
        changed = True
    if "note" in fields:
        task.note = payload.note or ""
        changed = True
    if "date" in fields:
        if payload.date is None:
            raise HTTPException(status_code=422, detail="Укажите дату")
        task.date = payload.date
        changed = True
    if "group_id" in fields:
        task.group_id = ensure_group(db, payload.group_id)
        changed = True
    if "completed" in fields:
        if payload.completed is None:
            raise HTTPException(status_code=422, detail="Укажите, выполнено ли дело")
        task.completed = payload.completed
        changed = True

    if changed:
        task.updated_at = utcnow()
        db.commit()
        db.refresh(task)
    return task


@router.post("/{task_id}/toggle", response_model=TaskRead)
def toggle_task(task_id: str, db: Session = Depends(get_db)) -> Task:
    task = _get_task(db, task_id)
    task.completed = not task.completed
    task.updated_at = utcnow()
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: str, db: Session = Depends(get_db)) -> Response:
    task = _get_task(db, task_id)
    db.delete(task)
    db.commit()
    return Response(status_code=204)
