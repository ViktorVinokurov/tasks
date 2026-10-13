import re
from datetime import date as Date
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, field_validator, model_validator
from pydantic.alias_generators import to_camel

from app.constants import (
    AVATAR_MAX,
    EMAIL_MAX,
    GROUP_COLOR_SET,
    GROUP_NAME_MAX,
    PASSWORD_MAX,
    PASSWORD_MIN,
    PUSH_ENDPOINT_MAX,
    PUSH_KEY_MAX,
    SUBTASK_TITLE_MAX,
    SUBTASKS_MAX,
    TASK_NOTE_MAX,
    TASK_TITLE_MAX,
    THOUGHT_MAX,
    USER_NAME_MAX,
)

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_AVATAR = re.compile(r"^data:image/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=\s]+$")
from app.support import new_id, to_utc_iso

UtcDateTime = Annotated[datetime, PlainSerializer(to_utc_iso, return_type=str, when_used="json")]


class APIModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


def clean_required_text(value: str, *, empty: str, limit: int, limit_message: str) -> str:
    text = value.strip()
    if not text:
        raise ValueError(empty)
    if len(text) > limit:
        raise ValueError(limit_message)
    return text


def clean_optional_text(value: str | None, *, limit: int, limit_message: str) -> str | None:
    if value is None:
        return None
    text = value.strip()
    if len(text) > limit:
        raise ValueError(limit_message)
    return text


def blank_to_none(value: object) -> object:
    if value == "":
        return None
    return value


def clean_color(value: str) -> str:
    color = value.strip().lower()
    if color not in GROUP_COLOR_SET:
        raise ValueError("Выберите цвет из палитры")
    return color


class GroupCreate(APIModel):
    name: str
    color: str

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        return clean_required_text(
            value,
            empty="Дайте группе имя",
            limit=GROUP_NAME_MAX,
            limit_message=f"Имя группы не длиннее {GROUP_NAME_MAX} символов",
        )

    @field_validator("color")
    @classmethod
    def check_color(cls, value: str) -> str:
        return clean_color(value)


class GroupUpdate(GroupCreate):
    pass


class GroupRead(APIModel):
    id: str
    name: str
    color: str
    created_at: UtcDateTime


class SubtaskWrite(APIModel):
    id: str | None = None
    title: str
    completed: bool = False

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        return clean_required_text(
            value,
            empty="Напишите текст подзадачи",
            limit=SUBTASK_TITLE_MAX,
            limit_message=f"Подзадача не длиннее {SUBTASK_TITLE_MAX} символов",
        )


class SubtaskRead(APIModel):
    id: str
    title: str
    completed: bool


def prepare_subtasks(items: list[SubtaskWrite]) -> list[SubtaskWrite]:
    if len(items) > SUBTASKS_MAX:
        raise ValueError(f"Подзадач не больше {SUBTASKS_MAX}")
    seen: set[str] = set()
    prepared: list[SubtaskWrite] = []
    for item in items:
        item_id = (item.id or "").strip() or new_id()
        if len(item_id) > 36 or any(char.isspace() for char in item_id):
            raise ValueError("Некорректный идентификатор подзадачи")
        if item_id in seen:
            raise ValueError("Подзадачи повторяются")
        seen.add(item_id)
        prepared.append(SubtaskWrite(id=item_id, title=item.title, completed=item.completed))
    return prepared


class TaskCreate(APIModel):
    title: str
    note: str = ""
    date: Date
    group_id: str | None = None
    subtasks: list[SubtaskWrite] = Field(default_factory=list)

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        return clean_required_text(
            value,
            empty="Дайте делу название",
            limit=TASK_TITLE_MAX,
            limit_message=f"Название не длиннее {TASK_TITLE_MAX} символов",
        )

    @field_validator("note")
    @classmethod
    def clean_note(cls, value: str) -> str:
        text = clean_optional_text(
            value,
            limit=TASK_NOTE_MAX,
            limit_message=f"Описание не длиннее {TASK_NOTE_MAX} символов",
        )
        return text or ""

    @field_validator("group_id", mode="before")
    @classmethod
    def empty_group(cls, value: object) -> object:
        return blank_to_none(value)

    @model_validator(mode="after")
    def check_subtasks(self) -> "TaskCreate":
        self.subtasks = prepare_subtasks(self.subtasks)
        return self


class TaskUpdate(APIModel):
    title: str | None = None
    note: str | None = None
    date: Date | None = None
    group_id: str | None = None
    completed: bool | None = None
    subtasks: list[SubtaskWrite] | None = None

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return clean_required_text(
            value,
            empty="Дайте делу название",
            limit=TASK_TITLE_MAX,
            limit_message=f"Название не длиннее {TASK_TITLE_MAX} символов",
        )

    @field_validator("note")
    @classmethod
    def clean_note(cls, value: str | None) -> str | None:
        return clean_optional_text(
            value,
            limit=TASK_NOTE_MAX,
            limit_message=f"Описание не длиннее {TASK_NOTE_MAX} символов",
        )

    @field_validator("group_id", mode="before")
    @classmethod
    def empty_group(cls, value: object) -> object:
        return blank_to_none(value)

    @model_validator(mode="after")
    def check_subtasks(self) -> "TaskUpdate":
        if self.subtasks is not None:
            self.subtasks = prepare_subtasks(self.subtasks)
        return self


