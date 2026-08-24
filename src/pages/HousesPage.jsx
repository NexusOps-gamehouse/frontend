import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listHouses } from '../api/houses';
import { useAuth } from '../context/AuthContext';
import './Houses.css';

const TYPE_LABEL = { SOCIAL: '친목형', COMPETITIVE: '경쟁형' };

function HouseCard({ house }) {
  const mine = house.myStatus === 'OWNER' || house.myStatus === 'MEMBER';

  return (
    <Link className="house-card" to={`/houses/${house.id}`} aria-label={`${house.name} 상세 보기`}>
      <div className="house-card-head">
        <div className="house-tags">
          <span className="ui-tag house-game">🎯 {house.game}</span>
          <span className={`ui-tag house-type ${house.type.toLowerCase()}`}>{TYPE_LABEL[house.type]}</span>
          <span className="ui-tag">{house.visibility === 'PUBLIC' ? '🌐 공개' : '🔒 비공개'}</span>
        </div>
        {mine && <span className="ui-tag is-online">내 House</span>}
      </div>
      <div>
        <h2>{house.name}</h2>
        <p>{house.description}</p>
      </div>
      <div className="house-card-foot">
        <div className="ui-author">
          <div className="ui-author-av">{house.owner.nickname?.[0] || '?'}</div>
          <div className="ui-author-info">
            <span className="ui-author-name">
              {house.owner.nickname} <span className="owner-badge">방장</span>
            </span>
            <span className="ui-time">멤버 {house.members.length}/{house.maxMembers}명</span>
          </div>
        </div>
        <span className="house-card-link">자세히 보기 →</span>
      </div>
    </Link>
  );
}

export default function HousesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('public');
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listHouses(user)
      .then((data) => { if (alive) setHouses(data); })
      .catch((err) => { if (alive) setError(err.message || 'House를 불러오지 못했습니다.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [user]);

  const publicHouses = useMemo(
    () => houses.filter((house) => house.visibility === 'PUBLIC'),
    [houses],
  );
  const myHouses = useMemo(
    () => houses.filter((house) => house.myStatus === 'OWNER' || house.myStatus === 'MEMBER'),
    [houses],
  );
  const visible = tab === 'public' ? publicHouses : myHouses;

  return (
    <div className="page houses-page">
      <div className="house-page-head">
        <div>
          <span className="house-eyebrow">GAME HOUSE COMMUNITY</span>
          <h1>House</h1>
          <p>게임 취향과 목표가 맞는 멤버들과 우리만의 공간을 만들어보세요.</p>
        </div>
        {user ? (
          <Link className="ui-btn-primary house-create-link" to="/houses/new">+ House 만들기</Link>
        ) : (
          <Link className="ui-btn-primary house-create-link" to="/login">로그인하고 시작하기</Link>
        )}
      </div>

      <div className="house-tabs" role="tablist" aria-label="House 목록">
        <button type="button" role="tab" aria-selected={tab === 'public'}
                className={tab === 'public' ? 'active' : ''} onClick={() => setTab('public')}>
          공개 House <span>{publicHouses.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === 'mine'}
                className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>
          내 House <span>{myHouses.length}</span>
        </button>
      </div>

      {loading && <div className="ui-empty"><p>House를 불러오는 중…</p></div>}
      {!loading && error && <div className="house-alert error">{error}</div>}
      {!loading && !error && tab === 'mine' && !user && (
        <div className="ui-empty">
          <p>내 House를 확인하려면 로그인이 필요합니다.</p>
          <Link className="ui-btn-secondary house-empty-link" to="/login">로그인</Link>
        </div>
      )}
      {!loading && !error && visible.length === 0 && !(tab === 'mine' && !user) && (
        <div className="ui-empty">
          <p>{tab === 'public' ? '아직 공개된 House가 없습니다.' : '아직 가입한 House가 없습니다.'}</p>
          {tab === 'mine' && <Link className="ui-btn-secondary house-empty-link" to="/houses/new">첫 House 만들기</Link>}
        </div>
      )}
      {!loading && !error && visible.length > 0 && (
        <div className="house-grid">
          {visible.map((house) => <HouseCard key={house.id} house={house} />)}
        </div>
      )}
    </div>
  );
}
