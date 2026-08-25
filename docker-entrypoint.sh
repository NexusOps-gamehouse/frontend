#!/bin/sh
set -e

# 런타임 환경변수 → dist/config.js 생성.
#
# - env(API_BASE_URL / WS_URL / BACKEND_ORIGIN) 중 하나라도 있으면 config.js 를 새로 쓴다.
# - 셋 다 없으면 빌드에 포함된 기본값(public/config.js → 상대경로)을 그대로 둔다.
#   → ALB same-origin 운영에선 env 를 안 주면 상대경로로 동작한다(entrypoint 사실상 no-op).
#
# 이미지에는 URL 이 박히지 않는다. 값은 컨테이너를 띄우는 쪽(compose / EC2 / CI)에서 주입.

CONFIG_FILE=/app/dist/config.js

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

# -s: SPA fallback(없는 경로 → index.html) / -l: 리슨 포트
exec serve -s dist -l 5173
