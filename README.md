# frontend

GameHouse의 단일 React SPA. 백엔드는 6개로 나뉘어 있지만 사용자가 보는 것은 한 화면이다.

| | |
|---|---|
| 스택 | React 18 · Vite 5 · React Router 6 · axios · STOMP over SockJS |
| 진입점 | `index.html` → `src/main.jsx` → `src/App.jsx` |
| 산출물 | `dist/` — 정적 파일. 서버 렌더링 없음 |

---

## 1. 배포 — develop 과 main 이 다르다

```mermaid
flowchart LR
    A["feature/* → develop PR"] --> V["gitleaks<br/>이미지 빌드 + SPA 기동 확인"]
    B["develop push"] --> V
    C["main push"] --> V

    V -.->|"develop 일 때"| D1["Docker Hub<br/>frontend-develop"]
    V -.->|"main 일 때"| D2["npm run build<br/>↓<br/>S3 sync --delete<br/>↓<br/>CloudFront invalidation"]
```

| | develop | main |
|---|---|---|
| 산출물 | nginx Docker 이미지 | `dist/` 정적 파일 |
| 배포처 | Docker Hub | S3 + CloudFront |
| 인증 | Docker Hub 토큰 | GitHub OIDC → AWS IAM Role |

**운영에는 프론트 Pod 가 없다.** 정적 파일은 S3에 있고 CloudFront가 서빙한다. ALB로 넘어가는 것은 `/api` 와 `/ws`, '/ws-house' 뿐이다.

**main 에서도 이미지 빌드는 한다.** 배포에 쓰지는 않고 빌드가 깨지지 않는지 확인하는 용도다.
검증은 이미지를 띄운 뒤 `HTTP 200` 과 `<div id="root">` 가 함께 나오는지 확인한다. 두 조건을 같이 보는 이유는, nginx가 살아만 있고 빌드 결과가 비어 있어도 200이 나오기 때문이다.

`aws s3 sync --delete` 를 쓴다. 이전 빌드의 해시 붙은 asset이 남으면 버킷이 계속 불어난다.
그 뒤 CloudFront 전체 경로(`/*`)를 무효화한다. `index.html` 이 캐시에 남아 있으면 새 asset을 가리키지 못한다.

EC2 SSM 배포 job 이 `if: false` 로 남아 있다. 예전 dev 구조로 되돌릴 경우를 위한 보존 코드다.

---

## 2. 화면

`Private` 로 감싼 것은 비로그인 시 `/login` 으로 보내고, 원래 가려던 경로를 `state.from` 에 담아 로그인 후 되돌린다.

| 그룹 | 라우트 |
|---|---|
| 메인 | `/` |
| 인증 | `/login` · `/signup` · `/find-id` · `/find-password` |
| 가입 설문 | `/signup/survey` · `/signup/playstyle` · `/signup/confirm` |
| 모집글 | `/post/:id` · `/post/:id/applicants` · 🔒 `/post/new` · 🔒 `/post/:id/edit` |
| 채팅 | 🔒 `/chat` · 🔒 `/chat/:roomId` |
| 친구 · 프로필 | 🔒 `/friends` · 🔒 `/profile/:id` |
| House | `/houses` · `/houses/rankings` · `/houses/:houseId` · 🔒 `/houses/new` · 🔒 `/houses/:houseId/chat` · 🔒 `/houses/:houseId/settings` |
| 커스터마이징 | 🔒 `/customization` · 🔒 `/customization/shop` |
| 마이페이지 | 🔒 `/mypage` · 🔒 `/mypage/edit` |
| 그 외 | `*` → `/` 로 리다이렉트 |

🔒 = 로그인 필요

개발 전용 라우트가 둘 있다. `/chat/preview` 와 `/houses/suggestions/preview` 는 `import.meta.env.DEV` 일 때만 붙고, 운영 빌드에서는 아예 존재하지 않는다.

---

## 3. 경로 → 서비스 라우팅표

프론트 코드에는 상대경로 `/api/...` 만 있다. axios `baseURL` 은 `/api` 하나뿐이고, **어느 서비스로 갈지는 인프라가 정한다.**

| 경로 | 서비스 | 무엇 |
|---|---|---|
| `/api/auth` | **user** | 로그인 · 회원가입 · 중복확인 |
| `/api/users` | **user** | 프로필 · 아이디/비밀번호 찾기 · 라이엇 연동 · 설문 |
| `/api/friends` | **user** | 친구 |
| `/api/notifications` | **user** | 알림 |
| `/uploads` | **user** | 프로필 이미지 (파일을 user 가 소유한다) |
| `/api/posts` | **post** | 파티 모집글 |
| `/api/applications` | **post** | 모집글 신청 |
| `/api/my` | **post** | `/my/posts` · `/my/applications` — 이름과 달리 user 가 아니라 post 소유다 |
| `/api/chat` | **chat** | 채팅방 · 메시지 |
| `/ws` | **chat** | 채팅 WebSocket (SockJS/STOMP) |
| `/api/match` | **match** | 파티 검색 결과 추천 · 노출/클릭/지원 로그 |
| `/api/crew` | **crew** | House 목록 · 상세 · 공지 · 일정 · 추천 |
| `/api/houses` | **crew** | House 단건 조회 |
| `/api/shop` | **crew** | 커스터마이징 상점 |
| `/ws-house` | **crew** | House 채팅 WebSocket |

