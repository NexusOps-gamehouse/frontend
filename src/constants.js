export const GAMES = ['리그오브레전드', '발로란트', '기타'];
export const GAME_MODES = ['일반', '랭크', '칼바람', '기타'];
export const ANY = '상관없음';
export const POSITIONS = ['탑', '정글', '미드', '원딜', '서폿', ANY];
export const TIERS = ['언랭', '아이언', '브론즈', '실버', '골드', '플래티넘', '에메랄드', '다이아몬드', '마스터 이상'];
export const PLAY_TIMES = ['아침', '낮', '저녁', '새벽'];
export const PLAY_DAYS = ['월', '화', '수', '목', '금', '토', '일', ANY];
export const MEMBER_COUNTS = [2, 3, 4, 5];

export const PLAY_STYLES = ['빡겜', '즐겜'];

/** 마이크 선호 3단계. match 서비스의 MatchSearchRequest.micLevel(REQUIRED|PREFERRED|ANY)과 짝을 맞춘다. */
export const MIC_LEVELS = [
  { label: '필수', code: 'REQUIRED' },
  { label: '있으면 좋음', code: 'PREFERRED' },
  { label: '상관없음', code: 'ANY' },
];

/**
 * 스마트 매칭(match/new) 검색 폼이 게임에 따라 다르게 보여줄 옵션들.
 * 포지션/역할·티어 서열·게임모드는 게임마다 어휘가 달라서(예: LOL 포지션 vs
 * 발로란트 역할, LOL 티어 vs 발로란트 티어) post/new와 같은 구조로 게임 선택 →
 * 조건부 하위 질문 흐름을 만든다. 티어 목록은 match 백엔드의
 * LolMatchingStrategy/ValorantMatchingStrategy 서열표와 맞춰뒀다.
 */
export const MATCH_GAME_CONFIG = {
  리그오브레전드: {
    positionLabel: '포지션',
    positions: ['탑', '정글', '미드', '원딜', '서폿'],
    tiers: ['아이언', '브론즈', '실버', '골드', '플래티넘', '에메랄드', '다이아몬드', '마스터 이상'],
    gameModes: ['일반', '랭크', '칼바람'],
  },
  발로란트: {
    positionLabel: '역할',
    positions: ['듀얼리스트', '이니시에이터', '컨트롤러', '센티널'],
    tiers: ['아이언', '브론즈', '실버', '골드', '플래티넘', '다이아몬드', '초월자', '불멸', '레디언트'],
    gameModes: ['일반', '경쟁전', '데스매치', '기타'],
  },
};
