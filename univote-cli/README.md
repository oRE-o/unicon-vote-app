# univote-cli

`univote-cli`는 UNICON Vote App 서버를 처음 잡는 사람도 화살표 기반 TUI로 빠르게 설정하고 실행할 수 있게 만든 quickstart 도구입니다.

처음 서버를 띄울 때는 `univote`,  
나중에 최신 변경사항을 반영할 때는 `univote update`를 주로 사용합니다.

## 할 수 있는 것

- `.env` 마법사 생성
- DNS 없이 로컬 시험장(mock 데이터) 바로 실행
- quickstart Docker Compose 실행
- 최신 코드 pull + 재빌드 업데이트
- Docker 자동 시작 점검
- 프론트/백엔드 연결 확인
- 관리자 로그인 QR 출력
- `status`, `logs`, `restart`, `stop` 같은 운영 명령 제공

## 설치

프로젝트 루트에서 아래 순서로 설치하면 `univote` 명령을 전역에서 쓸 수 있습니다.

```bash
cd univote-cli
pnpm install
pnpm link --global
```

이후 프로젝트 루트로 돌아와서 실행하세요.

```bash
cd ..
univote
```

`pnpm`이 없다면 먼저 아래를 실행하세요.

```bash
corepack enable
corepack prepare pnpm@10.10.0 --activate
```

`node` 자체가 없다면 먼저 Node.js 20 LTS를 설치한 뒤 위 명령을 실행하세요.

`pnpm link --global`이 실패하면 아래를 한 번 실행한 뒤 새 터미널에서 다시 시도하면 됩니다.

```bash
pnpm setup
```

## macOS에서 실행할 때

macOS에서는 **Docker Desktop만 설치해서 끝나는 구조가 아닙니다.**

- **Docker Desktop**: quickstart 컨테이너 실행
- **Node.js 20 LTS 이상**: CLI 실행
- **pnpm**: CLI 의존성 설치

권장 순서:

```bash
git clone https://github.com/oRE-o/unicon-vote-app
cd unicon-vote-app
corepack enable
corepack prepare pnpm@10.10.0 --activate
cd univote-cli
pnpm install
pnpm link --global
cd ..
univote
```

즉, 맥에서는 보통 **Docker + Node + pnpm + univote CLI 설치**까지 되어 있어야 자연스럽게 실행됩니다.

추가 메모:

- 루트의 `scripts/bootstrap-univote.sh` 는 Ubuntu/Debian 서버용입니다.
- macOS에서는 bootstrap 스크립트 대신 위 절차로 `univote`를 직접 설치해 쓰는 편이 맞습니다.

## 주요 명령

```bash
univote
univote configure
univote experimental
univote experimental-down
univote update
univote status
univote logs
univote qr
```

가장 많이 쓰는 것은 아래 세 가지입니다.

- `univote`: 설정 메뉴 열기
- `univote experimental`: DNS 없이 로컬 시험장 바로 실행
- `univote update`: 최신 코드 반영 + 재빌드
- `univote status`: 현재 상태 확인

실운영 준비 문서는 아래를 참고하세요.

- [상세 CLI 문서](../docs/univote-cli.md)
- [서버 빌리기 가이드](../docs/server-rental-guide.md)
- [DNS 연결 가이드](../docs/dns-setup.md)
- [포트 열기 / 방화벽 가이드](../docs/port-opening.md)

## 주의

- 이 CLI는 `docker-compose.quickstart.yml` 기준으로 동작합니다.
- quickstart compose가 이미 `restart: unless-stopped`를 사용하므로, Docker 서비스만 부팅 시 자동 시작되면 서버 리붓 후에도 다시 올라옵니다.
