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
    assert client.get("/api/users", params={"q": "аня"}).status_code == 401
    assert client.patch("/api/auth/me", json={"name": "Аня"}).status_code == 401
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


def test_task_subtasks_and_progress_fields(client):
    _, headers = register(client)
    created = client.post(
        "/api/tasks",
        headers=headers,
        json={
            "title": "Собрать отчёт",
            "note": "К вечеру",
            "date": "2026-10-12",
            "subtasks": [
                {"id": "step-1", "title": "  Цифры  ", "completed": False},
                {"title": "черновик", "completed": True},
            ],
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["note"] == "К вечеру"
    assert body["subtasks"][0] == {"id": "step-1", "title": "Цифры", "completed": False}
    assert body["subtasks"][1]["title"] == "черновик"
    assert body["subtasks"][1]["completed"] is True
    assert body["subtasks"][1]["id"]
    task_id = body["id"]

    plain = client.post(
        "/api/tasks",
        headers=headers,
        json={"title": "Без пунктов", "date": "2026-10-12"},
    )
    assert plain.status_code == 201
    assert plain.json()["subtasks"] == []

    toggled = client.patch(
        f"/api/tasks/{task_id}",
        headers=headers,
        json={
            "subtasks": [
                {"id": "step-1", "title": "Цифры", "completed": True},
                    {"id": body["subtasks"][1]["id"], "title": "черновик", "completed": True},
            ]
        },
    )
    assert toggled.status_code == 200
    assert [item["completed"] for item in toggled.json()["subtasks"]] == [True, True]

    found = client.get("/api/tasks", headers=headers, params={"q": "черновик"})
    assert [item["title"] for item in found.json()] == ["Собрать отчёт"]

    empty = client.post(
        "/api/tasks",
        headers=headers,
        json={"title": "Пустой шаг", "date": "2026-10-12", "subtasks": [{"title": "  "}]},
    )
    assert empty.status_code == 422

    duplicate = client.patch(
        f"/api/tasks/{task_id}",
        headers=headers,
        json={
            "subtasks": [
                {"id": "same", "title": "Один", "completed": False},
                {"id": "same", "title": "Два", "completed": False},
            ]
        },
    )
    assert duplicate.status_code == 422


def test_transfer_task_copies_missing_group(client):
    _, anya = register(client)
    boris_account, boris = register(client, email="boris@example.com", name="Борис")
    boris_id = boris_account["user"]["id"]

    created_group = client.post(
        "/api/groups",
        headers=anya,
        json={"name": "Проект", "color": "#8a6aad"},
    )
    assert created_group.status_code == 201
    group = created_group.json()

    task = client.post(
        "/api/tasks",
        headers=anya,
        json={
            "title": "Сдать макет",
            "note": "к пятнице",
            "date": "2026-10-13",
            "groupId": group["id"],
            "subtasks": [{"title": "черновик", "completed": True}],
        },
    )
    assert task.status_code == 201
    task_id = task.json()["id"]
    toggled = client.post(f"/api/tasks/{task_id}/toggle", headers=anya)
    assert toggled.status_code == 200

    moved = client.post(
        f"/api/tasks/{task_id}/transfer",
        headers=anya,
        json={"userId": boris_id},
    )
    assert moved.status_code == 200, moved.text
    body = moved.json()
    assert body["id"] == task_id
    assert body["title"] == "Сдать макет"
    assert body["note"] == "к пятнице"
    assert body["date"] == "2026-10-13"
    assert body["completed"] is True
    assert body["subtasks"][0]["title"] == "черновик"
    assert body["groupId"] != group["id"]

    assert client.get(f"/api/tasks/{task_id}", headers=anya).status_code == 404
    assert client.get("/api/tasks", headers=anya).json() == []
    assert client.get(f"/api/groups/{group['id']}", headers=anya).status_code == 200

    received = client.get(f"/api/tasks/{task_id}", headers=boris)
    assert received.status_code == 200
    assert received.json()["groupId"] == body["groupId"]

    copied = next(item for item in client.get("/api/groups", headers=boris).json() if item["name"] == "Проект")
    assert copied["id"] == body["groupId"]
    assert copied["color"] == "#8a6aad"


def test_transfer_reuses_group_and_rejects_bad_targets(client):
    anya_account, anya = register(client)
    boris_account, boris = register(client, email="boris@example.com", name="Борис")
    anya_id = anya_account["user"]["id"]
    boris_id = boris_account["user"]["id"]
    home = client.post(
        "/api/groups",
        headers=boris,
        json={"name": "дом", "color": "#b08968"},
    )
    assert home.status_code == 201
    boris_home = home.json()["id"]
    anya_home = client.post(
        "/api/groups",
        headers=anya,
        json={"name": "Дом", "color": "#4f8f8b"},
    )
    assert anya_home.status_code == 201
    before = len(client.get("/api/groups", headers=boris).json())

    named = client.post(
        "/api/tasks",
        headers=anya,
        json={"title": "Полить цветы", "date": "2026-10-13", "groupId": anya_home.json()["id"]},
    )
    assert named.status_code == 201
    moved = client.post(
        f"/api/tasks/{named.json()['id']}/transfer",
        headers=anya,
        json={"userId": boris_id},
    )
    assert moved.status_code == 200
    assert moved.json()["groupId"] == boris_home
    assert len(client.get("/api/groups", headers=boris).json()) == before
    assert client.get(f"/api/groups/{boris_home}", headers=boris).json()["color"] == "#b08968"

    plain = client.post(
        "/api/tasks",
        headers=anya,
        json={"title": "Без группы", "date": "2026-10-13"},
    )
    assert plain.status_code == 201
    plain_id = plain.json()["id"]
    moved_plain = client.post(
        f"/api/tasks/{plain_id}/transfer",
        headers=anya,
        json={"userId": boris_id},
    )
    assert moved_plain.status_code == 200
    assert moved_plain.json()["groupId"] is None
    assert len(client.get("/api/groups", headers=boris).json()) == before

    own = client.post(
        "/api/tasks",
        headers=anya,
        json={"title": "Себе", "date": "2026-10-13"},
    )
    assert own.status_code == 201
    own_id = own.json()["id"]
    self_move = client.post(
        f"/api/tasks/{own_id}/transfer",
        headers=anya,
        json={"userId": anya_id},
    )
    assert self_move.status_code == 422
    assert "себе" in self_move.text

    missing_user = client.post(
        f"/api/tasks/{own_id}/transfer",
        headers=anya,
        json={"userId": "missing"},
    )
    assert missing_user.status_code == 404

    foreign = client.post(
        f"/api/tasks/{plain_id}/transfer",
        headers=anya,
        json={"userId": boris_id},
    )
    assert foreign.status_code == 404

    assert (
        client.post(
            f"/api/tasks/{own_id}/transfer",
            json={"userId": boris_id},
        ).status_code
        == 401
    )

    work = group_id(client, anya, "Работа")
    starter = client.post(
        "/api/tasks",
        headers=anya,
        json={"title": "Созвон", "date": "2026-10-13", "groupId": work},
    )
    assert starter.status_code == 201
    reused = client.post(
        f"/api/tasks/{starter.json()['id']}/transfer",
        headers=anya,
        json={"userId": boris_id},
    )
    assert reused.status_code == 200
    assert reused.json()["groupId"] == group_id(client, boris, "Работа")
    assert len(client.get("/api/groups", headers=boris).json()) == before


def test_profile_search_and_password(client):
    anya_account, anya = register(client, name="Аня")
    boris_account, boris = register(client, email="boris@example.com", name="Борис Петров")
    assert anya_account["user"]["avatar"] is None
    photo = "data:image/jpeg;base64,aaaa"

    updated = client.patch(
        "/api/auth/me",
        headers=boris,
        json={"name": "  Борис Петров  ", "avatar": photo},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["name"] == "Борис Петров"
    assert updated.json()["avatar"] == photo
    assert "password" not in updated.json()

    blank = client.patch("/api/auth/me", headers=boris, json={"name": "   ", "avatar": None})
    assert blank.status_code == 422

    bad_photo = client.patch(
        "/api/auth/me",
        headers=boris,
        json={"name": "Борис Петров", "avatar": "https://example.com/a.png"},
    )
    assert bad_photo.status_code == 422

    found = client.get("/api/users", headers=anya, params={"q": "БОР"})
    assert found.status_code == 200
    body = found.json()
    assert [item["name"] for item in body] == ["Борис Петров"]
    assert body[0]["id"] == boris_account["user"]["id"]
    assert body[0]["avatar"] == photo
    assert "email" not in body[0]

    own = client.get("/api/users", headers=anya, params={"q": "аня"})
    assert own.json() == []
    assert client.get("/api/users", headers=anya, params={"q": "   "}).json() == []

    cleared = client.patch(
        "/api/auth/me",
        headers=boris,
        json={"name": "Борис Петров", "avatar": None},
    )
    assert cleared.status_code == 200
    assert cleared.json()["avatar"] is None

    wrong = client.post(
        "/api/auth/password",
        headers=boris,
        json={"currentPassword": "nope", "newPassword": "password456"},
    )
    assert wrong.status_code == 422
    assert "текущий" in wrong.text

    same = client.post(
        "/api/auth/password",
        headers=boris,
        json={"currentPassword": "password123", "newPassword": "password123"},
    )
    assert same.status_code == 422

    short = client.post(
        "/api/auth/password",
        headers=boris,
        json={"currentPassword": "password123", "newPassword": "123"},
    )
    assert short.status_code == 422

    changed = client.post(
        "/api/auth/password",
        headers=boris,
        json={"currentPassword": "password123", "newPassword": "password456"},
    )
    assert changed.status_code == 204
    old = client.post(
        "/api/auth/login",
        json={"email": "boris@example.com", "password": "password123"},
    )
    assert old.status_code == 401
    fresh = client.post(
        "/api/auth/login",
        json={"email": "boris@example.com", "password": "password456"},
    )
    assert fresh.status_code == 200
    assert fresh.json()["user"]["name"] == "Борис Петров"


SUBSCRIPTION = {
    "endpoint": "https://push.example.test/device",
    "keys": {"p256dh": "p256dh-key", "auth": "auth-key"},
}


def enable_vapid(monkeypatch):
    from app.config import get_settings

    monkeypatch.setenv("VAPID_PUBLIC_KEY", "test-public-key")
    monkeypatch.setenv("VAPID_PRIVATE_KEY", "test-private-key")
    monkeypatch.setenv("VAPID_SUBJECT", "mailto:diary@example.com")
    get_settings.cache_clear()


def test_push_subscription_and_transfer_notification(client, monkeypatch):
    import json

    from sqlalchemy import func, select

    from app.database import SessionLocal
    from app.models import PushSubscription

    enable_vapid(monkeypatch)
    sent = []
    monkeypatch.setattr("app.push.webpush", lambda **kwargs: sent.append(kwargs))

    assert client.get("/api/push/vapid").status_code == 401
    assert client.put("/api/push/subscription", json=SUBSCRIPTION).status_code == 401

    anya_account, anya = register(client)
    boris_account, boris = register(client, email="boris@example.com", name="Борис")

    vapid = client.get("/api/push/vapid", headers=boris)
    assert vapid.status_code == 200
    assert vapid.json() == {"publicKey": "test-public-key"}

    insecure = client.put(
        "/api/push/subscription",
        headers=boris,
        json={"endpoint": "http://push.example.test/device", "keys": SUBSCRIPTION["keys"]},
    )
    assert insecure.status_code == 422

    saved = client.put("/api/push/subscription", headers=boris, json=SUBSCRIPTION)
    assert saved.status_code == 204
    updated = client.put(
        "/api/push/subscription",
        headers=boris,
        json={
            "endpoint": SUBSCRIPTION["endpoint"],
            "keys": {"p256dh": "next-p256", "auth": "next-auth"},
        },
    )
    assert updated.status_code == 204

    task = client.post(
        "/api/tasks",
        headers=anya,
        json={"title": "Сдать макет", "date": "2026-10-13"},
    )
    assert task.status_code == 201
    task_id = task.json()["id"]
    moved = client.post(
        f"/api/tasks/{task_id}/transfer",
        headers=anya,
        json={"userId": boris_account["user"]["id"]},
    )
    assert moved.status_code == 200
    assert len(sent) == 1
    assert sent[0]["subscription_info"] == {
        "endpoint": SUBSCRIPTION["endpoint"],
        "keys": {"p256dh": "next-p256", "auth": "next-auth"},
    }
    assert json.loads(sent[0]["data"]) == {
        "title": "Новое дело",
        "body": "Аня: Сдать макет",
        "url": "/?date=2026-10-13",
        "date": "2026-10-13",
        "tag": f"task-{task_id}",
    }
    assert sent[0]["vapid_claims"] == {"sub": "mailto:diary@example.com"}

    taken = client.put(
        "/api/push/subscription",
        headers=anya,
        json={
            "endpoint": SUBSCRIPTION["endpoint"],
            "keys": {"p256dh": "anya-p256", "auth": "anya-auth"},
        },
    )
    assert taken.status_code == 204
    sent.clear()
    reply = client.post(
        "/api/tasks",
        headers=boris,
        json={"title": "Обратно", "date": "2026-10-14"},
    )
    assert reply.status_code == 201
    back = client.post(
        f"/api/tasks/{reply.json()['id']}/transfer",
        headers=boris,
        json={"userId": anya_account["user"]["id"]},
    )
    assert back.status_code == 200
    assert len(sent) == 1
    assert json.loads(sent[0]["data"])["body"] == "Борис: Обратно"

    ignored = client.request(
        "DELETE",
        "/api/push/subscription",
        headers=boris,
        json={"endpoint": SUBSCRIPTION["endpoint"]},
    )
    assert ignored.status_code == 204
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(PushSubscription)) == 1

    removed = client.request(
        "DELETE",
        "/api/push/subscription",
        headers=anya,
        json={"endpoint": SUBSCRIPTION["endpoint"]},
    )
    assert removed.status_code == 204
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(PushSubscription)) == 0


def test_push_drops_expired_subscription_and_skips_without_keys(client, monkeypatch):
    from pywebpush import WebPushException
    from sqlalchemy import func, select

    from app.config import get_settings
    from app.database import SessionLocal
    from app.models import PushSubscription

    enable_vapid(monkeypatch)

    class Gone:
        status_code = 410

    def expired(**_kwargs):
        raise WebPushException("gone", response=Gone())

    monkeypatch.setattr("app.push.webpush", expired)
    anya_account, anya = register(client)
    boris_account, boris = register(client, email="boris@example.com", name="Борис")
    assert client.put("/api/push/subscription", headers=boris, json=SUBSCRIPTION).status_code == 204
    task = client.post("/api/tasks", headers=anya, json={"title": "Просрочено", "date": "2026-10-13"})
    moved = client.post(
        f"/api/tasks/{task.json()['id']}/transfer",
        headers=anya,
        json={"userId": boris_account["user"]["id"]},
    )
    assert moved.status_code == 200
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(PushSubscription)) == 0

    monkeypatch.setenv("VAPID_PUBLIC_KEY", "")
    monkeypatch.setenv("VAPID_PRIVATE_KEY", "")
    get_settings.cache_clear()
    called = []
    monkeypatch.setattr("app.push.webpush", lambda **kwargs: called.append(kwargs))
    assert client.put("/api/push/subscription", headers=anya, json=SUBSCRIPTION).status_code == 204
    another = client.post(
        "/api/tasks",
        headers=boris,
        json={"title": "Без ключа", "date": "2026-10-14"},
    )
    quiet = client.post(
        f"/api/tasks/{another.json()['id']}/transfer",
        headers=boris,
        json={"userId": anya_account["user"]["id"]},
    )
    assert quiet.status_code == 200
    assert called == []
    assert client.get("/api/push/vapid", headers=anya).status_code == 404


