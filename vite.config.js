import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // ---------------------------------------------------------------------------
  // 백엔드가 MSA 로 나뉘면서 프록시 목적지가 서비스별로 갈린다.
  //
  // 프론트 코드는 여전히 상대경로(/api/...)만 쓴다. 서비스별 주소를 axios
  // baseURL 에 박지 않는 이유:
  //   - 백엔드를 더 쪼개거나 합칠 때마다 프론트를 같이 고쳐야 한다
  //   - 로컬/운영 주소 분기가 프론트 코드로 새어 들어온다
  //   - 서비스를 나눈 목적(한쪽 변경이 다른 쪽에 안 번지게)이 무너진다
  // "어느 서비스로 갈지"는 인프라가 정한다. 개발은 이 프록시가, 운영은 Ingress 가.
  //
  // ⚠️ 여기 규칙이 곧 k8s Ingress 의 path 규칙이 된다. 한쪽만 고치면 개발에서는
  //    되는데 운영에서 404 가 난다. 새 엔드포인트를 추가하면 양쪽 다 넣을 것.
  //
  // 일부러 '/api' catch-all 을 두지 않았다. 규칙에 없는 경로는 dev 에서 바로
  // 실패해야 Ingress 규칙 누락을 배포 전에 발견한다.
  // ---------------------------------------------------------------------------
  const userOrigin = env.VITE_USER_ORIGIN || 'http://localhost:8081';
  const postOrigin = env.VITE_POST_ORIGIN || 'http://localhost:8082';
  const chatOrigin = env.VITE_CHAT_ORIGIN || 'http://localhost:8083';
  const matchOrigin = env.VITE_MATCH_ORIGIN || 'http://localhost:8085';
  const crewOrigin = env.VITE_CREW_ORIGIN || 'http://localhost:8086';

  // riot(:8084) 은 여기에 없다. 클러스터 내부 전용이라 브라우저가 직접 부르지
  // 않는다. 라이엇 연동은 /api/users/riot/* 로 user 를 거쳐 간다.

  return {
    plugins: [react()],
    define: {
      global: 'window', // sockjs-client 호환
    },
    server: {
      proxy: {
        // ── user :8081 ──────────────────────────────────────────────
        '/api/auth': userOrigin,          // 로그인 · 회원가입 · 중복확인
        '/api/users': userOrigin,         // 프로필 · 아이디찾기 · 라이엇 연동 · 설문
        '/api/friends': userOrigin,
        '/api/notifications': userOrigin,
        '/uploads': userOrigin,           // 프로필 이미지 (user 가 파일을 소유)

        // ── crew : House 목록·상세 ────────────────────────────────
        '/api/crew': crewOrigin,
        '/api/houses': crewOrigin,
        '/api/shop': crewOrigin,
        '/ws-house': {
          target: crewOrigin,
          ws: true,
        },

        // ── post :8082 ──────────────────────────────────────────────
        '/api/posts': postOrigin,
        '/api/applications': postOrigin,
        '/api/my': postOrigin,            // /my/posts · /my/applications

        // ── chat :8083 ──────────────────────────────────────────────
        '/api/chat': chatOrigin,
        '/ws': {
          target: chatOrigin,
          ws: true,                       // WebSocket 업그레이드 (SockJS/STOMP)
        },

        // ── match :8085 ─────────────────────────────────────────────
        '/api/match': matchOrigin,        // 방 찾기 결과 추천 (POST /search), 노출/클릭/지원 로그
      },
    },
  };
});
