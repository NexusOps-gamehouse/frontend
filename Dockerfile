# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /app

# 의존성 먼저 설치 → 소스만 바뀔 때 캐시 재사용
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# alpine-slim: 부가 모듈 제외 경량판. 리버스 프록시는 nginx 코어라 포함됨
FROM nginx:1.31-alpine-slim AS run
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
