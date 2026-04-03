# unicon-vote-backend

UNICON Vote App의 백엔드입니다.

전체 실행 방법과 서버 배포 가이드는 루트 README를 먼저 보는 것을 권장합니다.

- 루트 문서: [`README.md`](../README.md)

## 개발 실행

```bash
cp .env_template .env
npm install -g pnpm
pnpm install
pnpm dev
```

기본 포트:

```text
5001
```

기본 환경변수 예시:

```env
MONGO_URI=mongodb://localhost:27017/unicon_vote
JWT_SECRET=replace-with-a-long-random-string
ADMIN_UUID=00000000-0000-0000-0000-000000000000
ADMIN_PASSWORD=ChangeMe1234!
CORS_ORIGIN=http://localhost:5173
PORT=5001
```
