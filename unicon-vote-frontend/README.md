# unicon-vote-frontend

UNICON Vote App의 프론트엔드입니다.

전체 실행 방법과 서버 배포 가이드는 루트 README를 먼저 보는 것을 권장합니다.

- 루트 문서: [`README.md`](../README.md)

## 개발 실행

```bash
cp .env_template .env
npm install -g pnpm
pnpm install
pnpm dev
```

기본 환경변수:

```env
VITE_API_BASE_URL=http://localhost:5001
```

## 빌드

```bash
pnpm build
```
