export const GAMES = ['리그오브레전드', '발로란트', '기타'];
export const GAME_MODES = ['일반', '랭크', '칼바람', '기타'];
export const ANY = '상관없음';
export const POSITIONS = ['탑', '정글', '미드', '원딜', '서폿', ANY];
export const TIERS = ['언랭', '아이언', '브론즈', '실버', '골드', '플래티넘', '에메랄드', '다이아몬드', '마스터 이상'];
export const PLAY_TIMES = ['아침', '낮', '저녁', '새벽'];
export const PLAY_DAYS = ['월', '화', '수', '목', '금', '토', '일', ANY];
export const MEMBER_COUNTS = [2, 3, 4, 5];

/**
 * 1회 플레이 선호 분량.
 *
 * 시간대(언제 하는가)와 분량(한 번 잡으면 얼마나 하는가)은 다른 축이다.
 * "저녁에 논다"가 같아도 한쪽은 두 판만 하고 빠지고 한쪽은 새벽까지 간다.
 * 파티가 깨지는 흔한 이유라 따로 받는다.
 */
export const PLAY_DURATIONS = ['1~2시간', '2~4시간', '4~6시간', '6시간 이상'];

/** 회원가입 나이 입력 허용 범위 — 프론트·백엔드가 같은 값을 쓴다. */
export const AGE_MIN = 10;
export const AGE_MAX = 99;

/**
 * 회원가입 흐름 구성.
 *
 *   'split'  — 정보입력 → 프로필(5개) → 성향설문(12문항) → 확인   (4단계)
 *   'single' — 정보입력 → 프로필 + 성향설문 한 화면 → 확인        (3단계)
 *
 * 라우팅·진행바·버튼 문구가 전부 이 값을 보고 갈라진다. 화면마다 숫자를
 * 하드코딩해두면 구성을 바꿀 때 3/3 과 4/4 가 섞여 남는다.
 */
export const SIGNUP_FLOW = 'split';

export const SIGNUP_STEP_TOTAL = SIGNUP_FLOW === 'split' ? 4 : 3;

/** 성향 설문 6영역. 12문항을 매칭 점수로 환산할 때의 묶음 단위다. */
export const SURVEY_AREAS = [
  { key: 'WIN_ORIENTATION',  label: '승리 지향성',  emoji: '🏆' },
  { key: 'MISTAKE_TOLERANCE', label: '실수 관용도', emoji: '🤝' },
  { key: 'COMMUNICATION',    label: '소통 적극성',  emoji: '💬' },
  { key: 'FOCUS',            label: '플레이 집중도', emoji: '🎮' },
  { key: 'INITIATIVE',       label: '주도성',       emoji: '🧭' },
  { key: 'SOCIALITY',        label: '친목 성향',    emoji: '🧑‍🤝‍🧑' },
];

/**
 * 성향 설문 12문항 (1~5점).
 *
 * low / high 는 1점과 5점 끝이 무슨 뜻인지 알려주는 라벨이다. 숫자만 두면
 * "5가 좋은 건가?"를 각자 다르게 해석해서 같은 성향이 다른 점수로 들어온다.
 *
 * 9번(내 주도성)과 10번(상대의 주도성 선호)은 같은 영역이지만 의미가 반대편이다.
 * 평균을 내면 "이끄는 사람"과 "이끌리고 싶은 사람"이 같은 점수가 되어버리므로
 * 백엔드에서 축을 둘로 나눠 저장한다. (PlayStyleAxis 참고)
 */
export const SURVEY_QUESTIONS = [
  { no: 1,  area: 'WIN_ORIENTATION',   text: '승패를 중요하게 생각하는 편이다',                    low: '결과보다 과정/재미',  high: '승리가 매우 중요' },
  { no: 2,  area: 'WIN_ORIENTATION',   text: '승리를 위해 평소 선호하지 않는 플레이 방식도 맞출 수 있다', low: '내 방식 선호',      high: '승리를 위해 적극 조율' },
  { no: 3,  area: 'MISTAKE_TOLERANCE', text: '팀원 실수에 크게 신경 쓰지 않는 편이다',              low: '실수에 민감',        high: '실수에 관대' },
  { no: 4,  area: 'MISTAKE_TOLERANCE', text: '실력이 부족해도 분위기가 좋으면 함께 플레이할 수 있다',  low: '실력 차이가 중요',   high: '분위기가 더 중요' },
  { no: 5,  area: 'COMMUNICATION',     text: '팀원들과 적극적으로 소통하는 편이다',                 low: '필요한 말만 함',     high: '적극적으로 소통' },
  { no: 6,  area: 'COMMUNICATION',     text: '처음 만난 사람과도 의견을 편하게 이야기하는 편이다',     low: '먼저 말하기 어려움', high: '편하게 의견 제시' },
  { no: 7,  area: 'FOCUS',             text: '게임을 시작하면 플레이 자체에 집중하는 편이다',         low: '편안한 분위기 중심', high: '플레이 집중 중심' },
  { no: 8,  area: 'FOCUS',             text: '게임 중 잡담/가벼운 대화를 즐기는 편이다',            low: '게임에만 집중',      high: '대화를 많이 즐김' },
  { no: 9,  area: 'INITIATIVE',        text: '전략/플레이 방향을 먼저 제안하는 편이다',             low: '다른 사람을 따름',   high: '적극적으로 방향 제시' },
  { no: 10, area: 'INITIATIVE',        text: '함께 플레이하는 사람이 방향을 적극적으로 제시해주는 것을 선호한다',
                                       areaLabel: '주도성 선호',                                low: '각자 판단이 좋음',   high: '적극적으로 이끌어주면 좋음' },
  { no: 11, area: 'SOCIALITY',         text: '사람과 친해지는 것도 중요하다',                     low: '게임 자체가 중요',   high: '관계 형성도 중요' },
  { no: 12, area: 'SOCIALITY',         text: '잘 맞는 사람과 다음에도 함께 플레이하고 싶다',        low: '일회성 플레이도 괜찮음', high: '지속적으로 같이 하고 싶음' },
];

