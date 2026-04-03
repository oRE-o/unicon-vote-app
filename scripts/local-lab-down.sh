#!/bin/sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.local-lab.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker 명령을 찾을 수 없습니다."
  exit 1
fi

echo "로컬 시험장을 정리합니다..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans --rmi local -v

cat <<'EOF'

로컬 시험장 컨테이너와 mock DB를 정리했습니다.
다음에 다시 ./scripts/local-lab-up.sh 를 실행하면 처음 상태로 새로 시작합니다.
EOF
