#!/usr/bin/env bash
set -euo pipefail

cd /opt/ezhednevnik

if [[ ! -f .env ]]; then
  echo "На сервере нет /opt/ezhednevnik/.env. Создайте его из .env.example и повторите workflow." >&2
  exit 1
fi

if ! grep -Eq '^JWT_SECRET=.+' .env; then
  echo "Добавьте JWT_SECRET в /opt/ezhednevnik/.env — длинная случайная строка для сессий." >&2
  exit 1
fi

if [[ -z "${WEB_IMAGE:-}" || -z "${API_IMAGE:-}" || -z "${GHCR_TOKEN:-}" || -z "${GHCR_USER:-}" ]]; then
  echo "Для деплоя нужны GHCR_TOKEN, GHCR_USER, WEB_IMAGE и API_IMAGE." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Пользователь не может вызывать docker. Добавьте его в группу docker и зайдите на сервер заново." >&2
  exit 1
fi

docker compose version

auth_dir="$(mktemp -d)"
export DOCKER_CONFIG="$auth_dir"
trap 'rm -rf "$auth_dir"' EXIT

printf '%s\n' "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

umask 077
printf 'WEB_IMAGE=%s\nAPI_IMAGE=%s\n' "$WEB_IMAGE" "$API_IMAGE" > .env.images

compose=(docker compose --env-file .env --env-file .env.images -f docker-compose.prod.yml)
"${compose[@]}" pull
"${compose[@]}" up -d --remove-orphans --wait --wait-timeout 180

curl -fsS http://127.0.0.1:8000/health
echo
web_addr="$("${compose[@]}" port web 3000)"
web_addr="${web_addr%%$'\n'*}"
if [[ -z "$web_addr" ]]; then
  echo "Не удалось узнать опубликованный порт интерфейса." >&2
  exit 1
fi
curl -fsS -o /dev/null "http://${web_addr}/"

prune_repo() {
  local image="$1"
  local repo="${image%%:*}"
  local keep="${image##*:}"
  local tag
  while read -r tag; do
    [[ -z "$tag" || "$tag" == "$keep" || "$tag" == "latest" ]] && continue
    docker rmi "${repo}:${tag}" || true
  done < <(docker images "$repo" --format '{{.Tag}}')
}

prune_repo "$WEB_IMAGE"
prune_repo "$API_IMAGE"
docker image prune -f
