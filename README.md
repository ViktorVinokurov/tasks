# Ежедневник

Личный дневник дел и мыслей на день. Вход по почте и паролю: дела, мысли и группы принадлежат аккаунту и лежат в PostgreSQL.

В корне три каталога: `client` — интерфейс, `backend` — API, `docs` — локальное описание проекта (в git не входит).

Интерфейс ходит в API. Как поднять сервис локально и на сервере — в [backend/README.md](backend/README.md).

## Запуск

```bash
cd client
npm install
npm run dev
```

Рядом должен работать API на [http://127.0.0.1:8000](http://127.0.0.1:8000): интерфейс проксирует к нему запросы `/api`. Проще поднять всё сразу через Docker ниже.

Откройте [http://localhost:3000](http://localhost:3000) и создайте аккаунт.

## Проверки

Из каталога `client`:

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

## Docker

Поднимает интерфейс, API и PostgreSQL из корня репозитория:

```bash
cp .env.example .env
docker compose up --build
```

Интерфейс будет на [http://localhost:3000](http://localhost:3000), API — на [http://127.0.0.1:8000](http://127.0.0.1:8000). В `.env` до первого запуска смените `POSTGRES_PASSWORD` и `JWT_SECRET`: секрет подписывает сессии.

## CI и деплой

[![CI](https://github.com/ViktorVinokurov/tasks/actions/workflows/ci.yml/badge.svg)](https://github.com/ViktorVinokurov/tasks/actions/workflows/ci.yml)

На push и pull request Actions проверяет интерфейс, гоняет тесты API и собирает оба Docker-образа. Push в `main` публикует образы в GitHub Container Registry (`ghcr.io/viktorvinokurov/tasks/web` и `.../api`) и по SSH обновляет VPS: на сервер копируется `docker-compose.prod.yml`, скачиваются образы с тегом коммита, контейнеры перезапускаются. Том `pgdata` при этом сохраняется.

В репозитории: Settings → Actions → General → Workflow permissions → **Read and write permissions**. Иначе публикация образов не пройдёт.

Секреты: Settings → Secrets and variables → Actions.

| Секрет | Что положить |
| --- | --- |
| `VPS_HOST` | IP или домен сервера |
| `VPS_USER` | пользователь SSH из группы `docker` |
| `VPS_SSH_KEY` | приватный ключ целиком, вместе со строками BEGIN и END |
| `VPS_PORT` | необязательно, по умолчанию 22 |

Ключ создайте у себя и публичную часть положите на сервер:

```bash
ssh-keygen -t ed25519 -C "github-actions-ezhednevnik" -f "$HOME/.ssh/ezhednevnik_deploy" -N ""
ssh-copy-id -i "$HOME/.ssh/ezhednevnik_deploy.pub" USER@HOST
```

В секрет `VPS_SSH_KEY` вставьте содержимое `~/.ssh/ezhednevnik_deploy`.

Один раз на сервере, под пользователем из `VPS_USER`:

```bash
sudo usermod -aG docker "$USER"
sudo mkdir -p /opt/ezhednevnik
sudo chown "$USER" /opt/ezhednevnik
cd /opt/ezhednevnik
cat > .env << 'EOF'
POSTGRES_USER=diary
POSTGRES_PASSWORD=длинный-пароль
POSTGRES_DB=diary
CORS_ORIGINS=http://localhost:3000
JWT_SECRET=длинная-случайная-строка
WEB_BIND=3000
EOF
chmod 600 .env
```

Пароль базы задайте до первого деплоя: том PostgreSQL запоминает пароль первого старта. `WEB_BIND=3000` открывает интерфейс на порту 3000. Значение `127.0.0.1:3000` оставляет его только на сервере, если впереди nginx. Если файрвол включён, откройте этот порт. API слушает `127.0.0.1:8000`, PostgreSQL остаётся во внутренней сети Compose.

Образы собираются для `linux/amd64`. Для ARM-сервера добавьте переменную репозитория `DEPLOY_PLATFORM` со значением `linux/arm64`.

После секретов и `.env` выкладка запускается push в `main` или вручную: Actions → CI → Run workflow. Повторный запуск того же workflow выкатывает уже собранный коммит заново.

На сервере после деплоя:

```bash
curl -s http://127.0.0.1:8000/health
```

Ответ `{"status":"ok"}` значит, что API поднялся и миграции прошли.
