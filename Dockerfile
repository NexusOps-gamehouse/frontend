# syntax=docker/dockerfile:1

# ── 1) build 스테이지: vite로 dist 생성 (툴체인은 여기서만 사용) ──
FROM node:24-alpine AS build
WORKDIR /app

# 의존성 먼저 설치 → 소스만 바뀔 때 캐시 재사용
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── 2) run 스테이지: nginx가 SPA와 MSA reverse proxy를 함께 제공 ──
FROM nginx:1.27-alpine AS run

# 기존 Compose/Kubernetes 계약인 내부 5173 포트를 유지하면서 non-root로 실행한다.
RUN addgroup -S -g 1000 app \
  && adduser -S -D -H -u 1000 -G app app \
  && mkdir -p /tmp/nginx/proxy_temp /tmp/nginx/client_temp \
  && rm -f /etc/nginx/conf.d/default.conf \
  && chown -R app:app /usr/share/nginx/html /etc/nginx /var/cache/nginx /var/log/nginx /tmp/nginx

WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist ./
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/proxy_params /etc/nginx/proxy_params

# 런타임 env → config.js와 nginx upstream을 생성하는 진입점
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && chown app:app /docker-entrypoint.sh
RUN chown -R app:app /usr/share/nginx/html /etc/nginx /var/cache/nginx /var/log/nginx /tmp/nginx

USER app
EXPOSE 5173

ENTRYPOINT ["/docker-entrypoint.sh"]
