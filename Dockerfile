# syntax=docker/dockerfile:1

# ── 1) build 스테이지: vite로 dist 생성 (툴체인은 여기서만 사용) ──
FROM node:24-alpine AS build
WORKDIR /app

# 의존성 먼저 설치 → 소스만 바뀔 때 캐시 재사용
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── 2) run 스테이지: dist만 serve로 서빙 (vite·소스·node_modules 없음) ──
FROM node:24-alpine AS run
WORKDIR /app

# serve: vite에 묶이지 않은 독립 정적 서버 (preview 대신)
RUN npm i -g serve

# build 스테이지 결과물(dist)만 가져옴 → 이미지 슬림
COPY --from=build /app/dist ./dist

# 런타임에 env → dist/config.js 를 생성하는 진입점
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 5173

# entrypoint 가 config.js 생성 후 serve 실행 (내부에서 exec serve ...)
ENTRYPOINT ["/docker-entrypoint.sh"]
