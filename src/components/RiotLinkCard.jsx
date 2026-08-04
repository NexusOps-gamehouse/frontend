import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  syncRiotProfile, fetchStoredRiotProfile,
  parseRiotId, riotErrMsg, formatRiotId,
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

  const parsed = riotId.trim() ? parseRiotId(riotId) : null;
  const formatError = Boolean(riotId.trim()) && parsed === null;

  const linked = Boolean(user?.gameName);
  const profile = synced ?? profileFromUser(user);

  const sync = async () => {
    if (!parsed) { setError('이름#태그 형식으로 입력해 주세요.'); return; }
    setError('');
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
                  disabled={!riotId || loading}>
            {loading ? '불러오는 중…' : linked ? '다시 불러오기' : '연동하기'}
          </button>
        </div>

        {formatError && <p className="check-msg dup" role="alert">이름#태그 형식으로 입력해 주세요.</p>}
        {error && <p className="check-msg dup" role="alert">{error}</p>}
        {/* 저장된 값을 불러온 것만으로는 뜨지 않는다. 방금 갱신했을 때만. */}
        {justSynced && <p className="check-msg ok" role="status">최신 정보로 갱신했어요.</p>}
        {!linked && !error && !formatError && !justSynced && (
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
