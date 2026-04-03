# 로컬 개발

처음 보는 사람이 앱을 눌러보는 목적이라면 [로컬 시험장](./local-test-lab.md)이 더 쉽습니다.

이 문서는 코드를 수정하면서 개발할 때 쓰는 방식입니다.

## 요구사항

- Node.js 18 이상
- pnpm
- MongoDB

`pnpm`이 없다면 먼저 설치하세요.

```bash
npm install -g pnpm
```

## Backend

```bash
cd unicon-vote-backend
cp .env_template .env
pnpm install
pnpm dev
```

권장 `.env`:

```env
MONGO_URI=mongodb://localhost:27017/unicon_vote
JWT_SECRET=replace-with-a-long-random-string
ADMIN_UUID=00000000-0000-0000-0000-000000000000
ADMIN_PASSWORD=ChangeMe1234!
CORS_ORIGIN=http://localhost:5173
PORT=5001
SEED_SAMPLE_DATA=false
```

샘플 사용자와 샘플 게임까지 자동으로 넣고 개발하고 싶다면 `SEED_SAMPLE_DATA=true`로 바꿔도 됩니다.

## Frontend

```bash
cd unicon-vote-frontend
cp .env_template .env
pnpm install
pnpm dev
```

권장 `.env`:

```env
VITE_API_BASE_URL=http://localhost:5001
```

## MongoDB를 Docker로 간단히 띄우기

```bash
docker run -d \
  --name unicon-mongo \
  -p 27017:27017 \
  mongo:7
```

## 기본 포트

- 프론트엔드 Vite: `5173`
- 백엔드 API: `5001`
- MongoDB: `27017`
