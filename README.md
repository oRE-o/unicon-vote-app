# UNICON Vote App

UNICON 행사에서 게임 투표를 진행하는 웹 앱입니다.  
처음 보는 사람도 서버를 열고 관리자 페이지에 들어가 행사 준비를 시작할 수 있도록 문서를 정리했습니다.

저장소 주소: [https://github.com/oRE-o/unicon-vote-app](https://github.com/oRE-o/unicon-vote-app)

## Quickstart

실운영 서버 quickstart 전에 먼저 아래 문서를 보고 준비 상태를 맞추는 편이 안전합니다.

- [서버 빌리기 가이드](./docs/server-rental-guide.md)
- [DNS 연결 가이드](./docs/dns-setup.md)
- [포트 열기 / 방화벽 가이드](./docs/port-opening.md)

가장 쉬운 방법은 아래 한 줄을 Ubuntu/Debian 서버에 그대로 붙여넣는 것입니다.

```bash
sudo apt-get update && sudo apt-get install -y curl ca-certificates && curl -fsSL https://raw.githubusercontent.com/oRE-o/unicon-vote-app/main/scripts/bootstrap-univote.sh | bash
```

이 한 줄이 하는 일:

- `git`, `docker`, `docker compose`, `node`, `pnpm` 설치
- 저장소 clone 또는 최신화
- `univote` 명령 연결
- 마지막에 `univote` 설정 마법사 실행

스크립트가 끝나면 보통 아래처럼 진행하면 됩니다.

1. `univote` 메뉴에서 `빠른 설정 + 시작` 선택
2. 접속 주소, HTTPS 여부, 관리자 비밀번호 입력
3. CLI가 health 체크와 관리자 QR까지 출력
4. 브라우저에서 메인 주소와 `/admin` 접속 확인

나중에 업데이트는 보통 아래 한 줄이면 충분합니다.

```bash
cd ~/unicon-vote-app
univote update
```

자세한 설명은 아래를 참고하세요.

## 어떤 경로로 시작하면 되나요?

- **운영 서버를 처음 띄운다** → [univote CLI](./docs/univote-cli.md)
- **CLI 없이 직접 배포한다** → [서버 빠른 실행](./docs/deploy-quickstart.md)
- **DNS 없이 로컬에서 바로 눌러본다** → [로컬 시험장](./docs/local-test-lab.md)
- **개발 환경을 잡는다** → [로컬 개발](./docs/local-development.md)

## univote 기능 / 명령어 모음

### 메인 메뉴에서 할 수 있는 것

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

### 자주 쓰는 명령어

#### 최초 설정 / 실행

```bash
univote
univote configure
univote experimental
```

#### 운영 중 자주 쓰는 명령

```bash
univote update
univote start
univote restart
univote status
univote logs
univote qr
```

#### 정리 / 진단

```bash
univote stop
univote down
univote doctor
univote experimental-down
```

자세한 기능 설명은 [univote CLI 문서](./docs/univote-cli.md)를 보세요.

## macOS에서 로컬로 깔끔하게 실행하기

맥에서 **실험 모드(local test lab)** 로만 눌러볼 거라면 Docker Desktop 중심으로도 가능합니다.  
다만 `univote` CLI 자체를 쓰려면 Node.js가 필요합니다.

### 1) 제일 가볍게 시험만 해보기

이 경로는 `univote` 없이도 됩니다.

```bash
git clone https://github.com/oRE-o/unicon-vote-app
cd unicon-vote-app
./scripts/local-lab-up.sh
```

이 방식은 아래 특징이 있습니다.

- Docker만 있으면 됨
- DNS 필요 없음
- 샘플 사용자 / 샘플 게임 / 관리자 계정 자동 생성
- 끝나면 `./scripts/local-lab-down.sh` 로 정리 가능

자세한 설명은 [로컬 시험장](./docs/local-test-lab.md)을 보세요.

### 2) macOS에서 `univote` CLI까지 쓰기

`univote` CLI 자체가 Node.js 위에서 실행되기 때문에 아래 3가지는 필요합니다.

1. **Docker Desktop for Mac**
2. **Node.js 20 LTS 이상**
3. **pnpm** (`corepack`으로 준비 가능)

가장 무난한 순서는 아래입니다.

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

즉, 맥에서는 보통 아래처럼 이해하면 됩니다.

- **Docker Desktop**: 실제 프론트/백/DB 컨테이너 실행
- **Node + pnpm**: `univote` CLI 실행

주의:

- `scripts/bootstrap-univote.sh` 는 **Ubuntu/Debian 서버용**입니다.
- macOS에서는 bootstrap 스크립트를 그대로 쓰는 방식이 아니라, 위처럼 `univote-cli`를 직접 설치해서 쓰는 편이 맞습니다.
- 맥 로컬 실행은 **개발/점검용**으로는 괜찮지만, 실제 행사 운영 서버는 공개 IP가 있는 Linux 서버를 권장합니다.

### private 저장소일 때

저장소가 private이면 먼저 서버가 GitHub 저장소를 읽을 수 있어야 합니다.

보통 아래 중 하나가 먼저 필요합니다.

- 서버 SSH 키를 GitHub에 등록
- 또는 GitHub 토큰을 이용해 clone 가능한 상태로 준비

그 다음에는 아래처럼 저장소를 먼저 받아놓고, 로컬 bootstrap 스크립트를 실행하면 됩니다.

```bash
git clone git@github.com:oRE-o/unicon-vote-app.git ~/unicon-vote-app
cd ~/unicon-vote-app
REPO_DIR="$PWD" bash scripts/bootstrap-univote.sh
```

즉, private 저장소에서는 `raw.githubusercontent.com`으로 직접 bootstrap 스크립트를 받는 방식보다, 먼저 인증된 방식으로 `git clone` 한 뒤 로컬 스크립트를 실행하는 쪽이 안전합니다.

## Prerequisite (요구 사항)

### 서버

- 공개 IP가 있는 Linux 서버 1대
- 권장 사양: `2 vCPU / 4GB RAM / 20GB 이상 디스크`
- 권장 운영체제: `Ubuntu 22.04` 또는 `Ubuntu 24.04`
- SSH 접속 가능한 일반 사용자 계정
- `sudo` 사용 가능
- 선택 사항: 실제 행사 운영용 도메인 1개

처음이라면 아래 같은 클라우드에서 한 대 빌리는 방식이 가장 편합니다.

- AWS Lightsail / EC2
- DigitalOcean
- Vultr
- Hetzner
- Google Cloud Compute Engine
- Naver Cloud Platform

개인 컴퓨터는 운영 서버로 비추천합니다.

- 절전 모드나 재부팅으로 서비스가 끊길 수 있음
- 공인 IP가 바뀔 수 있음
- 외부 접속과 방화벽 설정이 번거로울 수 있음

### 설치해야 할 필수 프로그램들

- `git`
- `docker`
- `docker compose`
- `node` 18 이상
- `pnpm`

quickstart 서버 실행에는 MongoDB를 따로 설치할 필요가 없습니다.  
MongoDB 컨테이너가 같이 올라옵니다.

설치 여부를 빠르게 확인하는 명령:

```bash
git --version
docker --version
docker compose version
node --version
pnpm --version
```

### 포트 열기, 도메인과 DNS 연결

- SSH 접속용 `22` 포트 열기
- 웹 접속용 `80` 포트 열기
- HTTPS를 쓸 예정이면 `443` 포트도 열기
- 도메인을 쓸 경우 A 레코드를 서버 공인 IP로 연결

보안상 권장:

- `5001`, `27017` 포트는 외부 인터넷에 열지 않는 것을 권장합니다.
- HTTP만 쓸 때는 외부 공개를 `80`만 해도 됩니다.
- HTTPS를 쓸 때는 외부 공개를 `80`, `443` 둘 다 열어야 합니다.

HTTPS까지 쓰려면:

- 도메인 1개가 서버 공인 IP를 가리켜야 함
- `80`, `443` 포트가 둘 다 열려 있어야 함
- `univote`에서 HTTPS 모드를 선택하면 Let's Encrypt 인증서를 자동으로 시도함

### 복붙 bootstrap 스크립트

Ubuntu/Debian 서버라면 아래 한 줄이 가장 빠릅니다.

```bash
sudo apt-get update && sudo apt-get install -y curl ca-certificates && curl -fsSL https://raw.githubusercontent.com/oRE-o/unicon-vote-app/main/scripts/bootstrap-univote.sh | bash
```

수동으로 설치하고 싶다면 아래 [자세한 설명](#자세한-설명)을 참고하세요.

## 자세한 설명

### 서버 빌리기 + 포트 열기 + DNS 연결

처음이라면 Ubuntu 서버를 하나 빌리고 아래만 먼저 맞추면 됩니다.

1. 서버 공인 IP 확인
2. `22`, `80`, 필요하면 `443` 포트 열기
3. HTTPS를 쓸 거라면 도메인의 A 레코드를 서버 IP에 연결

관련 문서:

- [서버 빠른 실행](./docs/deploy-quickstart.md)

### prerequisite 설치하기

Ubuntu 서버에서 수동으로 준비하려면 보통 아래 순서입니다.

```bash
sudo apt update
sudo apt install -y git docker.io docker-compose-plugin curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
corepack enable
corepack prepare pnpm@10.10.0 --activate
sudo usermod -aG docker $USER
```

이후에는 한 번 다시 로그인한 뒤 진행하는 편이 안전합니다.

관련 문서:

- [univote CLI](./docs/univote-cli.md)
- [서버 빠른 실행](./docs/deploy-quickstart.md)

### 구동하기 / 다시 구동하기

수동 설치 방식:

```bash
git clone https://github.com/oRE-o/unicon-vote-app
cd unicon-vote-app
cd univote-cli
pnpm install
pnpm link --global
cd ..
univote
```

처음에는 `빠른 설정 + 시작`을 고르면 됩니다.

설정을 다시 열고 싶을 때:

- `univote`
- 또는 `univote configure`

이 경우 기존 `.env`를 참고해서 다시 마법사를 열 수 있습니다.  
중간에 미뤄둔 설정을 다시 이어서 하고 싶을 때도 보통 `univote configure`를 다시 실행하면 됩니다.

이미 설정이 끝난 뒤 다시 올리고 싶을 때:

- `univote start`
- 상태 확인은 `univote status`
- 관리자 QR 다시 보기는 `univote qr`

관련 문서:

- [univote CLI](./docs/univote-cli.md)

### 업데이트하고 다시 실행되게 하는 법

코드 업데이트는 보통 아래 한 줄이면 됩니다.

```bash
cd ~/unicon-vote-app
univote update
```

이 명령이 하는 일:

- `origin/main` 최신 변경사항 확인
- fast-forward 방식으로 안전하게 pull
- `univote-cli` 의존성 동기화
- quickstart 컨테이너 재빌드 및 재시작
- health 체크
- 관리자 로그인 URL과 QR 다시 출력

서버를 껐다 켜도 다시 실행되게 하는 부분은 quickstart가 이미 처리합니다.

- 컨테이너는 `restart: unless-stopped` 사용
- `univote`가 Docker 자동 시작도 점검

관련 문서:

- [univote CLI](./docs/univote-cli.md)
- [서버 빠른 실행](./docs/deploy-quickstart.md)

## 행사 전에

행사 전에는 보통 아래 3가지를 먼저 끝내면 됩니다.

1. 관리자 로그인 확인
2. 게임 정보와 썸네일 등록
3. 참가자 계정과 여분 팔찌 계정 준비

바로 볼 문서:

- [행사 전 관리자 준비](./docs/admin-before-event.md)
- [행사 전 게임 데이터 준비](./docs/game-catalog-setup.md)
- [관리자 대시보드 사용법](./docs/admin-operations.md)

## 행사 중에

행사 중에는 보통 아래 문제를 가장 자주 다룹니다.

- QR이 안 읽힘
- 비밀번호를 잊어버림
- 이름/동아리 정보가 틀림
- 현장에서 새 팔찌를 줘야 함

바로 볼 문서:

- [행사 중 관리자 운영](./docs/admin-during-event.md)
- [관리자 트러블슈팅 / 현장 이슈 대응](./docs/on-site-playbook.md)
- [계정 접속 흐름](./docs/account-access-flow.md)

## 행사 후에

행사가 끝나면 보통 아래 파일 2개를 먼저 저장하면 됩니다.

1. 종합 결과 XLSX
2. 사용자별 내역 XLSX

바로 볼 문서:

- [행사 마무리 정리](./docs/admin-after-event.md)

## 기타 참고 문서들

- [위키 홈](./docs/README.md)
- [로컬 시험장](./docs/local-test-lab.md)
- [로컬 개발](./docs/local-development.md)
- [구조 및 스택](./docs/architecture.md)
- [기존 quickstart compose 파일](./docker-compose.quickstart.yml)
- [서버 환경변수 예시](./.env.example)
