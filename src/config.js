// 런타임 환경설정 리더.
//
// 우선순위: window.__ENV__ (config.js 런타임 주입) → 기본값(상대경로)
//
// window.__ENV__ 는 index.html 이 로드하는 /config.js 가 채운다.
// (dev 는 public/config.js, 컨테이너는 entrypoint 가 생성한 dist/config.js)
//
// 값은 항상 config.js(window.__ENV__)로 들어오므로 import.meta.env 는 읽지 않는다.
// (도커 빌드에선 .env 가 .dockerignore 로 빠져 어차피 undefined 라 무의미)
// dev 의 /api·/ws 프록시 목적지는 vite.config.js 가 처리한다.
// 백엔드가 MSA 로 나뉜 뒤로는 경로별로 목적지가 다르다(VITE_USER/POST/CHAT_ORIGIN).

const env = (typeof window !== 'undefined' && window.__ENV__) || {};

export const API_BASE_URL = env.API_BASE_URL || '/api';

export const WS_URL = env.WS_URL || '/ws';

// 명시적으로 "" 를 주면(=same-origin) 그대로 존중해야 하므로 키 존재 여부로 판별.
export const BACKEND_ORIGIN = 'BACKEND_ORIGIN' in env ? env.BACKEND_ORIGIN : '';

/**
 * 백엔드가 내려주는 업로드 경로(`/uploads/..`)를 실제 접근 가능한 URL 로 변환.
 * - 다른 오리진(serve 컨테이너): BACKEND_ORIGIN 을 prefix.
 * - 같은 오리진(dev 프록시 / ALB): BACKEND_ORIGIN 이 "" 라 상대경로 그대로.
 */
export function assetUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//.test(path)) return path; // 이미 절대 URL
  if (BACKEND_ORIGIN && path.startsWith('/uploads')) return BACKEND_ORIGIN + path;
  return path;
}
