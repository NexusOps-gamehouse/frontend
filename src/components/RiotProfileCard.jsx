import { useDdragon, profileIconUrl, championIconUrl, tierText, winRate } from '../api/riot';
import TierIcon from './icons/TierIcon';

/**
 * profile은 normalizeProfile() 또는 profileFromUser()를 거친 객체여야 한다.
 * variant="full"    : 회원가입 확인 화면
 * variant="compact" : 모집글 참가자 목록
 */
export default function RiotProfileCard({ profile: p, variant = 'full', showTier = true }) {
  const { version, champions } = useDdragon();
  if (!p) return null;

  const rate = p.ranked ? winRate(p.wins, p.losses) : null;
  const champ = (m) => champions[m.championId] ?? { key: null, name: `#${m.championId}` };

  if (variant === 'compact') {
    // 이미 티어를 표시하는 화면에서는 showTier={false}로 중복을 피한다
    if (!showTier && p.masteries.length === 0) return null;

    return (
      <div className="flex" style={{ gap: 8 }}>
        {showTier && <span className="tag">{tierText(p)}</span>}
        <div className="flex" style={{ gap: 4 }}>
          {p.masteries.map((m) => {
            const c = champ(m);
            return c.key ? (
              <img key={m.championId} src={championIconUrl(version, c.key)} alt={c.name}
                   title={`${c.name} · ${m.points.toLocaleString()}점`}
                   width={24} height={24} style={{ borderRadius: 6 }} loading="lazy" />
            ) : null;
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex" style={{ gap: 12 }}>
        {p.profileIconId != null && (
          <div className="av lg">
            <img src={profileIconUrl(version, p.profileIconId)} alt="" />
          </div>
        )}
        <div>
          <div className="name">{p.gameName}<span className="meta"> #{p.tagLine}</span></div>
          {p.summonerLevel != null && <div className="meta">레벨 {p.summonerLevel}</div>}
        </div>
      </div>

      <div className="row" style={{ marginTop: 12, marginBottom: 0 }}>
        <span className="chip on has-icon" style={{ cursor: 'default' }}>
          <TierIcon name={p.tier} />
          <span>{tierText(p)}</span>
        </span>
        {p.ranked && <span className="tag">{p.leaguePoints} LP</span>}
        {rate !== null && <span className="tag">{p.wins}승 {p.losses}패 · {rate}%</span>}
      </div>

      {!p.ranked && (
        <p className="meta" style={{ marginTop: 8 }}>
          이번 시즌 솔로랭크 기록이 없어요. 설문에서 티어를 직접 골라주세요.
        </p>
      )}

      {p.masteries.length > 0 && (
        <>
          <p className="meta" style={{ marginTop: 14, marginBottom: 6 }}>모스트 챔피언</p>
          <div className="flex" style={{ gap: 12 }}>
            {p.masteries.map((m) => {
              const c = champ(m);
              return (
                <div key={m.championId} style={{ textAlign: 'center', minWidth: 60 }}>
                  {c.key && <img src={championIconUrl(version, c.key)} alt=""
                                 width={48} height={48} style={{ borderRadius: 10 }} loading="lazy" />}
                  <div className="meta" style={{ marginTop: 4 }}>{c.name}</div>
                  <div className="meta">M{m.level} · {m.points.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