def test_transfer_tells_open_diary(client, monkeypatch):
    events = []
    monkeypatch.setattr(
        "app.routers.tasks.publish",
        lambda user_id, event: events.append((user_id, event)),
    )
    anya_account, anya = register(client)
    boris_account, boris = register(client, email="boris@example.com", name="Борис")
    assert client.get("/api/events").status_code == 404

    task = client.post(
        "/api/tasks",
        headers=anya,
        json={"title": "Сдать макет", "date": "2026-10-13"},
    )
    assert task.status_code == 201
    task_id = task.json()["id"]
    moved = client.post(
        f"/api/tasks/{task_id}/transfer",
        headers=anya,
        json={"userId": boris_account["user"]["id"]},
    )
    assert moved.status_code == 200
    assert events == [
        (anya_account["user"]["id"], {"type": "diary"}),
        (boris_account["user"]["id"], {"type": "task", "date": "2026-10-13", "taskId": task_id}),
        (anya_account["user"]["id"], {"type": "diary"}),
    ]


def test_group_change_tells_open_diary(client, monkeypatch):
    events = []
    monkeypatch.setattr(
        "app.routers.groups.publish",
        lambda user_id, event: events.append((user_id, event)),
    )
    account, headers = register(client)
    created = client.post("/api/groups", headers=headers, json={"name": "Сад", "color": "#3e6b56"})
    assert created.status_code == 201
    assert events == [(account["user"]["id"], {"type": "diary"})]


