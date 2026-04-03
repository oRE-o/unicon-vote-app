# 행사 전 게임 데이터 준비

이 문서는 행사 시작 전에 운영자가 관리자 모드에서 게임 정보와 썸네일을 준비하는 방법을 설명합니다.

## 먼저 해야 하는 일

행사 전에는 아래 순서대로 하면 가장 편합니다.

1. 서버가 열리는지 확인
2. 관리자 계정으로 로그인
3. 게임 목록 등록
4. 설명, 부문, 개발자 정보 입력
5. 썸네일 등록
6. 일반 사용자 화면에서 한 번 검수

## 준비 작업 개요

행사 시작 전에 보통 아래 작업이 필요합니다.

1. 서비스가 서버에서 실행 중인지 확인
2. 관리자 계정으로 로그인
3. 게임 출품 목록 등록
4. 각 게임의 설명, 참가 부문, 개발자 정보 입력
5. 썸네일 URL 입력 또는 썸네일 파일 업로드
6. 최종 확인

## 관리자 로그인 위치

운영 서버에서 보통 아래 순서로 들어갑니다.

1. `http://SERVER_IP/login?uuid=<ADMIN_UUID>` 접속
2. 관리자 비밀번호 입력
3. 로그인 후 `/admin` 이동

도메인을 붙였다면 `SERVER_IP` 대신 실제 도메인을 사용하면 됩니다.

HTTPS 서버라면 `http://` 대신 `https://` 주소를 사용하세요.

## 관리자 화면에서 할 수 있는 것

현재 관리자 대시보드에서는 아래를 지원합니다.

- 새 게임 추가
- 기존 게임 수정
- 썸네일 CDN URL 직접 입력
- S3 호환 스토리지에 썸네일 업로드
- 등록된 게임 목록 확인
- 잘못 들어간 게임 삭제

## 썸네일 입력 방식 2가지

### 방법 A. CDN URL 직접 입력

가장 단순한 방법입니다.

1. 이미지를 S3, CloudFront, R2, Bunny, 사내 CDN 등 원하는 곳에 올립니다.
2. 공개 접근 가능한 이미지 URL을 복사합니다.
3. 관리자 화면의 `썸네일 CDN URL 직접 입력` 칸에 붙여넣습니다.

이 방법은 스토리지 업로드 기능 설정이 없어도 바로 쓸 수 있습니다.

처음 준비하는 사람이라면 이 방식이 가장 단순합니다.

### 방법 B. 관리자 화면에서 파일 업로드

이 방법을 쓰려면 서버에 S3 호환 스토리지 환경변수를 먼저 넣어야 합니다.

지원 개념:

- AWS S3
- CloudFront 앞단을 둔 S3
- Cloudflare R2
- MinIO
- 기타 S3-compatible object storage

## S3 호환 스토리지 환경변수

서버 `.env`에 아래 값을 넣습니다.

```env
S3_REGION=ap-northeast-2
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_ENDPOINT=
S3_PUBLIC_BASE_URL=https://cdn.example.com
S3_FORCE_PATH_STYLE=false
```

### 각 값 설명

- `S3_REGION`: 리전
- `S3_BUCKET`: 버킷 이름
- `S3_ACCESS_KEY_ID`: 액세스 키
- `S3_SECRET_ACCESS_KEY`: 시크릿 키
- `S3_ENDPOINT`: AWS가 아닌 S3 호환 스토리지를 쓸 때 주로 사용
- `S3_PUBLIC_BASE_URL`: 최종 공개 URL의 앞부분
- `S3_FORCE_PATH_STYLE`: MinIO 같은 환경에서 필요할 수 있음

잘 모르겠다면 보통 아래처럼 이해하면 됩니다.

- AWS S3면 `S3_ENDPOINT`는 비워도 되는 경우가 많습니다.
- Cloudflare R2나 MinIO면 `S3_ENDPOINT`가 필요한 경우가 많습니다.
- 사용자가 실제로 보게 될 이미지 주소 앞부분은 `S3_PUBLIC_BASE_URL`입니다.

## 권장 설정 예시

### AWS S3 + CloudFront

```env
S3_REGION=ap-northeast-2
S3_BUCKET=unicon-vote-assets
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_BASE_URL=https://cdn.example.com
S3_FORCE_PATH_STYLE=false
```

### Cloudflare R2

```env
S3_REGION=auto
S3_BUCKET=unicon-vote-assets
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_PUBLIC_BASE_URL=https://cdn.example.com
S3_FORCE_PATH_STYLE=true
```

## 관리자 화면에서 게임 추가

관리자 대시보드의 `게임/썸네일 준비` 섹션을 사용합니다.

입력 항목:

- 게임 이름
- 게임 설명
- 참가 부문
- 개발자 목록
- 썸네일 URL 또는 업로드 파일

### 개발자 목록 형식

권장 형식은 아래와 같습니다.

```text
동아리_이름, 동아리_이름, 외부팀_이름
```

예시:

```text
GameMakers_김메이커, DevSisters_이개발
```

이 형식은 투표 제한 로직과 필터링 UI에서 쓰이므로 되도록 맞추는 것이 좋습니다.

## 관리자 화면에서 썸네일 업로드

1. `썸네일 파일 업로드`에서 이미지 파일을 선택합니다.
2. `썸네일 업로드` 버튼을 누릅니다.
3. 성공하면 이미지 URL 입력칸에 자동으로 반영됩니다.
4. 미리보기가 정상인지 확인합니다.
5. `게임 추가` 또는 `게임 저장`을 누릅니다.

업로드가 안 될 때는 보통 아래 둘 중 하나입니다.

- 서버에 S3 관련 환경변수가 없음
- 버킷/권한/공개 URL 설정이 맞지 않음

따라서 처음 설정할 때는 이미지를 1장만 먼저 올려보고, 미리보기와 실제 사용자 화면을 모두 확인한 뒤 나머지를 등록하는 편이 안전합니다.

## 기존 게임 수정

등록된 게임 목록에서 `수정` 버튼을 누르면 다음을 바꿀 수 있습니다.

- 이름
- 설명
- 부문
- 개발자 목록
- 썸네일 URL
- 새 썸네일 업로드

행사 직전에는 특히 아래를 다시 점검하세요.

- 오타
- 설명 길이
- 썸네일 잘림 여부
- 참가 부문
- 개발자 표기 형식

## 운영 전 최종 체크리스트

아래 여섯 가지가 모두 맞으면 행사 전 게임 데이터 준비는 끝난 상태입니다.

1. 모든 게임이 등록되어 있는지 확인
2. 각 게임 설명이 너무 짧거나 비어 있지 않은지 확인
3. 썸네일이 정상적으로 보이는지 확인
4. 개발자 목록 형식이 `동아리_이름` 규칙을 따르는지 확인
5. 챌린저/루키 부문이 올바르게 들어갔는지 확인
6. 일반 사용자 화면에서 카드가 잘 보이는지 확인

## 주의

- 썸네일 업로드 기능은 서버 환경변수가 설정된 경우에만 동작합니다.
- 설정이 없다면 URL 직접 입력 방식으로도 운영할 수 있습니다.
- 실제 운영 서버에서 먼저 소량으로 한 번 업로드해보고, 공개 URL이 정상 노출되는지 확인한 뒤 전체 등록을 진행하는 것을 권장합니다.