**riot 은 이 표에 없다.** 브라우저가 직접 부르지 않는 클러스터 내부 전용 서비스다. 라이엇 연동은 `/api/users/riot/*` 로 **user 를 거쳐** 간다.

**이 매핑은 프론트 코드가 아니라 세 파일에 들어 있다.**

| 환경 | 갈라주는 주체 | 파일 |
|---|---|---|
| `npm run dev` | Vite dev server proxy | `vite.config.js` |
| Docker 이미지 (kind · compose) | 컨테이너 안의 nginx | `nginx/default.conf.template` |
| 운영 (EKS) | ALB Ingress | infra 레포 `k8s/components/aws/ingress.yaml` |

> ⚠️ **새 엔드포인트를 추가하면 세 곳을 모두 고쳐야 한다.**
> 한 곳만 고치면 개발에서는 되는데 운영에서 404가 난다. 그 반대도 마찬가지다.

서비스별 주소를 `baseURL` 에 박지 않은 이유는 셋이다.

- 백엔드를 더 쪼개거나 합칠 때마다 프론트를 같이 고쳐야 한다
- 로컬/운영 주소 분기가 프론트 코드로 새어 들어온다
- 서비스를 나눈 목적(한쪽 변경이 다른 쪽에 안 번지게)이 무너진다

`/api` catch-all 은 일부러 두지 않았다. 규칙에 없는 경로는 개발에서 곧바로 실패해야 Ingress 규칙 누락을 배포 전에 발견할 수 있다. 컨테이너의 nginx 도 같은 이유로 `/api/` 는 `index.html` 로 fallback 시키지 않고 JSON 404를 돌려준다.

---

## 4. 디렉터리 구조

```
src/
├── api/          8    백엔드 호출. 화면은 여기만 부른다
├── pages/       41    라우트 하나당 파일 하나 (+ 페이지 전용 CSS)
├── components/  27    화면 간 공유 UI
├── context/      3    Auth · Friend · Theme
├── mocks/        7    백엔드가 아직 없는 영역의 localStorage 저장소
├── assets/      97    로고 · 티어 아이콘 · 커스터마이징 이미지
├── config.js         런타임 설정 리더 (window.__ENV__)
├── constants.js      게임 · 포지션 · 티어 등 고정 목록
├── signupStore.js    가입 3단계에 걸친 입력값 보관
└── utils.js
```

| 디렉터리 | 규칙 |
|---|---|
| `api/` | `client.js` 가 axios 인스턴스 하나를 만들고 나머지가 그걸 쓴다. 요청에 토큰을 붙이고, 401이면 토큰을 지우고 `/login` 으로 보낸다 |
| `pages/` | 화면 하나 = 파일 하나. `App.jsx` 의 라우트 목록과 1:1 |
| `components/` | 두 화면 이상에서 쓰는 것만 올라온다. 한 화면 전용이면 그 페이지 파일 안에 둔다 |
| `context/` | 전역 상태는 이 셋뿐이다. 나머지는 각 페이지의 로컬 상태 |
| `mocks/` | 백엔드가 붙으면 대응하는 `api/*.js` 만 교체하면 되도록 경계를 잡아 두었다 |

**`api/` 바깥에서는 axios 를 직접 부르지 않는다.** 화면이 백엔드 주소나 응답 형태를 알게 되면 서비스 경계가 프론트로 새어 들어온다.

**401 을 받아도 튕기지 않는 경로가 있다.** `client.js` 의 `PUBLIC_PATHS`(`/auth` · `/users/find-email` · `/users/reset-password`)는 비로그인 상태로 부르는 경로다. 여기서 401에 반응해 `/login` 으로 보내면 회원가입 도중 입력값이 전부 날아간다.

**루트의 나머지**

| 경로 | 무엇 |
|---|---|
| `vite.config.js` | dev server 프록시 규칙 (3번 표의 첫 줄) |
| `nginx/` | Docker 이미지가 쓰는 nginx 설정 — SPA fallback + reverse proxy |
| `docker-entrypoint.sh` | 컨테이너 기동 시 환경변수를 읽어 `config.js` 와 nginx upstream 을 생성 |
| `public/config.js` | dev 기본 설정. 빌드 결과에도 포함된다 |
| `.env.example` | dev server 프록시 목적지 (앱이 읽는 설정이 아니다) |
