import { useEffect, useState } from 'react';
import api from './client';

/* ==================================================================
 * POST /api/users/riot/sync
 *   body: { gameName, tagLine }
 *   res : RiotProfileResponseDTO
 *
 * ⚠️ 조회가 아니라 "저장"이다. Authentication을 받아 해당 유저 레코드를
 *    갱신하므로 토큰이 필요하다. 회원가입 중에는 쓸 수 없고,
 *    로그인 후 마이페이지에서 연동한다. (RiotLinkCard)
 * baseURL이 '/api'라 앞의 /api는 빼고 쓴다.
 * ================================================================== */
const SYNC_ENDPOINT = '/users/riot/sync';

/* ---------------------------- 조회 ---------------------------- */

/** "Hide on bush#KR1" → { gameName, tagLine } / 형식 오류면 null */
export function parseRiotId(input) {
  const raw = (input ?? '').trim();
  if (!raw) return null;

  const idx = raw.lastIndexOf('#');
  if (idx === -1) return { gameName: raw, tagLine: 'KR1' };  // 태그 생략 시 기본값
  const gameName = raw.slice(0, idx).trim();
  const tagLine = raw.slice(idx + 1).trim();
  if (!gameName || !tagLine) return null;
  return { gameName, tagLine };
}

export const formatRiotId = (gameName, tagLine) =>
  gameName ? `${gameName}#${tagLine ?? ''}`.replace(/#$/, '') : '';

/** 로그인 상태에서만 호출 가능. 서버가 조회 후 유저 레코드에 저장까지 한다. */
export async function syncRiotProfile({ gameName, tagLine }) {
  try {
    const { data } = await api.post(SYNC_ENDPOINT, { gameName, tagLine });
    return normalizeProfile(data);
  } catch (err) {
    if (import.meta.env.DEV) {
      // 화면 문구는 뭉뚱그려져 있으니 개발 중엔 실제 응답을 남긴다
      console.error('[riot] 조회 실패',
        { url: SYNC_ENDPOINT, sent: { gameName, tagLine },
          status: err?.response?.status, body: err?.response?.data });
    }
    throw err;
  }
}

export function riotErrMsg(err) {
  const status = err?.response?.status;
  const serverMsg = err?.response?.data?.message;

  // 백엔드가 IllegalArgumentException을 400 + {message}로 내려준다.
  // (예: "이미 다른 계정과 연동된 Riot 계정입니다.")
  if (status === 400 && serverMsg) return serverMsg;

  if (status === 404) return '그 이름의 소환사를 찾지 못했어요. 이름과 태그를 다시 확인해 주세요.';
  if (status === 409) return serverMsg || '이미 다른 계정에 연동된 롤 계정이에요.';
  if (status === 429) return '조회 요청이 몰렸어요. 30초 뒤에 다시 시도해 주세요.';
  return '게임 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
}

/* ------------------------- 응답 정규화 -------------------------
 * 필드명은 백엔드 "코드" 기준으로 고정한다. (문서와 다름)
 *   RiotProfileResponseDTO.championMasteries[].championMasteryLevel / championMasteryPoints
 * 모집글 참가자는 DB에서 오므로 masteryLevel / masteryPoints 로 온다. 둘 다 받는다.
 * -------------------------------------------------------------- */

const toMastery = (m, i) => ({
  ranking: m.ranking ?? i + 1,
  championId: Number(m.championId),
  level: Number(m.championMasteryLevel ?? m.masteryLevel ?? 0),
  points: Number(m.championMasteryPoints ?? m.masteryPoints ?? 0),
});

const build = (src, list) => {
  const tier = src.tier || null;
  return {
    puuid: src.puuid ?? null,
    gameName: src.gameName ?? '',
    tagLine: src.tagLine ?? '',
    profileIconId: src.profileIconId ?? null,
    summonerLevel: src.summonerLevel ?? null,

    // 언랭이면 tier가 null. 백엔드가 int 원시타입이면 lp/승/패는 0으로 오므로
    // ranked 플래그로만 판단하고 숫자는 믿지 않는다.
    ranked: Boolean(tier),
    tierVerified: isRiotTier(tier),
    tier,
    rank: src.rank ?? null,
    leaguePoints: src.leaguePoints ?? 0,
    wins: src.wins ?? 0,
    losses: src.losses ?? 0,

    masteries: (list ?? []).filter((m) => !m.game || m.game === 'LOL').map(toMastery),
  };
};

/** 라이엇 조회 응답 → 내부 모양 */
export function normalizeProfile(raw) {
  if (!raw) return null;
  if (import.meta.env.DEV && !Array.isArray(raw.championMasteries)) {
    console.warn('[riot] championMasteries 없음. 백엔드 응답 필드명 확인:', raw);
  }
  return build(raw, raw.championMasteries);
}

/** UserDto(모집글 참가자) → 내부 모양 */
export function profileFromUser(user) {
  if (!user?.gameName) return null;
  return build(user, user.championMasteries ?? user.masteries);
}

/* ---------------------------- 티어 ---------------------------- */

const TIER_TABLE = [
  { key: 'IRON',        ko: '아이언' },
  { key: 'BRONZE',      ko: '브론즈' },
  { key: 'SILVER',      ko: '실버' },
  { key: 'GOLD',        ko: '골드' },
  { key: 'PLATINUM',    ko: '플래티넘' },
  { key: 'EMERALD',     ko: '에메랄드' },
  { key: 'DIAMOND',     ko: '다이아몬드' },
  { key: 'MASTER',      ko: '마스터 이상' },
  { key: 'GRANDMASTER', ko: '마스터 이상' },
  { key: 'CHALLENGER',  ko: '마스터 이상' },
];

const APEX = ['MASTER', 'GRANDMASTER', 'CHALLENGER'];

const isRiotTier = (tier) => TIER_TABLE.some((t) => t.key === tier);

/** 라이엇 enum → constants.js의 TIERS 값. 마스터 이상은 하나로 묶인다. */
export function riotTierToSurveyTier(tier) {
  return TIER_TABLE.find((t) => t.key === tier)?.ko ?? '언랭';
}

/** "다이아몬드 II" / "챌린저" / "언랭". 설문에서 직접 고른 값은 그대로 돌려준다. */
export function tierText(p) {
  if (!p?.ranked) return '언랭';
  if (!p.tierVerified) return p.tier;
  const ko = TIER_TABLE.find((t) => t.key === p.tier)?.ko ?? p.tier;
  if (APEX.includes(p.tier)) {
    return { MASTER: '마스터', GRANDMASTER: '그랜드마스터', CHALLENGER: '챌린저' }[p.tier];
  }
  return `${ko} ${p.rank ?? ''}`.trim();
}

/** 화면 표시용 티어명. 설문 한글값이면 그대로, 라이엇 enum이면 한글로 바꾼다. */
export function tierLabel(tier) {
  if (!tier) return '';
  const t = TIER_TABLE.find((x) => x.key === tier);
  if (!t) return tier;                                    // 설문에서 직접 고른 값
  return { MASTER: '마스터', GRANDMASTER: '그랜드마스터', CHALLENGER: '챌린저' }[tier] ?? t.ko;
}

/** UserDto → "다이아몬드 II" / "골드" / "" */
export function userTierText(u) {
  if (!u?.tier) return '';
  const label = tierLabel(u.tier);
  if (!isRiotTier(u.tier) || APEX.includes(u.tier) || !u.rank) return label;
  return `${label} ${u.rank}`;
}

export function winRate(wins, losses) {
  const total = (wins ?? 0) + (losses ?? 0);
  if (!total) return null;
  return Math.round((wins / total) * 100);
}

/* ------------------------- Data Dragon -------------------------
 * 백엔드가 championId만 주므로 이름·이미지는 프론트에서 매핑한다.
 * -------------------------------------------------------------- */

const DDRAGON = 'https://ddragon.leagueoflegends.com';
const FALLBACK_VERSION = '15.1.1';

let versionPromise;
let championPromise;

function loadVersion() {
  if (!versionPromise) {
    versionPromise = fetch(`${DDRAGON}/api/versions.json`)
      .then((r) => r.json()).then((v) => v[0]).catch(() => FALLBACK_VERSION);
  }
  return versionPromise;
}

function loadChampions() {
  if (!championPromise) {
    championPromise = loadVersion()
      .then((v) => fetch(`${DDRAGON}/cdn/${v}/data/ko_KR/champion.json`))
      .then((r) => r.json())
      .then((json) => {
        const map = {};
        Object.values(json.data).forEach((c) => { map[Number(c.key)] = { key: c.id, name: c.name }; });
        return map;
      })
      .catch(() => ({}));
  }
  return championPromise;
}

/** 버전·챔피언 맵을 한 번만 받아온다 (모듈 캐시라 재호출 없음) */
export function useDdragon() {
  const [state, setState] = useState({ version: FALLBACK_VERSION, champions: {} });
  useEffect(() => {
    let alive = true;
    Promise.all([loadVersion(), loadChampions()])
      .then(([version, champions]) => { if (alive) setState({ version, champions }); });
    return () => { alive = false; };
  }, []);
  return state;
}

export const profileIconUrl = (version, id) => `${DDRAGON}/cdn/${version}/img/profileicon/${id}.png`;
export const championIconUrl = (version, key) => `${DDRAGON}/cdn/${version}/img/champion/${key}.png`;
