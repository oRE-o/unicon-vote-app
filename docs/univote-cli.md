# univote CLI

`univote-cli`는 서버에서 `.env`를 직접 편집하지 않아도 화살표 기반 CLI로 quickstart를 설정하고 바로 올릴 수 있게 만든 도구입니다.

## 이런 상황에 적합합니다

- 서버를 처음 잡는 사람에게 텍스트 기반 마법사를 주고 싶을 때
- `.env`를 손으로 적는 실수를 줄이고 싶을 때
- quickstart compose를 바로 띄우고 연결 테스트까지 하고 싶을 때
- 관리자 로그인 QR까지 바로 보고 싶을 때
- 도메인이 있을 때 HTTPS까지 한 번에 붙이고 싶을 때

## 현재 하는 일

- 저장소 루트를 자동 탐색
- `.env` 생성 또는 갱신
- 기존 `.env` 자동 백업
- `docker compose -f docker-compose.quickstart.yml up -d --build`
- Docker 서비스 자동 시작 여부 점검
- HTTPS 선택 시 Let's Encrypt 인증서 발급 시도
- 프론트/백엔드/관리자 계정 연결 확인
- 관리자 로그인 URL과 QR 출력

## 요구사항

- Node.js 18 이상
- npm
- Docker
- Linux 서버라면 `systemctl` 또는 `sudo` 사용 가능 환경이면 더 좋음

## 설치

프로젝트 루트에서 아래를 실행하세요.

```bash
cd univote-cli
npm install
npm link
cd ..
```

이후부터는 프로젝트 루트에서 아래처럼 실행합니다.

```bash
univote
```

## 기본 사용 흐름

### 1. 메뉴 열기

```bash
univote
```

화살표로 아래 메뉴를 고를 수 있습니다.

- 빠른 설정 + 시작
- 업데이트 가져오기
- 상태 확인
- 로그 보기
- 재시작
- 중지
- compose down
- 관리자 QR 보기
- 진단 실행

### 2. 빠른 설정 + 시작

`빠른 설정 + 시작`을 고르면 보통 아래를 묻습니다.

- HTTP로 띄울지, HTTPS로 띄울지
- 사용자가 접속할 기본 주소
- HTTPS라면 실제 접속 도메인
- HTTPS라면 Let's Encrypt 이메일
- 추가 CORS 주소
- 관리자 UUID/비밀번호를 추천값으로 쓸지
- 샘플 데이터를 넣을지
- S3형 썸네일 업로드를 설정할지

설정이 끝나면:

1. `.env` 작성
2. nginx quickstart 설정 파일 생성
3. quickstart compose 실행
4. HTTPS 선택 시 인증서 발급 시도
5. health 체크
6. 관리자 QR 출력

## 서브커맨드

직접 명령으로도 쓸 수 있습니다.

```bash
univote
univote configure
univote update
univote start
univote status
univote logs
univote qr
univote restart
univote stop
univote down
univote doctor
```

## 업데이트 적용

이 저장소는 GitHub에 push할 때마다 서버가 자동 배포되는 구조가 아닙니다.

대신 운영 서버에서 아래처럼 직접 최신 변경사항을 반영합니다.

```bash
cd ~/unicon-vote-app
univote update
```

`univote update`는 아래를 순서대로 처리합니다.

- `origin/main` 최신 변경사항 확인
- fast-forward 방식으로 안전하게 pull
- `univote-cli` 의존성 다시 설치
- quickstart 컨테이너 재빌드
- health 체크
- 관리자 로그인 URL과 QR 재출력

운영 중에는 보통 아래 상황에서 이 명령을 쓰면 됩니다.

- 새 기능이 추가되었을 때
- 관리자 페이지가 업데이트되었을 때
- 행사 전 최종 점검 때 최신 버전을 반영하고 싶을 때

주의:

- 서버 저장소에 직접 수정한 tracked 파일이 있으면 업데이트를 중단합니다.
- 안전한 운영을 위해 서버에서는 `.env` 외의 저장소 파일을 직접 고치지 않는 편이 좋습니다.

## 지속 실행과 리붓 대응

quickstart compose는 이미 `restart: unless-stopped`를 사용합니다.

즉, 보통은 아래 조건이면 충분합니다.

1. Docker 데몬이 서버 부팅 시 자동 시작됨
2. 컨테이너가 `up -d` 상태로 한 번 올라감

`univote configure` 또는 `univote start` 과정에서는 Linux 서버일 경우 Docker 자동 시작도 같이 점검합니다.

## 연결 확인 방식

CLI는 기본적으로 아래를 검사합니다.

- `docker info`
- `docker compose ps`
- `http://127.0.0.1`
- `http://127.0.0.1:5001/api/health`
- `http://127.0.0.1:5001/api/auth/status/<ADMIN_UUID>`

HTTPS를 켠 경우에는 추가로 `https://<SERVER_DOMAIN>` 도 확인합니다.

즉, 적어도 서버 내부 기준으로 프론트/백/관리자 계정이 살아 있는지 확인합니다.

## 인증서 갱신 메모

현재 quickstart는 HTTPS 초기 발급까지는 자동으로 시도합니다.

장기 운영으로 인증서 만료 시점까지 완전 자동 갱신을 붙인 상태는 아니므로, 행사 직전이나 운영 점검 시점에 아래처럼 한 번 더 확인하는 것을 권장합니다.

```bash
univote start
```

이 과정에서 HTTPS를 켠 상태라면 인증서도 다시 확인합니다.

## 주의

- 이 CLI는 현재 `docker-compose.quickstart.yml` 전용입니다.
- HTTPS는 도메인과 80/443 포트가 준비된 경우에만 정상 발급됩니다.
- 외부에서 접속이 안 될 경우에는 서버 방화벽, 클라우드 보안 그룹, 리버스 프록시 설정도 같이 확인해야 합니다.
