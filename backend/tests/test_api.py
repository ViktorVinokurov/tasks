def register(client, email="anya@example.com", password="password123", name="Аня"):
    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "name": name},
    )
    assert response.status_code == 201, response.text
    body = response.json()
    return body, {"Authorization": f"Bearer {body['accessToken']}"}


def group_id(client, headers, name):
    groups = client.get("/api/groups", headers=headers).json()
    return next(item["id"] for item in groups if item["name"] == name)


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_diary_requires_login(client):
    assert client.get("/api/groups").status_code == 401
    assert client.get("/api/tasks").status_code == 401
    assert client.get("/api/thoughts").status_code == 401
    assert client.post("/api/tasks", json={"title": "Скрытое", "date": "2026-10-06"}).status_code == 401


def test_register_login_and_starter_groups(client):
    created, headers = register(client, email="Anya@Example.com", name="  ")
    assert created["user"]["email"] == "anya@example.com"
    assert created["user"]["name"] == "anya"
    assert created["accessToken"]

    me = client.get("/api/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["id"] == created["user"]["id"]

    groups = client.get("/api/groups", headers=headers)
    assert groups.status_code == 200
    body = groups.json()
    assert [group["name"] for group in body] == ["Личное", "Работа", "Здоровье"]
    assert body[0]["createdAt"].endswith("Z")

    logged = client.post(
        "/api/auth/login",
        json={"email": "ANYA@example.com", "password": "password123"},
    )
    assert logged.status_code == 200
    assert logged.json()["user"]["id"] == created["user"]["id"]

    again = client.post(
        "/api/auth/register",
        json={"email": "anya@example.com", "password": "password123", "name": "Другая"},
    )
    assert again.status_code == 409

    wrong = client.post(
        "/api/auth/login",
        json={"email": "anya@example.com", "password": "password1234"},
    )
    assert wrong.status_code == 401
    assert "пароль" in wrong.text

    short = client.post(
        "/api/auth/register",
        json={"email": "short@example.com", "password": "123", "name": "Я"},
    )
    assert short.status_code == 422


def test_users_do_not_see_each_other(client):
    _, anya = register(client)
    _, boris = register(client, email="boris@example.com", name="Борис")

    personal = group_id(client, anya, "Личное")
    task = client.post(
        "/api/tasks",
        headers=anya,
        json={"title": "Только Аня", "date": "2026-10-06", "groupId": personal},
    )
    assert task.status_code == 201
    task_id = task.json()["id"]

    thought = client.post(
        "/api/thoughts",
        headers=anya,
        json={"text": "Секрет", "date": "2026-10-06"},
    )
    assert thought.status_code == 201
    thought_id = thought.json()["id"]

    assert client.get("/api/tasks", headers=boris).json() == []
    assert client.get("/api/thoughts", headers=boris).json() == []
    assert client.get(f"/api/tasks/{task_id}", headers=boris).status_code == 404
    assert client.get(f"/api/thoughts/{thought_id}", headers=boris).status_code == 404
    assert client.get(f"/api/groups/{personal}", headers=boris).status_code == 404
    stolen = client.post(
        "/api/tasks",
        headers=boris,
        json={"title": "Чужое", "date": "2026-10-06", "groupId": personal},
    )
    assert stolen.status_code == 422

    anya_groups = {item["name"] for item in client.get("/api/groups", headers=anya).json()}
    boris_groups = {item["name"] for item in client.get("/api/groups", headers=boris).json()}
    assert anya_groups == boris_groups == {"Личное", "Работа", "Здоровье"}
    anya_ids = {item["id"] for item in client.get("/api/groups", headers=anya).json()}
    boris_ids = {item["id"] for item in client.get("/api/groups", headers=boris).json()}
    assert anya_ids.isdisjoint(boris_ids)


def test_group_crud_detaches_tasks(client):
    _, headers = register(client)
    created = client.post(
        "/api/groups",
        headers=headers,
        json={"name": "  Дом  ", "color": "#8A6AAD"},
    )
    assert created.status_code == 201
    group = created.json()
    assert group["name"] == "Дом"
    assert group["color"] == "#8a6aad"

    task = client.post(
        "/api/tasks",
        headers=headers,
        json={"title": "Полить цветы", "note": "", "date": "2026-10-06", "groupId": group["id"]},
    )
    assert task.status_code == 201
    task_id = task.json()["id"]

    renamed = client.patch(
        f"/api/groups/{group['id']}",
        headers=headers,
        json={"name": "Квартира", "color": "#4f8f8b"},
    )
    assert renamed.status_code == 200
    assert renamed.json()["name"] == "Квартира"

    deleted = client.delete(f"/api/groups/{group['id']}", headers=headers)
    assert deleted.status_code == 204
    assert client.get(f"/api/groups/{group['id']}", headers=headers).status_code == 404

    stored = client.get(f"/api/tasks/{task_id}", headers=headers)
    assert stored.status_code == 200
    assert stored.json()["groupId"] is None


def test_reject_unknown_color_and_blank_name(client):
    _, headers = register(client)
    color = client.post("/api/groups", headers=headers, json={"name": "Сад", "color": "#000000"})
    assert color.status_code == 422
    assert "палитры" in color.text

    blank = client.post("/api/groups", headers=headers, json={"name": "   ", "color": "#3e6b56"})
    assert blank.status_code == 422
    assert "имя" in blank.text


def test_task_filters_update_and_order(client):
    _, headers = register(client)
    personal = group_id(client, headers, "Личное")
    work = group_id(client, headers, "Работа")
    first = client.post(
        "/api/tasks",
        headers=headers,
        json={
            "title": "Купить молоко",
            "note": "2 литра",
            "date": "2026-10-06",
            "groupId": personal,
        },
    )
    second = client.post(
        "/api/tasks",
        headers=headers,
        json={"title": "Отчёт", "note": "цифры", "date": "2026-10-06", "groupId": work},
    )
    other_day = client.post(
        "/api/tasks",
        headers=headers,
        json={"title": "Купить хлеб", "note": "", "date": "2026-10-07", "groupId": None},
    )
    assert first.status_code == second.status_code == other_day.status_code == 201
    first_id = first.json()["id"]

    day = client.get("/api/tasks", headers=headers, params={"date": "2026-10-06"})
    assert [item["title"] for item in day.json()] == ["Купить молоко", "Отчёт"]

    toggled = client.post(f"/api/tasks/{first_id}/toggle", headers=headers)
    assert toggled.status_code == 200
    assert toggled.json()["completed"] is True

    ordered = client.get("/api/tasks", headers=headers, params={"date": "2026-10-06"})
    assert [item["title"] for item in ordered.json()] == ["Отчёт", "Купить молоко"]

    active = client.get("/api/tasks", headers=headers, params={"status": "active"})
    assert {item["title"] for item in active.json()} == {"Отчёт", "Купить хлеб"}

    personal_tasks = client.get("/api/tasks", headers=headers, params={"groupId": personal})
    assert [item["title"] for item in personal_tasks.json()] == ["Купить молоко"]

    ungrouped = client.get("/api/tasks", headers=headers, params={"groupId": "none"})
    assert [item["title"] for item in ungrouped.json()] == ["Купить хлеб"]

    found = client.get("/api/tasks", headers=headers, params={"q": "МОЛОКО"})
    assert [item["title"] for item in found.json()] == ["Купить молоко"]

    escaped = client.get("/api/tasks", headers=headers, params={"q": "%"})
    assert escaped.json() == []

    updated = client.patch(
        f"/api/tasks/{first_id}",
        headers=headers,
        json={"title": "Купить кефир", "note": "1%", "groupId": None, "completed": False},
    )
    assert updated.status_code == 200
    body = updated.json()
    assert body["title"] == "Купить кефир"
    assert body["note"] == "1%"
    assert body["groupId"] is None
    assert body["completed"] is False

    missing = client.patch("/api/tasks/missing", headers=headers, json={"title": "Нет"})
    assert missing.status_code == 404

    unknown_group = client.post(
        "/api/tasks",
        headers=headers,
        json={"title": "Сад", "date": "2026-10-06", "groupId": "missing"},
    )
    assert unknown_group.status_code == 422

    removed = client.delete(f"/api/tasks/{first_id}", headers=headers)
    assert removed.status_code == 204
    assert client.get(f"/api/tasks/{first_id}", headers=headers).status_code == 404


def test_thoughts_by_date(client):
    _, headers = register(client)
    earlier = client.post(
        "/api/thoughts",
        headers=headers,
        json={"text": "  Утро было тихим  ", "date": "2026-10-06"},
    )
    later = client.post(
        "/api/thoughts",
        headers=headers,
        json={"text": "Вечером дождь", "date": "2026-10-06"},
    )
    other = client.post(
        "/api/thoughts",
        headers=headers,
        json={"text": "Другой день", "date": "2026-10-08"},
    )
    assert earlier.status_code == later.status_code == other.status_code == 201
    thought_id = earlier.json()["id"]
    assert earlier.json()["text"] == "Утро было тихим"

    listed = client.get("/api/thoughts", headers=headers, params={"date": "2026-10-06"})
    assert [item["text"] for item in listed.json()] == ["Утро было тихим", "Вечером дождь"]

    blank = client.patch(f"/api/thoughts/{thought_id}", headers=headers, json={"text": "   "})
    assert blank.status_code == 422

    changed = client.patch(
        f"/api/thoughts/{thought_id}",
        headers=headers,
        json={"text": "Утро было ясным"},
    )
    assert changed.status_code == 200
    assert changed.json()["text"] == "Утро было ясным"

    removed = client.delete(f"/api/thoughts/{thought_id}", headers=headers)
    assert removed.status_code == 204
    assert client.get(f"/api/thoughts/{thought_id}", headers=headers).status_code == 404


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
