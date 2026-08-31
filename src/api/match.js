import api from './client';

/* ==================================================================
 * POST /api/match/search
 *   body: MatchSearchRequest { game, gameMode, positions, tier, micLevel,
 *         playStyle, targetMembersOptions, playTime, limit }
 *   res : MatchSearchResponse { results, topExplanation, algoVersion, relaxed, calculatedAt }
 *
 * game은 match 서비스 내부적으로는 영문 코드(LOL/VALORANT)를 쓰지만, 여기서는
 * 앱 전체가 쓰는 한글 라벨(constants.js GAMES)을 그대로 보낸다 — post 서비스 검색도
 * 같은 값을 써야 글이 실제로 조회되고, match 쪽에서 코드로 변환해 흡수한다
 * (HardFilterService.GAME_ALIASES 참고).
 *
 * positions / tier / gameMode 의 어휘는 반드시 GAME_REQUIREMENT_FIELDS(= 백엔드
 * GameOptions)에서 온 값이어야 한다. 검색 조건은 결국 모집글에 저장된 문자열과
 * 그대로 비교되므로, 목록이 어긋나면 에러가 아니라 조용히 "결과 0건"이 된다 —
 * 실제로 발로란트 역할과 LOL 게임모드에서 그런 적이 있다(constants.js 주석 참고).
 *
 * playTime 은 자유 텍스트가 아니라 PLAY_TIMES(아침/낮/저녁/새벽)의 콤마 구분 값이다.
 * 서버가 프로필 playTimes 와 같은 어휘로 비교해 "플레이 시간대" 축에 반영한다.
 *
 * results[] 에는 party(방장 + 확정 파티원)와 surveyedCount(그중 설문 완료 인원)도 실린다.
 * ================================================================== */
export async function searchMatch(payload) {
  const { data } = await api.post('/match/search', payload);
  return data;
}

/* POST /api/match/results/{resultId}/events
 *   body: { eventType: 'IMPRESSION' | 'CLICK' | 'APPLY' }
 *
 * 노출/클릭/지원 로그. 화면 동작을 막으면 안 되는 부가 기록이라 실패해도 조용히
 * 무시한다(호출부에서 await 하지 않아도 되게 에러를 삼킨다).
 */
export async function recordMatchEvent(resultId, eventType) {
  try {
    await api.post(`/match/results/${resultId}/events`, { eventType });
  } catch {
    /* 로깅 실패가 매칭 사용 자체를 막으면 안 된다 */
  }
}

/** 여러 결과에 대해 한 번에 노출(IMPRESSION) 기록. 실패해도 무시. */
export function recordImpressions(resultIds) {
  resultIds.forEach((id) => recordMatchEvent(id, 'IMPRESSION'));
}

export function matchErrMsg(err) {
  return err.response?.data?.message || '매칭 요청에 실패했습니다. 잠시 후 다시 시도해주세요.';
}