def test_socket_rejects_bad_token(client):
    from starlette.websockets import WebSocketDisconnect

    with client.websocket_connect("/api/ws") as socket:
        socket.send_json({"type": "auth", "token": "bad"})
        try:
            socket.receive_json()
        except WebSocketDisconnect as error:
            assert error.code == 4401
            return
    raise AssertionError("сокет принял чужой токен")


def test_socket_receives_diary_event(client):
    from app.live import publish

    account, _headers = register(client)
    with client.websocket_connect("/api/ws") as socket:
        socket.send_json({"type": "auth", "token": account["accessToken"]})
        assert socket.receive_json() == {"type": "ready"}
        publish(account["user"]["id"], {"type": "task", "date": "2026-10-13", "taskId": "abc"})
        assert socket.receive_json() == {"type": "task", "date": "2026-10-13", "taskId": "abc"}
        publish(account["user"]["id"], {"type": "diary"})
        assert socket.receive_json() == {"type": "diary"}


def test_publish_reaches_subscriber():
    import asyncio

    from app.live import bind_loop, publish, subscription

    async def run():
        bind_loop(asyncio.get_running_loop())
        try:
            async with subscription("user-1") as queue:
                publish("user-1", {"type": "diary"})
                event = await asyncio.wait_for(queue.get(), timeout=1)
                assert event == {"type": "diary"}
        finally:
            bind_loop(None)

    asyncio.run(run())


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
