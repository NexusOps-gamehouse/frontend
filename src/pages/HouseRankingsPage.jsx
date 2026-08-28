import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { listHouseRankings } from '../api/houseRankings';
import { useAuth } from '../context/AuthContext';
import './HouseRankingsPage.css';

const movementLabel = (house) => {
  if (house.movement === 'NEW') return <span className="house-ranking-movement new">NEW</span>;
  if (house.movement === 'UP') return <span className="house-ranking-movement up">▲ {house.movementDelta}</span>;
  if (house.movement === 'DOWN') return <span className="house-ranking-movement down">▼ {house.movementDelta}</span>;
  return <span className="house-ranking-movement same">-</span>;
};

function RankingCard({ house, showMine = false }) {
  const memberCount = Number.isFinite(Number(house.memberCount))
    ? Number(house.memberCount)
    : Array.isArray(house.members) ? house.members.length : 0;
  const hasGame = house.game && house.game !== '기타';

  return (
    <article className={`house-ranking-card ${showMine ? 'is-mine' : ''}`}>
      <div className="house-ranking-rank" aria-label={`${house.rank}위`}>
        <strong>{house.rank}</strong>
        {movementLabel(house)}
      </div>
      <div className="house-ranking-main">
        <div className="house-ranking-title-row">
          <Link to={`/houses/${house.id}`} className="house-ranking-title">{house.name || '이름 없는 House'}</Link>
          {showMine && <span className="ui-tag is-online">내 House</span>}
        </div>
        <div className="house-ranking-meta">
          {hasGame && <span>🎯 {house.game}</span>}
          <span>멤버 {memberCount}/{house.maxMembers ?? '-'}</span>
        </div>
      </div>
      <div className="house-ranking-score">
        <strong>Lv. {house.level ?? '-'}</strong>
        <span>{house.xp.toLocaleString('ko-KR')} XP</span>
      </div>
    </article>
  );
}

function RankingList({ houses, emptyMessage }) {
  if (!houses.length) return <div className="ui-empty house-ranking-empty"><p>{emptyMessage}</p></div>;
  return <div className="house-ranking-list">{houses.map((house) => <RankingCard key={house.id} house={house} />)}</div>;
}

export default function HouseRankingsPage() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    setLoading(true);
    setError('');
    try {
      const nextRanking = await listHouseRankings(user);
      if (requestId.current === currentRequestId) setRanking(nextRanking);
    } catch (err) {
      if (requestId.current === currentRequestId) {
        setRanking(null);
        setError(err.message || 'House 랭킹을 불러오지 못했습니다.');
      }
    } finally {
      if (requestId.current === currentRequestId) setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const refresh = () => load();
    const onStorage = (event) => {
      if (event.key === 'gamehouse.houses.v1' || event.key === null) refresh();
    };
    window.addEventListener('gamehouse:houses-changed', refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('gamehouse:houses-changed', refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, [load]);

  return (
    <main className="page houses-page house-rankings-page">
      <div className="house-page-head house-ranking-page-head">
        <div>
          <span className="house-eyebrow">HOUSE RANKING</span>
          <h1>House 랭킹</h1>
          <p>공개 경쟁형 House의 누적 XP 순위를 확인해보세요.</p>
        </div>
        <Link className="ui-btn-secondary" to="/houses">House 목록</Link>
      </div>

      {loading && <div className="ui-empty" aria-live="polite"><p>House 랭킹을 불러오는 중…</p></div>}
      {!loading && error && (
        <div className="house-alert error" role="alert">
          <p>{error}</p>
          <button className="ui-btn-secondary ui-btn-sm" type="button" onClick={load}>다시 시도</button>
        </div>
      )}
      {!loading && !error && ranking && (
        <>
          <div className="house-ranking-period">
            <strong>{ranking.weekId} 주차</strong>
            <span>{ranking.startDate} ~ {ranking.endDate}</span>
            <small>현재 순위와 주차 시작 스냅샷을 비교합니다.</small>
          </div>

          <section className="house-ranking-section">
            <div className="house-section-head"><h2>TOP 10</h2><span>{ranking.topHouses.length}개</span></div>
            <RankingList houses={ranking.topHouses} emptyMessage="랭킹 대상 House가 없습니다." />
          </section>

          <section className="house-ranking-section">
            <div className="house-section-head"><h2>내 House</h2><span>{ranking.myHouses.length}개</span></div>
            {ranking.myHouses.length ? (
              <div className="house-ranking-list">{ranking.myHouses.map((house) => (
                <RankingCard key={house.id} house={house} showMine />
              ))}</div>
            ) : (
              <div className="ui-empty house-ranking-empty"><p>{user ? '공개 경쟁형 내 House가 없습니다.' : '로그인하면 내 House 순위를 확인할 수 있어요.'}</p></div>
            )}
          </section>

          <section className="house-ranking-section">
            <div className="house-section-head"><h2>전체 랭킹</h2><span>{ranking.totalElements}개</span></div>
            <RankingList houses={ranking.items} emptyMessage="랭킹 대상 House가 없습니다." />
          </section>
        </>
      )}
    </main>
  );
}
