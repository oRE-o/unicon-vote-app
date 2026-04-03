# UNICON Vote App

UNICON 행사에서 게임 투표를 진행하기 위한 웹 앱입니다.

- 참가자는 팔찌 QR로 접속합니다.
- QR은 `uuid`가 포함된 로그인 페이지로 이동합니다.
- 비밀번호가 없으면 회원가입으로, 있으면 로그인으로 자동 분기됩니다.
- 관리자는 사용자 생성, 로그인 QR 확인, 비밀번호 초기화, 여분 팔찌 교체, 게임/썸네일 준비, 결과 집계를 할 수 있습니다.

## Wiki

전체 문서는 `docs/` 아래에 위키처럼 나누어 두었습니다.

- [위키 홈](./docs/README.md)
- [계정 접속 흐름](./docs/account-access-flow.md)
- [관리자 대시보드 사용법](./docs/admin-operations.md)
- [현장 이슈 대응 플레이북](./docs/on-site-playbook.md)
- [로컬 시험장](./docs/local-test-lab.md)
- [서버 빠른 실행](./docs/deploy-quickstart.md)
- [로컬 개발](./docs/local-development.md)
- [행사 전 게임 데이터 준비](./docs/game-catalog-setup.md)
- [구조 및 스택](./docs/architecture.md)

## 가장 빠른 서버 실행

처음 받아서 서버에서 바로 띄우려면 아래 순서가 가장 단순합니다.

```bash
git clone <REPOSITORY_URL>
cd unicon-vote-app
cp .env.example .env
docker compose -f docker-compose.quickstart.yml up -d --build
```

접속:

```text
http://SERVER_IP
```

관리자 로그인:

```text
http://SERVER_IP/login?uuid=<ADMIN_UUID>
```

상세 설명은 [서버 빠른 실행 문서](./docs/deploy-quickstart.md)를 보세요.

## 로컬에서 안전하게 시험해보기

샘플 사용자와 샘플 게임이 자동으로 들어간 mock DB 환경을 띄우려면 아래 스크립트를 쓰면 됩니다.

```bash
./scripts/local-lab-up.sh
```

정리:

```bash
./scripts/local-lab-down.sh
```

상세 설명은 [로컬 시험장 문서](./docs/local-test-lab.md)를 보세요.

## 핵심 파일

- [`docker-compose.quickstart.yml`](./docker-compose.quickstart.yml): 처음 실행하기 쉬운 서버용 compose
- [`.env.example`](./.env.example): 서버 환경변수 예시
- [`unicon-vote-frontend/nginx.http.conf`](./unicon-vote-frontend/nginx.http.conf): quickstart용 HTTP nginx 설정
- [`docker-compose.yml`](./docker-compose.yml): 기존 운영용 Docker Hub + HTTPS 기준 설정
