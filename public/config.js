// 런타임 환경설정 (개발 기본값).
//
// - 이 파일은 Vite 가 public/ → dist/ 로 "가공 없이" 복사한다.
// - 개발(npm run dev): 아래 상대경로 그대로 사용 → vite server.proxy 가 백엔드로 프록시.
// - 컨테이너(serve): docker-entrypoint.sh 가 환경변수로 이 파일을 "덮어쓴다".
//   (env 가 없으면 덮어쓰지 않으므로 아래 기본값이 그대로 남는다 → ALB same-origin 대응)
//
// 코드에서는 import.meta.env 대신 src/config.js 를 통해 window.__ENV__ 를 읽는다.
window.__ENV__ = {
  API_BASE_URL: "/api",
  WS_URL: "/ws",
  BACKEND_ORIGIN: "",
};
