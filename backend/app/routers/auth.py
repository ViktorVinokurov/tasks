from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser
from app.models import User
from app.schemas import AuthRead, LoginRequest, RegisterRequest, UserRead
from app.security import create_access_token, hash_password, verify_password
from app.seed import seed_groups_for_user
from app.support import new_id, utcnow

router = APIRouter(prefix="/auth", tags=["Вход"])


def display_name(email: str, name: str) -> str:
    if name:
        return name
    local = email.split("@", 1)[0].strip()
    return local or "Я"


def auth_payload(user: User) -> AuthRead:
    return AuthRead(access_token=create_access_token(user.id), user=UserRead.model_validate(user))


@router.post("/register", response_model=AuthRead, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthRead:
    taken = db.scalar(select(User.id).where(User.email == payload.email))
    if taken is not None:
        raise HTTPException(status_code=409, detail="Такой адрес уже зарегистрирован")

    user = User(
        id=new_id(),
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=display_name(payload.email, payload.name),
        created_at=utcnow(),
    )
    db.add(user)
    db.flush()
    seed_groups_for_user(db, user.id)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Такой адрес уже зарегистрирован") from None
    db.refresh(user)
    return auth_payload(user)


@router.post("/login", response_model=AuthRead)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthRead:
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверная почта или пароль")
    return auth_payload(user)


@router.get("/me", response_model=UserRead)
def me(user: CurrentUser) -> User:
    return user
