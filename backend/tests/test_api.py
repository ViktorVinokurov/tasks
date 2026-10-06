def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_seed_groups(client):
    response = client.get("/api/groups")
    assert response.status_code == 200
    body = response.json()
    assert [group["name"] for group in body] == ["Личное", "Работа", "Здоровье"]
    assert body[0]["id"] == "personal"
    assert body[0]["createdAt"].endswith("Z")


def test_group_crud_detaches_tasks(client):
    created = client.post("/api/groups", json={"name": "  Дом  ", "color": "#8A6AAD"})
    assert created.status_code == 201
    group = created.json()
    assert group["name"] == "Дом"
    assert group["color"] == "#8a6aad"

    task = client.post(
        "/api/tasks",
        json={"title": "Полить цветы", "note": "", "date": "2026-10-06", "groupId": group["id"]},
    )
    assert task.status_code == 201
    task_id = task.json()["id"]

    renamed = client.patch(
        f"/api/groups/{group['id']}",
        json={"name": "Квартира", "color": "#4f8f8b"},
    )
    assert renamed.status_code == 200
    assert renamed.json()["name"] == "Квартира"

    deleted = client.delete(f"/api/groups/{group['id']}")
    assert deleted.status_code == 204
    assert client.get(f"/api/groups/{group['id']}").status_code == 404

    stored = client.get(f"/api/tasks/{task_id}")
    assert stored.status_code == 200
    assert stored.json()["groupId"] is None


def test_reject_unknown_color_and_blank_name(client):
    color = client.post("/api/groups", json={"name": "Сад", "color": "#000000"})
    assert color.status_code == 422
    assert "палитры" in color.text

    blank = client.post("/api/groups", json={"name": "   ", "color": "#3e6b56"})
    assert blank.status_code == 422
    assert "имя" in blank.text


def test_task_filters_update_and_order(client):
    first = client.post(
        "/api/tasks",
        json={
            "title": "Купить молоко",
            "note": "2 литра",
            "date": "2026-10-06",
            "groupId": "personal",
        },
    )
    second = client.post(
        "/api/tasks",
        json={"title": "Отчёт", "note": "цифры", "date": "2026-10-06", "groupId": "work"},
    )
    other_day = client.post(
        "/api/tasks",
        json={"title": "Купить хлеб", "note": "", "date": "2026-10-07", "groupId": None},
    )
    assert first.status_code == second.status_code == other_day.status_code == 201
    first_id = first.json()["id"]

    day = client.get("/api/tasks", params={"date": "2026-10-06"})
    assert [item["title"] for item in day.json()] == ["Купить молоко", "Отчёт"]

    toggled = client.post(f"/api/tasks/{first_id}/toggle")
    assert toggled.status_code == 200
    assert toggled.json()["completed"] is True

    ordered = client.get("/api/tasks", params={"date": "2026-10-06"})
    assert [item["title"] for item in ordered.json()] == ["Отчёт", "Купить молоко"]

    active = client.get("/api/tasks", params={"status": "active"})
    assert {item["title"] for item in active.json()} == {"Отчёт", "Купить хлеб"}

    personal = client.get("/api/tasks", params={"groupId": "personal"})
    assert [item["title"] for item in personal.json()] == ["Купить молоко"]

    ungrouped = client.get("/api/tasks", params={"groupId": "none"})
    assert [item["title"] for item in ungrouped.json()] == ["Купить хлеб"]

    found = client.get("/api/tasks", params={"q": "МОЛОКО"})
    assert [item["title"] for item in found.json()] == ["Купить молоко"]

    escaped = client.get("/api/tasks", params={"q": "%"})
    assert escaped.json() == []

    updated = client.patch(
        f"/api/tasks/{first_id}",
        json={"title": "Купить кефир", "note": "1%", "groupId": None, "completed": False},
    )
    assert updated.status_code == 200
    body = updated.json()
    assert body["title"] == "Купить кефир"
    assert body["note"] == "1%"
    assert body["groupId"] is None
    assert body["completed"] is False

    missing = client.patch("/api/tasks/missing", json={"title": "Нет"})
    assert missing.status_code == 404

    unknown_group = client.post(
        "/api/tasks",
        json={"title": "Сад", "date": "2026-10-06", "groupId": "missing"},
    )
    assert unknown_group.status_code == 422

    removed = client.delete(f"/api/tasks/{first_id}")
    assert removed.status_code == 204
    assert client.get(f"/api/tasks/{first_id}").status_code == 404


def test_thoughts_by_date(client):
    earlier = client.post("/api/thoughts", json={"text": "  Утро было тихим  ", "date": "2026-10-06"})
    later = client.post("/api/thoughts", json={"text": "Вечером дождь", "date": "2026-10-06"})
    other = client.post("/api/thoughts", json={"text": "Другой день", "date": "2026-10-08"})
    assert earlier.status_code == later.status_code == other.status_code == 201
    thought_id = earlier.json()["id"]
    assert earlier.json()["text"] == "Утро было тихим"

    listed = client.get("/api/thoughts", params={"date": "2026-10-06"})
    assert [item["text"] for item in listed.json()] == ["Утро было тихим", "Вечером дождь"]

    blank = client.patch(f"/api/thoughts/{thought_id}", json={"text": "   "})
    assert blank.status_code == 422

    changed = client.patch(f"/api/thoughts/{thought_id}", json={"text": "Утро было ясным"})
    assert changed.status_code == 200
    assert changed.json()["text"] == "Утро было ясным"

    removed = client.delete(f"/api/thoughts/{thought_id}")
    assert removed.status_code == 204
    assert client.get(f"/api/thoughts/{thought_id}").status_code == 404


def test_alembic_upgrade(tmp_path, monkeypatch):
    from alembic import command
    from alembic.config import Config

    from app.config import get_settings

    url = f"sqlite+pysqlite:///{tmp_path / 'migrated.db'}"
    monkeypatch.setenv("DATABASE_URL", url)
    get_settings.cache_clear()

    cfg = Config("alembic.ini")
    command.upgrade(cfg, "head")
    command.downgrade(cfg, "base")
    command.upgrade(cfg, "head")

    get_settings.cache_clear()
