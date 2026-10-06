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
EMAIL_MAX = 254
PASSWORD_MIN = 8
PASSWORD_MAX = 72
USER_NAME_MAX = 80

STARTER_GROUPS = (
    {"name": "Личное", "color": GROUP_COLORS[0]},
    {"name": "Работа", "color": GROUP_COLORS[1]},
    {"name": "Здоровье", "color": GROUP_COLORS[2]},
)
