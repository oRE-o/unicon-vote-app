# univote-cli

`univote-cli`는 UNICON Vote App 서버를 처음 잡는 사람도 화살표 기반 TUI로 빠르게 설정하고 실행할 수 있게 만든 quickstart 도구입니다.

## 할 수 있는 것

- `.env` 마법사 생성
- quickstart Docker Compose 실행
- Docker 자동 시작 점검
- 프론트/백엔드 연결 확인
- 관리자 로그인 QR 출력
- `status`, `logs`, `restart`, `stop` 같은 운영 명령 제공

## 설치

프로젝트 루트에서 아래 순서로 설치하면 `univote` 명령을 전역에서 쓸 수 있습니다.

```bash
cd univote-cli
npm install
npm link
```

이후 프로젝트 루트로 돌아와서 실행하세요.

```bash
cd ..
univote
```

## 주요 명령

```bash
univote
univote configure
univote status
univote logs
univote qr
```

## 주의

- 이 CLI는 `docker-compose.quickstart.yml` 기준으로 동작합니다.
- quickstart compose가 이미 `restart: unless-stopped`를 사용하므로, Docker 서비스만 부팅 시 자동 시작되면 서버 리붓 후에도 다시 올라옵니다.