class TaskRead(APIModel):
    id: str
    title: str
    note: str
    date: Date
    group_id: str | None
    completed: bool
    subtasks: list[SubtaskRead] = Field(default_factory=list)
    created_at: UtcDateTime
    updated_at: UtcDateTime


class TaskTransfer(APIModel):
    user_id: str

    @field_validator("user_id")
    @classmethod
    def check_user_id(cls, value: str) -> str:
        user_id = value.strip()
        if not user_id or len(user_id) > 36 or any(char.isspace() for char in user_id):
            raise ValueError("Выберите пользователя")
        return user_id


class ThoughtCreate(APIModel):
    text: str
    date: Date

    @field_validator("text")
    @classmethod
    def clean_text(cls, value: str) -> str:
        return clean_required_text(
            value,
            empty="Запишите мысль",
            limit=THOUGHT_MAX,
            limit_message=f"Мысль не длиннее {THOUGHT_MAX} символов",
        )


class ThoughtUpdate(APIModel):
    text: str

    @field_validator("text")
    @classmethod
    def clean_text(cls, value: str) -> str:
        return clean_required_text(
            value,
            empty="Запишите мысль",
            limit=THOUGHT_MAX,
            limit_message=f"Мысль не длиннее {THOUGHT_MAX} символов",
        )


class ThoughtRead(APIModel):
    id: str
    text: str
    date: Date
    created_at: UtcDateTime
    updated_at: UtcDateTime


class HealthRead(BaseModel):
    status: str = Field(examples=["ok"])


class PushKeys(APIModel):
    p256dh: str
    auth: str

    @field_validator("p256dh", "auth")
    @classmethod
    def check_key(cls, value: str) -> str:
        text = value.strip()
        if not text or len(text) > PUSH_KEY_MAX:
            raise ValueError("Некорректная подписка на уведомления")
        return text


class PushSubscriptionWrite(APIModel):
    endpoint: str
    keys: PushKeys

    @field_validator("endpoint")
    @classmethod
    def check_endpoint(cls, value: str) -> str:
        text = value.strip()
        if not text.startswith("https://") or len(text) > PUSH_ENDPOINT_MAX or any(char.isspace() for char in text):
            raise ValueError("Некорректный адрес уведомлений")
        return text


class PushSubscriptionDelete(APIModel):
    endpoint: str

    @field_validator("endpoint")
    @classmethod
    def check_endpoint(cls, value: str) -> str:
        text = value.strip()
        if not text or len(text) > PUSH_ENDPOINT_MAX:
            raise ValueError("Некорректный адрес уведомлений")
        return text


class VapidRead(APIModel):
    public_key: str


def clean_email(value: str) -> str:
    email = value.strip().lower()
    if len(email) > EMAIL_MAX or _EMAIL.fullmatch(email) is None:
        raise ValueError("Укажите почту, например anna@example.com")
    return email


def clean_avatar(value: str | None) -> str | None:
    if value is None:
        return None
    if len(value) > AVATAR_MAX or _AVATAR.fullmatch(value) is None:
        raise ValueError("Выберите фото в формате JPEG, PNG или WebP")
    return value


def clean_password(value: str) -> str:
    if len(value) < PASSWORD_MIN:
        raise ValueError(f"Пароль не короче {PASSWORD_MIN} символов")
    if len(value.encode()) > PASSWORD_MAX:
        raise ValueError(f"Пароль не длиннее {PASSWORD_MAX} символов")
    return value


class UserRead(APIModel):
    id: str
    email: str
    name: str
    avatar: str | None = None


class UserSearchRead(APIModel):
    id: str
    name: str
    avatar: str | None = None


class ProfileUpdate(APIModel):
    name: str
    avatar: str | None = None

    @field_validator("name")
    @classmethod
    def check_name(cls, value: str) -> str:
        return clean_required_text(
            value,
            empty="Укажите ФИО",
            limit=USER_NAME_MAX,
            limit_message=f"ФИО не длиннее {USER_NAME_MAX} символов",
        )

    @field_validator("avatar", mode="before")
    @classmethod
    def empty_avatar(cls, value: object) -> object:
        return blank_to_none(value)

    @field_validator("avatar")
    @classmethod
    def check_avatar(cls, value: str | None) -> str | None:
        return clean_avatar(value)


class PasswordChange(APIModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def check_password(cls, value: str) -> str:
        return clean_password(value)


class RegisterRequest(APIModel):
    email: str
    password: str
    name: str = ""

    @field_validator("email")
    @classmethod
    def check_email(cls, value: str) -> str:
        return clean_email(value)

    @field_validator("password")
    @classmethod
    def check_password(cls, value: str) -> str:
        return clean_password(value)

    @field_validator("name")
    @classmethod
    def check_name(cls, value: str) -> str:
        name = value.strip()
        if len(name) > USER_NAME_MAX:
            raise ValueError(f"Имя не длиннее {USER_NAME_MAX} символов")
        return name


class LoginRequest(APIModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def check_email(cls, value: str) -> str:
        return clean_email(value)

    @field_validator("password")
    @classmethod
    def check_password(cls, value: str) -> str:
        return clean_password(value)


class AuthRead(APIModel):
    access_token: str
    user: UserRead
