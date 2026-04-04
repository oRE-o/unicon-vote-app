#!/bin/sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.local-lab.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker 명령을 찾을 수 없습니다. Docker Desktop 또는 Docker Engine을 먼저 설치해주세요."
  exit 1
fi

echo "로컬 시험장을 시작합니다..."
docker compose -f "$COMPOSE_FILE" up -d --build

cat <<'EOF'

로컬 시험장이 준비되었습니다.

- 메인 주소: http://localhost:18080
- 관리자 로그인 주소: http://localhost:18080/login?uuid=00000000-0000-0000-0000-000000000000
- 관리자 비밀번호: local-admin-1234
- 기명 사용자 첫 설정 테스트 주소: http://localhost:18080/login?uuid=11111111-aaaa-1111-aaaa-111111111111
- 무기명 사용자 첫 설정 테스트 주소: http://localhost:18080/login?uuid=88888888-8888-8888-8888-888888888888
- 브라우저 첫 화면에서 demo QR 카드도 바로 확인할 수 있습니다.
- 백엔드 API(선택): http://localhost:15001

이 환경은 샘플 사용자, 샘플 게임, 여분 guest 팔찌까지 자동으로 들어간 mock DB를 사용합니다.
끝난 뒤에는 ./scripts/local-lab-down.sh 로 흔적 없이 정리할 수 있습니다.
EOF
