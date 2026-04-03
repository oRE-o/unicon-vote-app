# UNICON Vote App

UNICON 행사에서 게임 투표를 진행하는 웹 앱입니다.  
처음 이 저장소에 들어온 사람이 가장 빨리 서버를 올리고, 관리자 페이지에 접속하고, 행사 준비를 시작할 수 있도록 문서를 다시 정리했습니다.

저장소 주소: [https://github.com/oRE-o/unicon-vote-app](https://github.com/oRE-o/unicon-vote-app)

## 처음이라면 이것만 보세요

가장 빠른 추천 흐름은 아래 5단계입니다.

1. Linux 서버 1대를 준비합니다.
2. 이 저장소를 서버에 `git clone` 합니다.
3. `univote` CLI를 설치하고 실행합니다.
4. `빠른 설정 + 시작`을 선택합니다.
5. CLI가 보여주는 관리자 URL로 접속해서 행사 준비를 시작합니다.

처음 실행만 끝나면, 나중에 업데이트는 보통 아래 한 줄이면 충분합니다.

```bash
cd ~/unicon-vote-app
univote update
```

## 1. 가장 빠른 유니콘 투표시스템 구동

### 1-1. 준비할 것

- 공개 IP가 있는 Linux 서버 1대
- 권장 사양: `2 vCPU / 4GB RAM / 20GB 이상 디스크`
- 권장 운영체제: `Ubuntu 22.04` 또는 `Ubuntu 24.04`
- 서버 접속용 SSH 계정
- 선택 사항: 도메인 1개

처음이라면 아래 같은 클라우드에서 한 대 빌리는 방식이 가장 편합니다.

- AWS Lightsail / EC2
- DigitalOcean
- Vultr
- Hetzner
- Google Cloud Compute Engine
- Naver Cloud Platform

개인 컴퓨터는 운영 서버로 비추천합니다.

- 절전 모드나 재부팅으로 서비스가 자주 끊길 수 있음
- 집/학교 네트워크는 공인 IP가 자주 바뀔 수 있음
- 외부 접속, 방화벽, 포트 개방이 번거로울 수 있음

서버를 준비했다면 아래도 같이 확인하세요.

- SSH 접속 포트 `22` 열기
- 서비스 접속 포트 `80` 열기
- HTTPS를 붙여야 하므로 `443`도 열기
- 도메인을 쓸 경우 A 레코드를 서버 공인 IP로 연결

보안상 권장:

- `5001`, `27017` 포트는 외부 인터넷에 열지 않는 것을 권장합니다.
- HTTP만 쓸 때는 외부 공개를 `80`만 해도 됩니다.
- HTTPS를 쓸 때는 외부 공개를 `80`, `443` 둘 다 열어야 합니다.

HTTPS까지 쓰려면:

- 도메인 1개가 서버 공인 IP를 가리켜야 함
- 포트 `80`, `443` 둘 다 열려 있어야 함
- `univote`에서 HTTPS 모드를 선택하면 Let's Encrypt 인증서를 자동으로 시도함

quickstart는 HTTP와 HTTPS 둘 다 가능합니다.  
실제 행사 운영이라면 도메인을 준비해서 HTTPS로 띄우는 것을 권장합니다.

### 1-2. 구동하기

서버에 접속한 뒤 아래를 순서대로 실행하세요.

```bash
git clone https://github.com/oRE-o/unicon-vote-app
cd unicon-vote-app
cd univote-cli
npm install
npm link
cd ..
univote
```

화살표 메뉴가 뜨면 `빠른 설정 + 시작`을 고르면 됩니다.

처음 하는 사람이라면 아래처럼 이해하면 됩니다.

- `git clone`: 저장소 받기
- `npm install`: CLI 설치 준비
- `npm link`: `univote` 명령을 어디서든 쓸 수 있게 연결
- `univote`: 설정 마법사 실행

이 CLI가 자동으로 해주는 일:

- `.env` 생성 또는 갱신
- 기존 `.env` 백업
- `docker compose -f docker-compose.quickstart.yml up -d --build`
- Docker 자동 시작 여부 점검
- HTTPS 선택 시 Let's Encrypt 인증서 발급 시도
- 프론트/백엔드/관리자 계정 연결 테스트
- 관리자 로그인 URL과 QR 출력

설정 중에는 보통 아래만 입력하면 됩니다.

- 사람들이 접속할 주소
- HTTPS를 쓸지 여부
- 도메인과 인증서용 이메일
- 관리자 비밀번호
- 샘플 데이터를 넣을지 여부
- 게임 썸네일 업로드용 S3 정보를 넣을지 여부

입력값을 잘 모르겠다면:

- 실제 행사 서버면 HTTPS를 권장합니다.
- 테스트만 빨리 해볼 때는 HTTP로 먼저 띄워도 됩니다.
- S3 정보가 아직 없으면 비워 두고, 나중에 관리자 화면에서 URL 직접 입력 방식으로 먼저 운영할 수도 있습니다.

### 자동 구동 완료 후 확인하는 법

1. 브라우저에서 CLI가 안내한 주소 접속
2. CLI가 보여준 관리자 로그인 URL 접속
3. 관리자 비밀번호 입력
4. `/admin` 화면이 열리는지 확인
5. 터미널에서 `univote status` 실행

정상이라면:

- 메인 화면이 열림
- 관리자 로그인 가능
- `univote status`가 health 체크를 통과함

여기까지 되면 서버는 일단 준비된 것입니다.  
다음 단계는 보통 관리자 페이지에서 게임 정보와 계정 데이터를 넣는 일입니다.

### 나중에 앱 업데이트를 반영하는 법

GitHub에 새 변경사항이 올라왔을 때는 운영 서버에서 아래만 실행하면 됩니다.

```bash
cd ~/unicon-vote-app
univote update
```

이 명령은 아래를 순서대로 처리합니다.

- `origin/main` 최신 변경사항 확인
- fast-forward 방식으로만 안전하게 pull
- `univote-cli` 의존성 다시 맞추기
- Docker 컨테이너 재빌드 및 재시작
- health 체크와 관리자 접속 정보 다시 출력

주의:

- 서버 저장소에 직접 수정한 파일이 남아 있으면 보호를 위해 업데이트를 멈춥니다.
- 그래서 운영 서버에서는 보통 `.env` 말고는 저장소 파일을 직접 수정하지 않는 것을 권장합니다.

업데이트가 끝난 뒤에는 보통 아래 2가지만 다시 보면 됩니다.

1. 메인 주소가 열리는지
2. 관리자 로그인 URL이 그대로 잘 열리는지

뭔가 안 될 경우:

- [관리자 트러블슈팅 / 현장 이슈 대응 문서](./docs/on-site-playbook.md)
- [univote CLI 문서](./docs/univote-cli.md)
- [서버 빠른 실행 문서](./docs/deploy-quickstart.md)

## 2. 관리자 기능 안내

### 2-1. 행사 전에 해야할 것

행사 전에는 아래 3가지를 먼저 끝내면 됩니다.

1. 관리자 로그인 확인
2. 게임 정보와 썸네일 등록
3. 참가자 계정과 여분 팔찌 계정 준비

- 서버와 관리자 계정 접속이 정상인지 확인
- 관리자 로그인 방법 숙지
- 게임 정보 등록
- 게임 썸네일 등록
- 기명 계정 / 무기명 계정 생성
- 팔찌 발주용 계정 리스트를 XLSX로 저장

바로 볼 문서:

- [행사 전 관리자 준비](./docs/admin-before-event.md)
- [관리자 대시보드 사용법](./docs/admin-operations.md)
- [행사 전 게임 데이터 준비](./docs/game-catalog-setup.md)

### 2-2. 행사 중에 해야할 것

행사 중에는 보통 아래 문제를 가장 자주 다룹니다.

- QR이 안 읽힘
- 비밀번호를 잊어버림
- 이름/동아리 정보가 틀림
- 현장에서 새 팔찌를 줘야 함

- QR이 안 되는 참가자 대응
- 새 팔찌 지급
- 기명 계정 팔찌 교체
- 비밀번호 초기화
- 이름/동아리 수정
- 현재 투표자 수 확인 및 투표 독려

바로 볼 문서:

- [행사 중 관리자 운영](./docs/admin-during-event.md)
- [관리자 트러블슈팅 / 현장 이슈 대응](./docs/on-site-playbook.md)
- [계정 접속 흐름](./docs/account-access-flow.md)

### 2-3. 행사 마무리에 해야할 것

행사가 끝나면 아래 파일 2개를 저장해 두는 것을 권장합니다.

1. 종합 결과 XLSX
2. 사용자별 내역 XLSX

- 전체 투표 결과 다운로드
- 사용자별 투표 내역 다운로드
- 액셀 파일 정리

바로 볼 문서:

- [행사 마무리 정리](./docs/admin-after-event.md)

## 3. 기타 참고 문서들

아래 문서는 필요할 때 열어보면 됩니다.

- [위키 홈](./docs/README.md)
- [univote CLI](./docs/univote-cli.md)
- [로컬 시험장](./docs/local-test-lab.md)
- [로컬 개발](./docs/local-development.md)
- [구조 및 스택](./docs/architecture.md)
- [기존 quickstart compose 파일](./docker-compose.quickstart.yml)
- [서버 환경변수 예시](./.env.example)
