import api from './client';

/* ==================================================================
 * POST /api/match/search
 *   body: MatchSearchRequest { game, gameMode, positions, micRequired,
 *         targetMembersOptions, playTime, limit }
 *   res : MatchSearchResponse { results, topExplanation, algoVersion, relaxed, calculatedAt }
 *
 * game은 match 서비스 내부적으로는 영문 코드(LOL/VALORANT)를 쓰지만, 여기서는
 * 앱 전체가 쓰는 한글 라벨(constants.js GAMES)을 그대로 보낸다 — post 서비스 검색도
 * 같은 값을 써야 글이 실제로 조회되고, match 쪽에서 코드로 변환해 흡수한다
 * (HardFilterService.GAME_ALIASES 참고).
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
