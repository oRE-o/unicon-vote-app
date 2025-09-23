
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g pnpm

RUN pnpm install

COPY . .

RUN pnpm run build


FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install -g pnpm
RUN pnpm install --prod

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 5001

CMD [ "node", "dist/server.js" ]