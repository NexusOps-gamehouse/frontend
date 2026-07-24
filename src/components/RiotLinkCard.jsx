import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { syncRiotProfile, parseRiotId, riotErrMsg, formatRiotId } from '../api/riot';
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
  const [synced, setSynced] = useState(null);   // 방금 연동한 결과

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
                 onChange={(e) => { setRiotId(e.target.value); setError(''); setSynced(null); }} />
          <button className="btn2 sm" type="button" onClick={sync}
                  disabled={!riotId || loading}>
            {loading ? '불러오는 중…' : linked ? '다시 불러오기' : '연동하기'}
          </button>
        </div>

        {formatError && <p className="check-msg dup" role="alert">이름#태그 형식으로 입력해 주세요.</p>}
        {error && <p className="check-msg dup" role="alert">{error}</p>}
        {synced && <p className="check-msg ok" role="status">최신 정보로 갱신했어요.</p>}
        {!linked && !error && !formatError && !synced && (
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
