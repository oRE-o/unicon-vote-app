# UNICON Vote App Wiki

처음 서버를 여는 사람과 행사 운영자가 필요한 문서를 빠르게 찾을 수 있도록 나눈 위키입니다.

## 어떤 문서를 먼저 보면 되나요?

상황별로 보면 가장 빠릅니다.

- 서버를 처음 띄우는 중이다: [univote CLI](./univote-cli.md)
- CLI 없이 직접 배포하고 싶다: [서버 빠른 실행](./deploy-quickstart.md)
- 행사 전 관리자 준비를 하고 있다: [행사 전 관리자 준비](./admin-before-event.md)
- 행사 중 문제가 생겼다: [관리자 트러블슈팅 / 현장 이슈 대응](./on-site-playbook.md)
- 로컬에서 시험 실행만 해보고 싶다: [로컬 시험장](./local-test-lab.md)

## 1. 가장 먼저 볼 문서

- [univote CLI](./univote-cli.md)
  가장 쉬운 설치 방법입니다. 서버에 처음 올릴 때 가장 먼저 보는 문서입니다.
- [서버 빠른 실행](./deploy-quickstart.md)
  `.env`를 직접 편집하는 방식입니다. CLI 없이도 배포할 수 있습니다.
- [로컬 시험장](./local-test-lab.md)
  DNS 없이 앱을 바로 눌러보고 싶을 때 가장 빠른 경로입니다.

## 2. 배포 준비 문서

- [서버 빌리기 가이드](./server-rental-guide.md)
- [DNS 연결 가이드](./dns-setup.md)
- [포트 열기 / 방화벽 가이드](./port-opening.md)

## 3. 관리자 기능 문서

- [행사 전 관리자 준비](./admin-before-event.md)
  행사 전에 꼭 끝내야 하는 준비 목록입니다.
- [행사 중 관리자 운영](./admin-during-event.md)
  QR 오류, 비밀번호 초기화, 팔찌 교체 같은 현장 대응 문서입니다.
- [행사 마무리 정리](./admin-after-event.md)
  결과 XLSX 저장과 백업 절차를 정리한 문서입니다.
- [관리자 대시보드 사용법](./admin-operations.md)
  관리자 화면 전체 구성과 기능 설명입니다.
- [관리자 트러블슈팅 / 현장 이슈 대응](./on-site-playbook.md)
  실제 행사장에서 문제 생겼을 때 가장 먼저 열 문서입니다.
- [계정 접속 흐름](./account-access-flow.md)
  기명식 / 무기명식 팔찌와 로그인 흐름 설명입니다.

## 4. 기타 참고 문서

- [행사 전 게임 데이터 준비](./game-catalog-setup.md)
  게임 제목, 설명, 썸네일, 개발자 정보 등록 방법입니다.
- [로컬 시험장](./local-test-lab.md)
  내 컴퓨터에서 잠깐 테스트하고 깨끗하게 종료하는 문서입니다.
- [로컬 개발](./local-development.md)
  프론트엔드/백엔드 개발용 문서입니다.
- [구조 및 스택](./architecture.md)
  프로젝트 구조와 사용하는 기술 정리입니다.
