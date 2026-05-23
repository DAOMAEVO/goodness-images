#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ENV_FILE=${ENV_FILE:-"$SCRIPT_DIR/.env"}
COMPOSE_FILE=${COMPOSE_FILE:-"$SCRIPT_DIR/docker-compose.vps.yml"}
IMAGE_NAME=${IMAGE_NAME:-gpt-image-playground}
IMAGE_TAG=${IMAGE_TAG:-vps}
CONTAINER_NAME=${CONTAINER_NAME:-gpt-image-playground}
HOST_PORT=${HOST_PORT:-8080}
API_URL=${API_URL:-https://api.openai.com/v1}
IMAGE_TAR=${IMAGE_TAR:-}

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

IMAGE_NAME=${IMAGE_NAME:-gpt-image-playground}
IMAGE_TAG=${IMAGE_TAG:-vps}
IMAGE_REF=${IMAGE_REF:-"$IMAGE_NAME:$IMAGE_TAG"}
CONTAINER_NAME=${CONTAINER_NAME:-gpt-image-playground}
HOST_PORT=${HOST_PORT:-8080}
API_URL=${API_URL:-https://api.openai.com/v1}

if [ -z "$IMAGE_TAR" ]; then
  FOUND_TAR=$(find "$SCRIPT_DIR" -maxdepth 1 -type f -name "*.tar" | head -n 1 || true)
  if [ -n "$FOUND_TAR" ]; then
    IMAGE_TAR=$FOUND_TAR
  fi
fi

if [ -z "$IMAGE_TAR" ] || [ ! -f "$IMAGE_TAR" ]; then
  echo "未找到镜像 tar 包。请在 .env 中设置 IMAGE_TAR，或把 tar 文件放到脚本同目录。" >&2
  exit 1
fi

docker load -i "$IMAGE_TAR"

if docker compose version >/dev/null 2>&1; then
  docker compose -f "$COMPOSE_FILE" up -d
else
  if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
    docker rm -f "$CONTAINER_NAME" >/dev/null
  fi

  docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -p "$HOST_PORT:80" \
    -e "API_URL=$API_URL" \
    "$IMAGE_REF" >/dev/null
fi

echo "容器已启动。"
echo "  镜像:   $IMAGE_REF"
echo "  容器:   $CONTAINER_NAME"
echo "  地址:   http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo localhost):$HOST_PORT"