export const SURVEY_QUESTION_COUNT = SURVEY_QUESTIONS.length;

/** 리커트 눈금 라벨 (1~5). 가운데는 비워 양 끝 문구가 기준이 되게 한다. */
export const SURVEY_SCALE = [1, 2, 3, 4, 5];

/* ===================== 모집글 (FR-02) ===================== */

/**
 * 모집글에서 고를 수 있는 게임.
 *
 * code 는 백엔드 GameCode enum 과 **같은 값이어야 한다**. 예전에는 '리그오브레전드'
 * 라는 표시명이 그대로 DB 에 저장됐는데, 표시명은 언제든 바뀌고(줄임말, 띄어쓰기)
 * 바뀌는 순간 이미 저장된 글들이 필터에서 사라진다. 화면 문구는 label 로 분리한다.
 */
export const POST_GAMES = [
  { code: 'LOL', label: '리그오브레전드' },
  { code: 'VALORANT', label: '발로란트' },
];

export const gameLabel = (code) =>
  POST_GAMES.find((g) => g.code === code)?.label ?? '';

export const gameCodeOf = (label) =>
  POST_GAMES.find((g) => g.label === label)?.code ?? '';

/**
 * 음성채팅 정도. 마이크 여부(boolean)를 대체한다.
 *
 * "마이크는 있는데 말은 별로 안 하고 싶다"가 가장 흔한 상태인데 boolean 은 그걸
 * 표현하지 못해, 사람들이 '필수'와 '무관' 사이에서 아무거나 골랐다.
 * 필수 = 하드 필터(제외), 있으면 좋음 = 소프트 점수(가산점), 상관없음 = 조건 없음.
 */
export const VOICE_LEVELS = [
  { code: 'REQUIRED', label: '필수' },
  { code: 'PREFERRED', label: '있으면 좋음' },
  { code: 'ANY', label: '상관없음' },
];

export const voiceLabel = (code) =>
  VOICE_LEVELS.find((v) => v.code === code)?.label ?? '상관없음';

export const PLAY_STYLE_OPTIONS = ['빡겜', '즐겜', ANY];

/**
 * 게임별 조건 선택지.
 *
 * 백엔드 GameOptions 와 같은 목록이다. 중복이지만 역할이 다르다 — 이쪽은 화면을
 * 그리기 위한 것이고, 저쪽은 저장을 막기 위한 것이다. 어긋나면 저장할 때 400 이
 * 나므로 조용히 틀리지 않는다. (백엔드 GET /api/posts/game-options 로도 받을 수 있다)
 *
 * roles 는 롤에서는 '포지션', 발로란트에서는 '역할'로 부르지만 저장되는 칸은 같다.
 * 라벨만 다르고 "이 게임에서 맡는 자리"라는 의미가 같아서다.
 */
export const GAME_REQUIREMENT_FIELDS = {
  LOL: {
    roleLabel: '포지션',
    roles: ['탑', '정글', '미드', '원딜', '서폿', ANY],
    tiers: ['아이언', '브론즈', '실버', '골드', '플래티넘', '에메랄드', '다이아몬드', '마스터 이상', ANY],
    modes: ['신속', '랭크', '칼바람', ANY],
  },
  VALORANT: {
    roleLabel: '역할',
    roles: ['타격대', '척후대', '전략가', '감시자', ANY],
    tiers: ['아이언', '브론즈', '실버', '골드', '플래티넘', '다이아몬드', '초월', '불멸', '레디언트', ANY],
    modes: ['일반', '경쟁전', '데스매치', '기타', ANY],
  },
};

/** '상관없음'과 빈 값을 걷어낸다. 조건 없음은 빈 값으로 저장한다. */
export const withoutAny = (values) =>
  (values ?? []).filter((v) => v && v !== ANY);
