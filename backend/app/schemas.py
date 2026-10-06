from datetime import date as Date
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, field_validator
from pydantic.alias_generators import to_camel

from app.constants import (
    GROUP_COLOR_SET,
    GROUP_NAME_MAX,
    TASK_NOTE_MAX,
    TASK_TITLE_MAX,
    THOUGHT_MAX,
)
from app.support import to_utc_iso

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


class TaskCreate(APIModel):
    title: str
    note: str = ""
    date: Date
    group_id: str | None = None

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
            limit_message=f"Пометка не длиннее {TASK_NOTE_MAX} символов",
        )
        return text or ""

    @field_validator("group_id", mode="before")
    @classmethod
    def empty_group(cls, value: object) -> object:
        return blank_to_none(value)


class TaskUpdate(APIModel):
    title: str | None = None
    note: str | None = None
    date: Date | None = None
    group_id: str | None = None
    completed: bool | None = None

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
            limit_message=f"Пометка не длиннее {TASK_NOTE_MAX} символов",
        )

    @field_validator("group_id", mode="before")
    @classmethod
    def empty_group(cls, value: object) -> object:
        return blank_to_none(value)


class TaskRead(APIModel):
    id: str
    title: str
    note: str
    date: Date
    group_id: str | None
    completed: bool
    created_at: UtcDateTime
    updated_at: UtcDateTime


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
