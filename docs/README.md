# UNICON Vote App Wiki

이 문서는 처음 프로젝트를 받는 개발자와, 행사 현장에서 운영하는 스태프가 바로 참고할 수 있도록 정리한 위키입니다.

## 운영 문서

- [계정 접속 흐름](./account-access-flow.md)
  QR 접속 후 로그인/회원가입이 실제로 어떻게 분기되는지 설명합니다.
- [관리자 대시보드 사용법](./admin-operations.md)
  관리자 화면의 주요 섹션과 버튼이 무엇을 하는지 설명합니다.
- [현장 이슈 대응 플레이북](./on-site-playbook.md)
  QR 손상, 비밀번호 분실, 이름 오류, 등록 누락 같은 상황에서 바로 따라할 수 있는 절차를 정리했습니다.

## 실행 문서

- [univote CLI](./univote-cli.md)
  화살표 기반 quickstart 마법사로 `.env` 작성, 실행, health 체크, 관리자 QR 확인까지 한 번에 진행합니다.
- [로컬 시험장](./local-test-lab.md)
  샘플 데이터가 자동으로 들어가는 mock DB 기반 시험 환경입니다. 종료 시 흔적 없이 정리하는 방법까지 설명합니다.
- [서버 빠른 실행](./deploy-quickstart.md)
  Docker 기준으로 서버에서 가장 쉽게 올리는 방법입니다.
- [로컬 개발](./local-development.md)
  백엔드, 프론트엔드, MongoDB를 개발 환경에서 띄우는 방법입니다.

## 기술 문서

- [행사 전 게임 데이터 준비](./game-catalog-setup.md)
  관리자 모드에서 게임 정보와 썸네일을 넣는 방법, S3형 스토리지 설정 방법을 설명합니다.
- [구조 및 스택](./architecture.md)
  서비스 구조, 폴더 구조, 주요 기술 스택, 핵심 API 흐름을 정리했습니다.
