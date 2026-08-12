import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  syncRiotProfile, fetchStoredRiotProfile,
  parseRiotId, riotErrMsg, formatRiotId, syncCooldownLeft,
} from '../api/riot';
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
  const [justSynced, setJustSynced] = useState(false); // "갱신했어요" 문구용
  const [cooldownLeft, setCooldownLeft] = useState(0); // 재조회까지 남은 ms

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
   * 쿨다운 카운트다운.
   *
   * 남은 시간을 state 에 저장해두고 줄이는 대신, 매 초 synced.riotSyncedAt 으로
   * 다시 계산한다. 탭이 백그라운드로 가면 setInterval 이 느려지거나 밀리는데,
   * 시각 기준으로 재계산하면 그 영향을 받지 않는다.
   *
   * 서버도 같은 쿨다운을 걸고 있으므로 이 타이머는 안내용이다.
   * 개발자 도구로 버튼을 눌러도 서버가 저장된 값을 돌려줄 뿐 라이엇을 부르지 않는다.
   */
  useEffect(() => {
    const tick = () => setCooldownLeft(syncCooldownLeft(synced));
    tick();
    if (!synced?.riotSyncedAt) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [synced]);

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
  const cooling = sameAccount && cooldownLeft > 0;
  const cooldownSec = Math.ceil(cooldownLeft / 1000);

  const sync = async () => {
    if (!parsed) { setError('이름#태그 형식으로 입력해 주세요.'); return; }
    setError('');
    // 이전 시도의 성공 문구를 먼저 지운다. 이게 없으면 갱신에 실패했을 때
    // "조회 요청이 몰렸어요"(에러)와 "최신 정보로 갱신했어요"(성공)가
    // 동시에 떠서 성공한 건지 실패한 건지 알 수 없다.
    setJustSynced(false);
    setLoading(true);
    try {
      const p = await syncRiotProfile(parsed);
      setSynced(p);
      setJustSynced(true);
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
                   setRiotId(e.target.value); setError(''); setJustSynced(false);
                 }} />
          <button className="btn2 sm" type="button" onClick={sync}
                  disabled={!riotId || loading || cooling}>
            {loading ? '불러오는 중…'
              : cooling ? `${cooldownSec}초 후 가능`
              : linked ? '다시 불러오기' : '연동하기'}
          </button>
        </div>

        {formatError && <p className="check-msg dup" role="alert">이름#태그 형식으로 입력해 주세요.</p>}
        {error && <p className="check-msg dup" role="alert">{error}</p>}
        {/* 저장된 값을 불러온 것만으로는 뜨지 않는다. 방금 갱신했을 때만. */}
        {justSynced && <p className="check-msg ok" role="status">최신 정보로 갱신했어요.</p>}
        {/*
          쿨다운 안내. 버튼이 잠긴 이유를 말해주지 않으면 고장으로 보인다.
          방금 갱신한 직후에는 위의 '갱신했어요'와 겹치므로 그때는 띄우지 않는다.
        */}
        {cooling && !justSynced && !error && (
          <p className="field-hint" role="status">
            방금 갱신했어요. {cooldownSec}초 후에 다시 불러올 수 있어요.
          </p>
        )}
        {!linked && !error && !formatError && !justSynced && !cooling && (
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
