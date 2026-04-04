# univote CLI

`univote-cli`는 서버에서 `.env`를 직접 편집하지 않아도 화살표 기반 CLI로 quickstart를 설정하고 바로 올릴 수 있게 만든 도구입니다.

## 이 문서 한 줄 요약

처음 서버를 띄울 때는 보통 `univote`만 실행하면 되고,  
나중에 업데이트할 때는 보통 `univote update`만 실행하면 됩니다.

Ubuntu/Debian 서버라면 아래 한 줄로 설치부터 `univote` 실행까지 한 번에 진행할 수도 있습니다.

```bash
sudo apt-get update && sudo apt-get install -y curl ca-certificates && curl -fsSL https://raw.githubusercontent.com/oRE-o/unicon-vote-app/main/scripts/bootstrap-univote.sh | bash
```

주의:

- 이 방식은 저장소가 public일 때 가장 잘 맞습니다.
- 저장소가 private이면 `raw.githubusercontent.com`에서 `404`가 날 수 있습니다.
- private 저장소라면 먼저 인증된 방식으로 저장소를 clone 한 뒤 로컬 `scripts/bootstrap-univote.sh`를 실행하세요.

이 bootstrap 스크립트는:

- 필수 패키지 설치
- 저장소 clone
- `univote` 명령 연결
- `univote` 마법사 실행

까지 한 번에 처리합니다.

## 이런 상황에 적합합니다

- 서버를 처음 잡는 사람에게 텍스트 기반 마법사를 주고 싶을 때
- `.env`를 손으로 적는 실수를 줄이고 싶을 때
- quickstart compose를 바로 띄우고 연결 테스트까지 하고 싶을 때
- 관리자 로그인 QR까지 바로 보고 싶을 때
- 도메인이 있을 때 HTTPS까지 한 번에 붙이고 싶을 때

## 기능 한눈에 보기

### 최초 설정 / 빠른 진입

- `univote`
- `univote configure`
- `univote experimental`

### 운영 중 자주 쓰는 명령

- `univote update`
- `univote start`
- `univote restart`
- `univote status`
- `univote logs`
- `univote qr`

### 정리 / 진단

- `univote stop`
- `univote down`
- `univote doctor`
- `univote experimental-down`

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
- pnpm
- Docker
- Linux 서버라면 `systemctl` 또는 `sudo` 사용 가능 환경이면 더 좋음

확인 명령:

```bash
node --version
pnpm --version
docker --version
docker compose version
```

`pnpm`이 없다면 보통 아래처럼 준비하면 됩니다.

```bash
corepack enable
corepack prepare pnpm@10.10.0 --activate
```

`node` 자체가 없다면 먼저 Node.js 20 LTS를 설치한 뒤 위 명령을 실행하세요.

## 설치

처음 설치는 아래 한 번만 해두면 됩니다.

가장 쉬운 방법:

```bash
sudo apt-get update && sudo apt-get install -y curl ca-certificates && curl -fsSL https://raw.githubusercontent.com/oRE-o/unicon-vote-app/main/scripts/bootstrap-univote.sh | bash
```

수동으로 설치하고 싶다면 아래 절차를 사용하세요.

프로젝트 루트에서 아래를 실행하세요.

```bash
cd univote-cli
pnpm install
pnpm link --global
cd ..
```

`pnpm link --global`이 전역 bin 디렉터리 오류로 실패하면 아래를 한 번 실행한 뒤 새 터미널을 열고 다시 시도하세요.

```bash
pnpm setup
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
- 실험 모드로 바로 실행
- 실험 모드 정리
- 업데이트 가져오기
- 상태 확인
- 로그 보기
- 재시작
- 중지
- compose down
- 관리자 QR 보기
- 진단 실행

처음이라면 보통 `빠른 설정 + 시작` 하나만 알면 충분합니다.

DNS 없이 앱만 빨리 눌러보고 싶다면 `실험 모드로 바로 실행` 이 가장 빠릅니다.

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

즉, 사람이 직접 `.env`를 채우고 `docker compose`를 여러 번 실행하는 일을 줄여주는 도구라고 생각하면 됩니다.

### 2-1. 실험 모드로 바로 실행

이 메뉴는 **실운영 quickstart와 별도인 로컬 시험장**을 바로 띄웁니다.

- DNS 필요 없음
- HTTPS 필요 없음
- 샘플 사용자 / 샘플 게임 / 관리자 계정 자동 생성
- `docker-compose.local-lab.yml` 기반 mock 환경 사용

즉, “일단 서비스 화면부터 보고 싶다”면 이 경로가 더 빠릅니다.

정리할 때는 아래를 쓰면 됩니다.

```bash
univote experimental-down
```

## 서브커맨드

직접 명령으로도 쓸 수 있습니다.

```bash
univote
univote configure
univote experimental
univote experimental-down
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

자주 쓰는 명령만 고르면 보통 아래 네 개입니다.

- `univote`: 메뉴 열기
- `univote update`: 최신 변경사항 반영
- `univote status`: 현재 상태 확인
- `univote qr`: 관리자 로그인 QR 다시 보기

그리고 DNS 없이 시험만 할 거라면 아래 두 개도 자주 씁니다.

- `univote experimental`
- `univote experimental-down`

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

업데이트 후에는 보통 아래 두 가지만 다시 보면 충분합니다.

1. 메인 화면이 열리는지
2. 관리자 로그인 URL이 그대로 잘 열리는지

주의:

- 서버 저장소에 직접 수정한 tracked 파일이 있으면 업데이트를 중단합니다.
- 안전한 운영을 위해 서버에서는 `.env` 외의 저장소 파일을 직접 고치지 않는 편이 좋습니다.

## 지속 실행과 리붓 대응

quickstart compose는 이미 `restart: unless-stopped`를 사용합니다.

즉, 보통은 아래 조건이면 충분합니다.

1. Docker 데몬이 서버 부팅 시 자동 시작됨
2. 컨테이너가 `up -d` 상태로 한 번 올라감

`univote configure` 또는 `univote start` 과정에서는 Linux 서버일 경우 Docker 자동 시작도 같이 점검합니다.

쉽게 말하면:

- 서버를 껐다 켜도 Docker가 자동 시작되면
- 앱도 다시 자동으로 올라오게 만드는 구조입니다

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

실운영 준비 전에 아래 문서를 같이 보면 편합니다.

- [서버 빌리기 가이드](./server-rental-guide.md)
- [DNS 연결 가이드](./dns-setup.md)
- [포트 열기 / 방화벽 가이드](./port-opening.md)
