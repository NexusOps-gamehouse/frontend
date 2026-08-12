import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  syncRiotProfile, fetchStoredRiotProfile,
  parseRiotId, riotErrMsg, formatRiotId, SYNC_COOLDOWN_MS,
} from '../api/riot';
import { timeAgoSec } from '../utils';
import RiotProfileCard from './RiotProfileCard';
import { profileFromUser } from '../api/riot';

/**
 * 게임 계정 연동 (로그인 후).
 * POST /users/riot/sync 는 토큰이 필요해서 회원가입 중에는 못 쓴다.
 * 티어는 시즌 중 계속 바뀌므로 재연동으로 갱신하는 용도이기도 하다.
 */
export default function RiotLinkCard() {
  const { user, updateUser } = useAuth();

  const [riotId, setRiotId] = useState(formatRiotId(user?.gameName, user?.tagLine));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [synced, setSynced] = useState(null);   // 화면에 보여줄 라이엇 프로필
  const [now, setNow] = useState(() => Date.now()); // 1초마다 갱신 (경과 시간 표시용)

  /**
   * 마운트될 때 서버에 저장된 프로필을 불러온다.
   *
   * 이 컴포넌트의 state 는 페이지를 떠나면 사라진다. 예전에는 그것이 유일한
   * 보관처여서, 마이페이지를 나갔다 오면 레벨·LP·모스트 챔피언이 전부 없어지고
   * 설문에서 고른 한글 티어만 남았다.
   *
   * 여기서 부르는 건 저장된 값을 읽는 GET 이라 라이엇 API 를 건드리지 않는다.
   * 실제 갱신은 아래 sync() — 사용자가 "다시 불러오기"를 눌렀을 때만이다.
   */
  useEffect(() => {
    if (!user?.gameName) return;

    let alive = true;
    fetchStoredRiotProfile()
      .then((p) => { if (alive && p) setSynced(p); })
      .catch(() => {});   // 못 불러와도 화면은 그대로 둔다
    return () => { alive = false; };
  }, [user?.gameName]);

  /**
   * 쿨다운이 끝나는 순간에 딱 한 번만 다시 그린다.
   *
   * 1초 간격 setInterval 을 쓰지 않는 이유:
   *   "최근 업데이트: 3분 전" 은 초 단위 정밀도가 필요 없다. 1분이 넘어가면
   *   표시가 1분에 한 번 바뀌는데 60번을 헛돌게 된다. 게다가 화면 구석에서
   *   숫자가 계속 움직이면 정작 봐야 할 티어·모스트 챔피언에서 시선을 뺏는다.
   *
   * 그렇다고 타이머를 아예 없애면 안 된다:
   *   버튼의 disabled 도 렌더 결과라, 리렌더가 없으면 쿨다운이 끝나도 잠긴 채로
   *   남는다. 새로고침해야만 눌리게 된다. 타이머는 문구가 아니라 버튼 때문에 필요하다.
   *
   * 그래서 화면이 다시 그려지는 시점은 네 번뿐이다.
   *   진입 / 갱신 직후 / 쿨다운 종료 / 새로고침
   *
   * 대가: 쿨다운이 끝난 뒤 페이지를 오래 열어두면 문구가 '2분 전'에 멈춰 있다.
   * 이 문구의 목적이 '대략 얼마나 오래된 값인가'라 허용 가능한 수준으로 본다.
   */
  useEffect(() => {
    if (!synced?.riotSyncedAt) return;
    setNow(Date.now());

    const left = SYNC_COOLDOWN_MS - (Date.now() - new Date(synced.riotSyncedAt).getTime());
    if (left <= 0) return;

    // +100ms 여유. 정확히 경계에 깨어나면 반올림 때문에 아직 잠긴 것으로 계산될 수 있다.
    const id = setTimeout(() => setNow(Date.now()), left + 100);
    return () => clearTimeout(id);
  }, [synced?.riotSyncedAt]);

  const parsed = riotId.trim() ? parseRiotId(riotId) : null;
  const formatError = Boolean(riotId.trim()) && parsed === null;

  const linked = Boolean(user?.gameName);
  const profile = synced ?? profileFromUser(user);

  // 쿨다운은 '같은 계정 재조회'에만 건다. 다른 Riot ID 를 입력했다면
  // 갱신이 아니라 연동 대상 변경이므로 기다리게 할 이유가 없다. (서버도 같은 규칙)
  const sameAccount = Boolean(
    parsed && synced?.gameName
    && parsed.gameName.trim().toLowerCase() === synced.gameName.toLowerCase()
    && parsed.tagLine.trim().toLowerCase() === (synced.tagLine ?? '').toLowerCase(),
  );
  const syncedAtMs = synced?.riotSyncedAt ? new Date(synced.riotSyncedAt).getTime() : null;
  const cooldownLeft = syncedAtMs ? Math.max(0, SYNC_COOLDOWN_MS - (now - syncedAtMs)) : 0;
  const cooling = sameAccount && cooldownLeft > 0;

  const sync = async () => {
    if (!parsed) { setError('이름#태그 형식으로 입력해 주세요.'); return; }
    setError('');
    setLoading(true);
    try {
      const p = await syncRiotProfile(parsed);
      setSynced(p);
      setRiotId(`${p.gameName}#${p.tagLine}`);
      // 서버가 저장한 값을 화면에도 반영
      updateUser({
        ...user,
        gameName: p.gameName, tagLine: p.tagLine,
        tier: p.tier, rank: p.rank, leaguePoints: p.leaguePoints,
        profileIconId: p.profileIconId, summonerLevel: p.summonerLevel,
      });
    } catch (err) {
      setError(riotErrMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="ui-section-title">게임 계정</p>

      <div className="ui-profile-card">
        <div className="field-row">
          <input className="inp" type="text"
                 placeholder="롤 닉네임#태그  예: Hide on bush#KR1"
                 aria-label="라이엇 ID"
                 value={riotId}
                 onChange={(e) => {
                   setRiotId(e.target.value); setError('');
                 }} />
          {/*
            쿨다운 중에는 버튼을 잠그되 문구는 그대로 둔다.
            남은 초를 버튼에 찍으면 매초 글자 폭이 바뀌어 버튼이 들썩이고,
            "무엇을 하는 버튼인가"라는 제일 중요한 정보가 가려진다.
            잠긴 이유는 옆의 '최근 업데이트'가 대신 말해준다.
          */}
          <button className="btn2 sm" type="button" onClick={sync}
                  disabled={!riotId || loading || cooling}
                  title={cooling ? '방금 갱신했어요. 잠시 후 다시 시도할 수 있어요.' : undefined}>
            {loading ? '불러오는 중…' : linked ? '다시 불러오기' : '연동하기'}
          </button>
          {/*
            마지막 갱신 시각. 버튼이 왜 잠겼는지를 설명하는 동시에,
            평소에는 "지금 보이는 값이 언제 것인가"를 알려준다.
            전적 사이트들이 갱신 버튼 옆에 이 문구를 두는 이유가 그것이다.
          */}
          {syncedAtMs && !loading && (
            <span className="field-hint" role="status">
              최근 업데이트: {timeAgoSec(synced.riotSyncedAt, now)}
            </span>
          )}
        </div>

        {formatError && <p className="check-msg dup" role="alert">이름#태그 형식으로 입력해 주세요.</p>}
        {error && <p className="check-msg dup" role="alert">{error}</p>}
        {!linked && !error && !formatError && (
          <p className="field-hint">연동하면 티어와 모스트 챔피언이 프로필에 표시됩니다.</p>
        )}

        {profile && (
          <div style={{ marginTop: 12 }}>
            <RiotProfileCard profile={profile} />
          </div>
        )}
      </div>
    </>
  );
}
