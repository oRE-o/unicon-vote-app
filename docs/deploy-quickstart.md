# 서버 빠른 실행

처음 이 프로젝트를 받는 사람이 서버 한 대에서 가장 쉽게 실행하는 방법입니다.

이 방식은 다음을 전제로 합니다.

- Docker Hub 이미지를 미리 준비하지 않아도 됨
- 서버에서 직접 이미지 빌드
- 도메인이 있으면 quickstart 단계에서 HTTPS까지 붙일 수 있음
- 도메인이 아직 없으면 HTTP로 먼저 띄우는 것도 가능함

## 요구사항

- Docker
- Docker Compose Plugin
- Git

Ubuntu 예시:

```bash
sudo apt update
sudo apt install -y git docker.io docker-compose-plugin
sudo usermod -aG docker $USER
```

다시 로그인한 뒤 진행하세요.

## 1. 프로젝트 받기

```bash
git clone https://github.com/oRE-o/unicon-vote-app
cd unicon-vote-app
```

직접 `.env`를 편집하는 대신 화살표 기반 마법사를 쓰고 싶다면 [univote CLI](./univote-cli.md)를 먼저 보세요.

특히 HTTPS는 `univote` 마법사를 쓰는 쪽이 훨씬 쉽습니다.

## 2. 환경변수 만들기

```bash
cp .env.example .env
```

최소 수정 권장값:

- `JWT_SECRET`
- `ADMIN_UUID`
- `ADMIN_PASSWORD`
- `MONGO_ROOT_PASSWORD`
- `CORS_ORIGIN`

예시:

```env
JWT_SECRET=replace-with-a-long-random-string
ADMIN_UUID=00000000-0000-0000-0000-000000000000
ADMIN_PASSWORD=ChangeMe1234!
MONGO_ROOT_USER=unicon
MONGO_ROOT_PASSWORD=ChangeMongoPassword123!
CORS_ORIGIN=http://YOUR_SERVER_IP
ENABLE_HTTPS=false
LETSENCRYPT_EMAIL=
FRONTEND_NGINX_CONFIG=./unicon-vote-frontend/nginx.http.conf
SEED_SAMPLE_DATA=false
```

도메인과 IP를 같이 허용하고 싶다면 쉼표로 넣습니다.

```env
CORS_ORIGIN=http://YOUR_SERVER_IP,https://vote.example.com
```

## 3. 실행

```bash
docker compose -f docker-compose.quickstart.yml up -d --build
```

HTTPS까지 같이 쓰려면 quickstart만으로는 nginx 설정과 인증서 발급 절차를 직접 처리해야 해서, 보통은 아래 쪽보다 `univote configure`를 권장합니다.

## 4. 확인

```bash
docker compose -f docker-compose.quickstart.yml ps
docker compose -f docker-compose.quickstart.yml logs -f backend frontend
```

## 4-1. 나중에 최신 변경사항 반영하기

이 저장소는 이제 GitHub push 때마다 자동 배포하지 않습니다.

대신 운영 서버에서 필요할 때 아래 명령으로 최신 변경사항을 반영합니다.

```bash
cd ~/unicon-vote-app
univote update
```

이 명령이 하는 일:

- `origin/main` 최신 커밋 확인
- `git pull --ff-only origin main`
- `univote-cli` 의존성 동기화
- quickstart 컨테이너 재빌드 및 재시작
- health 체크
- 관리자 로그인 URL과 QR 다시 출력

업데이트가 멈춘다면 보통 아래 둘 중 하나입니다.

- 서버 저장소에 직접 수정한 파일이 남아 있음
- 현재 브랜치가 `main`이 아니거나 원격과 fast-forward 불가능한 상태임

접속 주소:

```text
http://SERVER_IP
```

도메인과 인증서를 붙였다면:

```text
https://YOUR_DOMAIN
```

## 5. 관리자 로그인

관리자도 일반 로그인 경로를 사용합니다.

```text
http://SERVER_IP/login?uuid=<ADMIN_UUID>
```

로그인 후:

```text
http://SERVER_IP/admin
```

도메인 + HTTPS를 붙였다면 아래처럼 접속하면 됩니다.

```text
https://YOUR_DOMAIN/login?uuid=<ADMIN_UUID>
https://YOUR_DOMAIN/admin
```

## 샘플 데이터 여부

quickstart 기본 권장값은 아래와 같습니다.

```env
SEED_SAMPLE_DATA=false
```

즉, 실제 서버에서는 기본적으로 관리자 계정만 생성하고 샘플 사용자/샘플 게임은 넣지 않는 것을 권장합니다.

테스트용 샘플 데이터가 필요하면 일시적으로 아래로 바꿀 수 있습니다.

```env
SEED_SAMPLE_DATA=true
```

하지만 행사 준비 서버에서는 보통 `false`로 두고, 실제 게임 데이터는 관리자 화면에서 직접 입력하는 것이 안전합니다.

## 게임 썸네일 업로드를 쓰고 싶다면

관리자 화면에서 S3형 스토리지 업로드를 쓰려면 추가 환경변수가 필요합니다.

설정 방법은 [행사 전 게임 데이터 준비](./game-catalog-setup.md)를 보세요.

## quickstart에서 쓰는 파일

- [`docker-compose.quickstart.yml`](../docker-compose.quickstart.yml)
- [`.env.example`](../.env.example)
- [`unicon-vote-frontend/nginx.http.conf`](../unicon-vote-frontend/nginx.http.conf)
- `unicon-vote-frontend/nginx.quickstart.generated.conf` (CLI가 HTTPS/HTTP 모드에 맞게 생성)

## 기존 운영 방식과의 차이

기존 [`docker-compose.yml`](../docker-compose.yml)은 다음을 전제로 합니다.

- Docker Hub에 프론트/백엔드 이미지가 이미 올라가 있음
- HTTPS용 인증서와 도메인이 이미 준비되어 있음
- 프론트 nginx 설정이 해당 도메인에 맞게 준비되어 있음

처음 세팅이라면 `docker-compose.quickstart.yml`부터 쓰는 것이 훨씬 쉽습니다.
