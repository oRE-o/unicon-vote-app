# UNICON Vote App

UNICON 행사에서 게임 투표를 진행하는 웹 앱입니다.  
처음 이 저장소에 들어온 사람이 가장 빨리 서버를 올리고, 관리자 페이지에 접속하고, 행사 준비를 시작할 수 있도록 문서를 다시 정리했습니다.

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
- HTTPS를 붙일 계획이면 `443`도 열기
- 도메인을 쓸 경우 A 레코드를 서버 공인 IP로 연결

보안상 권장:

- `5001`, `27017` 포트는 외부 인터넷에 열지 않는 것을 권장합니다.
- 보통 외부 공개는 `80`만으로 충분합니다.

quickstart는 HTTP 기준입니다.  
즉, 처음에는 도메인 없이 공인 IP만으로도 바로 띄울 수 있습니다.

### 1-2. 구동하기

서버에 접속한 뒤 아래를 순서대로 실행하세요.

```bash
git clone <REPOSITORY_URL>
cd unicon-vote-app
cd univote-cli
npm install
npm link
cd ..
univote
```

화살표 메뉴가 뜨면 `빠른 설정 + 시작`을 고르면 됩니다.

이 CLI가 자동으로 해주는 일:

- `.env` 생성 또는 갱신
- 기존 `.env` 백업
- `docker compose -f docker-compose.quickstart.yml up -d --build`
- Docker 자동 시작 여부 점검
- 프론트/백엔드/관리자 계정 연결 테스트
- 관리자 로그인 URL과 QR 출력

설정 중에는 보통 아래만 입력하면 됩니다.

- 사람들이 접속할 주소
- 관리자 비밀번호
- 샘플 데이터를 넣을지 여부
- 게임 썸네일 업로드용 S3 정보를 넣을지 여부

### 자동 구동 완료 후 확인하는 법

1. 브라우저에서 `http://SERVER_IP` 접속
2. CLI가 보여준 관리자 로그인 URL 접속
3. 관리자 비밀번호 입력
4. `/admin` 화면이 열리는지 확인
5. 터미널에서 `univote status` 실행

정상이라면:

- 메인 화면이 열림
- 관리자 로그인 가능
- `univote status`가 health 체크를 통과함

뭔가 안 될 경우:

- [관리자 트러블슈팅 / 현장 이슈 대응 문서](./docs/on-site-playbook.md)
- [univote CLI 문서](./docs/univote-cli.md)
- [서버 빠른 실행 문서](./docs/deploy-quickstart.md)

## 2. 관리자 기능 안내

### 2-1. 행사 전에 해야할 것

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

- 전체 투표 결과 다운로드
- 사용자별 투표 내역 다운로드
- 액셀 파일 정리

바로 볼 문서:

- [행사 마무리 정리](./docs/admin-after-event.md)

## 3. 기타 참고 문서들

- [위키 홈](./docs/README.md)
- [univote CLI](./docs/univote-cli.md)
- [로컬 시험장](./docs/local-test-lab.md)
- [로컬 개발](./docs/local-development.md)
- [구조 및 스택](./docs/architecture.md)
- [기존 quickstart compose 파일](./docker-compose.quickstart.yml)
- [서버 환경변수 예시](./.env.example)
