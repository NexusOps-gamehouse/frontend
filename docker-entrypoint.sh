#!/bin/sh
set -e

# 런타임 환경변수 → dist/config.js 생성.
#
# - env(API_BASE_URL / WS_URL / BACKEND_ORIGIN) 중 하나라도 있으면 config.js 를 새로 쓴다.
# - 셋 다 없으면 빌드에 포함된 기본값(public/config.js → 상대경로)을 그대로 둔다.
#   → ALB same-origin 운영에선 env 를 안 주면 상대경로로 동작한다(entrypoint 사실상 no-op).
#
# 이미지에는 URL 이 박히지 않는다. 값은 컨테이너를 띄우는 쪽(compose / EC2 / CI)에서 주입.

CONFIG_FILE=/usr/share/nginx/html/config.js

if [ -n "${API_BASE_URL}" ] || [ -n "${WS_URL}" ] || [ -n "${BACKEND_ORIGIN}" ]; then
  cat > "${CONFIG_FILE}" <<EOF
window.__ENV__ = {
  API_BASE_URL: "${API_BASE_URL:-/api}",
  WS_URL: "${WS_URL:-/ws}",
  BACKEND_ORIGIN: "${BACKEND_ORIGIN:-}",
};
EOF
  echo "[entrypoint] config.js generated from env (API_BASE_URL=${API_BASE_URL:-/api})"
else
  echo "[entrypoint] no env override → using built-in config.js (relative paths)"
fi

# Compose에서는 서비스명을, Kubernetes에서는 서비스 포트 기본값을 사용한다.
# 제한된 변수만 envsubst하여 nginx의 $uri/$http_* 변수는 보존한다.
USER_UPSTREAM=${USER_UPSTREAM:-user:8080}
POST_UPSTREAM=${POST_UPSTREAM:-post:8080}
CHAT_UPSTREAM=${CHAT_UPSTREAM:-chat:8080}
MATCH_UPSTREAM=${MATCH_UPSTREAM:-match:8080}
CREW_UPSTREAM=${CREW_UPSTREAM:-crew:8080}
if [ -z "${NGINX_RESOLVER:-}" ]; then
  NGINX_RESOLVER="$(awk '$1 == "nameserver" { print $2; exit }' /etc/resolv.conf)"
fi

if [ -z "${NGINX_RESOLVER}" ]; then
  echo "[entrypoint] DNS resolver could not be detected"
  exit 1
fi

export USER_UPSTREAM POST_UPSTREAM CHAT_UPSTREAM MATCH_UPSTREAM CREW_UPSTREAM NGINX_RESOLVER

envsubst '${USER_UPSTREAM} ${POST_UPSTREAM} ${CHAT_UPSTREAM} ${MATCH_UPSTREAM} ${CREW_UPSTREAM} ${NGINX_RESOLVER}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
