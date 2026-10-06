# API ежедневника

Сервис на Python принимает дела, мысли и группы и хранит их в PostgreSQL. Каждая запись принадлежит пользователю. Без входа дневник не отдаётся.

Экраны Next.js ходят в этот API. Браузер вызывает `/api` на сайте, Next.js пересылает запрос сюда. Порт API по-прежнему не открывают в интернет: снаружи достаточно сайта.

Описание запросов также доступно в браузере: [http://localhost:8000/docs](http://localhost:8000/docs).

## Стек

- Python 3.12
- FastAPI и Uvicorn
- SQLAlchemy 2 и Alembic
- PostgreSQL 17
- драйвер psycopg

## Данные

Четыре таблицы.

**users** — аккаунты: почта, хэш пароля, имя.

**groups** — группы пользователя. При регистрации появляются три записи: Личное, Работа, Здоровье. Идентификаторы свои у каждого аккаунта.

**tasks** — дела пользователя. Поля: название, пометка, дата дня, группа или пусто, признак выполнения, время создания и изменения. Удаление группы оставляет дело и обнуляет `groupId`.

**thoughts** — мысли пользователя: текст, дата, время создания и изменения.

Даты дня приходят и уходят как `ГГГГ-ММ-ДД`. Время — в UTC, строкой с суффиксом `Z`. Имена полей в JSON — camelCase, как в интерфейсе: `groupId`, `createdAt`, `updatedAt`.

Длины совпадают с интерфейсом: название дела 180, пометка 2000, мысль 4000, имя группы 40. Цвет группы — один из `#3e6b56`, `#d08a4c`, `#6a8caf`, `#c46b7a`, `#8a6aad`, `#4f8f8b`, `#c47b4a`, `#b08968`.

## Запросы

| Метод | Путь | Что делает |
| --- | --- | --- |
| GET | `/health` | Проверка, что процесс отвечает |
| POST | `/api/auth/register` | Аккаунт: `email`, `password`, необязательное `name`. В ответе токен и три группы уже созданы |
| POST | `/api/auth/login` | Вход: `email`, `password`. В ответе `accessToken` и пользователь |
| GET | `/api/auth/me` | Текущий пользователь |
| GET | `/api/groups` | Группы текущего пользователя |
| POST | `/api/groups` | Новая группа: `name`, `color` |
| GET | `/api/groups/{id}` | Одна группа |
| PATCH | `/api/groups/{id}` | Новые `name` и `color` |
| DELETE | `/api/groups/{id}` | Удаляет группу и снимает её с дел |
| GET | `/api/tasks` | Дела с фильтрами |
| POST | `/api/tasks` | Новое дело |
| GET | `/api/tasks/{id}` | Одно дело |
| PATCH | `/api/tasks/{id}` | Изменить переданные поля |
| POST | `/api/tasks/{id}/toggle` | Переключить «выполнено» |
| DELETE | `/api/tasks/{id}` | Удалить дело |
| GET | `/api/thoughts` | Мысли, можно сузить по дню |
| POST | `/api/thoughts` | Новая мысль |
| GET | `/api/thoughts/{id}` | Одна мысль |
| PATCH | `/api/thoughts/{id}` | Новый текст |
| DELETE | `/api/thoughts/{id}` | Удалить мысль |

Фильтры `GET /api/tasks`:

- `date` — только этот день
- `status` — `all` (по умолчанию), `active` или `completed`
- `groupId` — идентификатор группы, `all` или пусто без фильтра, `none` для дел без группы
- `q` — поиск по названию и пометке, без учёта регистра

`GET /api/thoughts?date=2026-10-06` возвращает мысли этого дня, от ранней к поздней.

Дела в ответе идут так: сначала невыполненные, затем выполненные; внутри группы — по времени создания.

Пустое название, пустая мысль, неизвестная группа и цвет вне палитры отвечают `422`. Неизвестный идентификатор и чужая запись — `404`. Запросы дневника без заголовка `Authorization: Bearer …` отвечают `401`. Повторная почта при регистрации — `409`. Пароль короче 8 символов — `422`.

Пример. Зарегистрироваться, создать дело и забрать дела одного дня:

```bash
token=$(curl -s -X POST http://127.0.0.1:8000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"anya@example.com","password":"password123","name":"Аня"}' \
  | python -c 'import json,sys; print(json.load(sys.stdin)["accessToken"])')

curl -s -X POST http://127.0.0.1:8000/api/tasks \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Купить молоко","note":"2 литра","date":"2026-10-06"}'

curl -s -H "Authorization: Bearer $token" \
  'http://127.0.0.1:8000/api/tasks?date=2026-10-06&status=active&q=молоко'
```

## Переменные окружения

| Переменная | Зачем | Пример |
| --- | --- | --- |
| `DATABASE_URL` | Строка SQLAlchemy | `postgresql+psycopg://diary:secret@127.0.0.1:5432/diary` |
| `CORS_ORIGINS` | Разрешённые источники через запятую | `http://localhost:3000` |
| `JWT_SECRET` | Секрет подписи сессии. На сервере — длинная случайная строка | `change-me-to-a-long-random-string` |
| `JWT_TTL_DAYS` | Сколько дней действует вход | `30` |

Пароль в `DATABASE_URL` лучше без символов `@`, `:`, `/`, `#` и `%`: они ломают разбор строки.

Для Docker Compose те же значения задаются в файле `.env` в корне репозитория. Образец — `.env.example`. Для запуска API прямо на машине образец лежит в `backend/.env.example`, его копируют в `backend/.env`.

## Локальный запуск

Из корня репозитория, вместе с интерфейсом и базой:

```bash
cp .env.example .env
docker compose up --build
```

- интерфейс: [http://localhost:3000](http://localhost:3000)
- API: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- описание запросов: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

API и PostgreSQL в этом Compose слушают только `127.0.0.1`. С другой машины к ним заходят через SSH-туннель или через nginx на этом же сервере.

В `.env` замените `POSTGRES_PASSWORD=change-me` на свой пароль до первого запуска. Том базы запоминает пароль первого старта; смена пароля в `.env` после этого сам пароль внутри PostgreSQL не обновляет.

Без Docker, если PostgreSQL уже установлен и база `diary` создана:

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Проверки:

```bash
cd backend
source .venv/bin/activate
pytest
```

## Настройка на сервере

Подойдёт VPS с Ubuntu 24.04, Docker и Docker Compose. Ниже два варианта: весь стек в Compose и установка API службой systemd, если база уже есть на сервере.

Порты `8000` и `5432` не открывают в файрволе. Наружу смотрит сайт: браузер ходит в `/api` на том же адресе, а Next.js изнутри обращается к API. `JWT_SECRET` в `.env` задайте до запуска, иначе сессии можно подделать.

Пароль базы придумайте длинный и положите его только в `.env`. Файл `.env` не коммитят.

Обычная выкладка на VPS с Docker идёт из GitHub Actions: на сервере нужны Docker и файл `.env` в `/opt/ezhednevnik`. Секреты и SSH-ключ описаны в [README.md](../README.md) в корне. Ниже — ручная установка.

### Вариант 1. Docker Compose

На сервере:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker "$USER"
```

После `usermod` зайдите в систему ещё раз, чтобы группа `docker` применилась.

```bash
sudo mkdir -p /opt/ezhednevnik
sudo chown "$USER" /opt/ezhednevnik
git clone <адрес-репозитория> /opt/ezhednevnik
cd /opt/ezhednevnik
cp .env.example .env
```

В `.env` задайте пароль, секрет сессий и, когда появится домен интерфейса, источник для CORS:

```bash
POSTGRES_USER=diary
POSTGRES_PASSWORD=длинный-пароль
POSTGRES_DB=diary
CORS_ORIGINS=https://diary.example.com
JWT_SECRET=длинная-случайная-строка
```

Запуск:

```bash
docker compose up --build -d
docker compose ps
curl -s http://127.0.0.1:8000/health
```

Ответ `{"status":"ok"}` значит, что API поднялся и миграции прошли: контейнер API перед стартом выполняет `alembic upgrade head`.

Обновление этой ручной установки:

```bash
cd /opt/ezhednevnik
git pull
docker compose up --build -d
```

Данные остаются в томе `pgdata`. `docker compose down` том не удаляет. `docker compose down -v` удаляет том вместе с записями — так не делают на сервере с дневником.

### Вариант 2. PostgreSQL, systemd и nginx

Если Docker не нужен, поставьте базу и API отдельно. Интерфейс можно по-прежнему собрать своим `docker compose` только для сервиса `web` или через `npm run build` из каталога `client`.

PostgreSQL:

```bash
sudo apt update
sudo apt install -y postgresql python3.12 python3.12-venv git nginx
sudo -u postgres psql -c "CREATE USER diary WITH PASSWORD 'длинный-пароль';"
sudo -u postgres psql -c "CREATE DATABASE diary OWNER diary;"
```

Код и виртуальное окружение:

```bash
sudo mkdir -p /opt/ezhednevnik
sudo chown "$USER" /opt/ezhednevnik
git clone <адрес-репозитория> /opt/ezhednevnik
cd /opt/ezhednevnik/backend
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
```

В `backend/.env`:

```bash
DATABASE_URL=postgresql+psycopg://diary:длинный-пароль@127.0.0.1:5432/diary
CORS_ORIGINS=https://diary.example.com
JWT_SECRET=длинная-случайная-строка
```

```bash
chmod 600 .env
.venv/bin/alembic upgrade head
```

Служба `/etc/systemd/system/ezhednevnik-api.service`:

```ini
[Unit]
Description=Ежедневник API
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/ezhednevnik/backend
EnvironmentFile=/opt/ezhednevnik/backend/.env
ExecStart=/opt/ezhednevnik/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Каталогу нужен доступ пользователя службы:

```bash
sudo chown -R www-data:www-data /opt/ezhednevnik
sudo systemctl daemon-reload
sudo systemctl enable --now ezhednevnik-api
curl -s http://127.0.0.1:8000/health
```

Nginx, файл `/etc/nginx/sites-available/ezhednevnik`:

```nginx
server {
    listen 80;
    server_name diary.example.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Блок `location /api/` нужен, если nginx стоит перед интерфейсом и API. Когда сайт отдаёт сам Next.js, браузер и так ходит в `/api` на порту интерфейса, а контейнер пересылает запрос в API.

```bash
sudo ln -s /etc/nginx/sites-available/ezhednevnik /etc/nginx/sites-enabled/ezhednevnik
sudo nginx -t
sudo systemctl reload nginx
```

Сертификат для HTTPS: `sudo apt install -y certbot python3-certbot-nginx` и `sudo certbot --nginx -d diary.example.com`.

Обновление этого варианта:

```bash
cd /opt/ezhednevnik
git pull
cd backend
.venv/bin/pip install -r requirements.txt
.venv/bin/alembic upgrade head
sudo systemctl restart ezhednevnik-api
```

### Миграции

Схема лежит в `backend/alembic/versions`. Накатить её:

```bash
cd backend
alembic upgrade head
```

В контейнере это делает `entrypoint.sh` при каждом старте. Повторный запуск уже применённую миграцию не повторяет.

Новая миграция после изменения моделей, из каталога `backend` с заполненным `.env`:

```bash
alembic revision --autogenerate -m "описание"
alembic upgrade head
```

Файл в `alembic/versions` просматривают перед применением: автогенерация иногда предлагает лишнее.

### Резервная копия

Compose, с машины, где крутится база:

```bash
cd /opt/ezhednevnik
docker compose exec -T db pg_dump -U diary diary > "diary-$(date +%F).sql"
```

Пользователь и база — те, что в `.env`.

Без Docker:

```bash
pg_dump -U diary -h 127.0.0.1 diary > "diary-$(date +%F).sql"
```

Восстановление в пустую базу:

```bash
psql -U diary -h 127.0.0.1 -d diary < diary-2026-10-06.sql
```

Для Compose ту же команду запускают через `docker compose exec -T db psql -U diary -d diary`.

### Проверка после настройки

```bash
curl -s http://127.0.0.1:8000/health
```

Ответ `{"status":"ok"}` значит, что API поднялся. Группы появляются после регистрации, запрос из раздела «Запросы».
