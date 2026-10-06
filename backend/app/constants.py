from datetime import datetime, timezone

GROUP_COLORS = (
    "#3e6b56",
    "#d08a4c",
    "#6a8caf",
    "#c46b7a",
    "#8a6aad",
    "#4f8f8b",
    "#c47b4a",
    "#b08968",
)

GROUP_COLOR_SET = frozenset(GROUP_COLORS)

TASK_TITLE_MAX = 180
TASK_NOTE_MAX = 2000
THOUGHT_MAX = 4000
GROUP_NAME_MAX = 40

INITIAL_GROUPS = (
    {
        "id": "personal",
        "name": "Личное",
        "color": GROUP_COLORS[0],
        "created_at": datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
    },
    {
        "id": "work",
        "name": "Работа",
        "color": GROUP_COLORS[1],
        "created_at": datetime(2026, 1, 1, 0, 0, 1, tzinfo=timezone.utc),
    },
    {
        "id": "health",
        "name": "Здоровье",
        "color": GROUP_COLORS[2],
        "created_at": datetime(2026, 1, 1, 0, 0, 2, tzinfo=timezone.utc),
    },
)
