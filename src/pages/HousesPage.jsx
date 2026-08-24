import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { acceptInvitation, listHouses, listMyInvitations, rejectInvitation } from '../api/houses';
import { useAuth } from '../context/AuthContext';
import './Houses.css';

const TYPE_LABEL = { SOCIAL: '친목형', COMPETITIVE: '경쟁형' };

function HouseCard({ house }) {
  const mine = ['OWNER', 'MANAGER', 'MEMBER'].includes(house.myStatus);

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
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [working, setWorking] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [houseData, invitationData] = await Promise.all([
        listHouses(user),
        user ? listMyInvitations(user) : Promise.resolve([]),
      ]);
      setHouses(houseData);
      setInvitations(invitationData);
    } catch (err) {
      setError(err.message || 'House를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const publicHouses = useMemo(
    () => houses.filter((house) => house.visibility === 'PUBLIC'),
    [houses],
  );
  const myHouses = useMemo(
    () => houses.filter((house) => ['OWNER', 'MANAGER', 'MEMBER'].includes(house.myStatus)),
    [houses],
  );
  const visible = tab === 'public' ? publicHouses : myHouses;

  const decideInvitation = async (invitation, decision) => {
    setWorking(`${decision}-${invitation.id}`);
    setError('');
    try {
      if (decision === 'accept') await acceptInvitation(invitation.id, user);
      else await rejectInvitation(invitation.id, user);
      await load();
    } catch (err) {
      setError(err.message || '초대를 처리하지 못했습니다.');
    } finally {
      setWorking('');
    }
  };

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
        <button type="button" role="tab" aria-selected={tab === 'invitations'}
                className={tab === 'invitations' ? 'active' : ''} onClick={() => setTab('invitations')}>
          받은 초대 <span>{invitations.length}</span>
        </button>
      </div>

      {loading && <div className="ui-empty"><p>House를 불러오는 중…</p></div>}
      {!loading && error && <div className="house-alert error">{error}</div>}
      {!loading && !error && (tab === 'mine' || tab === 'invitations') && !user && (
        <div className="ui-empty">
          <p>{tab === 'mine' ? '내 House를 확인하려면 로그인이 필요합니다.' : '받은 초대를 확인하려면 로그인이 필요합니다.'}</p>
          <Link className="ui-btn-secondary house-empty-link" to="/login">로그인</Link>
        </div>
      )}
      {!loading && !error && tab !== 'invitations' && visible.length === 0 && !(tab === 'mine' && !user) && (
        <div className="ui-empty">
          <p>{tab === 'public' ? '아직 공개된 House가 없습니다.' : '아직 가입한 House가 없습니다.'}</p>
          {tab === 'mine' && <Link className="ui-btn-secondary house-empty-link" to="/houses/new">첫 House 만들기</Link>}
        </div>
      )}
      {!loading && !error && tab !== 'invitations' && visible.length > 0 && (
        <div className="house-grid">
          {visible.map((house) => <HouseCard key={house.id} house={house} />)}
        </div>
      )}
      {!loading && !error && tab === 'invitations' && user && invitations.length === 0 && (
        <div className="ui-empty"><p>받은 House 초대가 없습니다.</p></div>
      )}
      {!loading && !error && tab === 'invitations' && user && invitations.length > 0 && (
        <div className="house-invitation-list">
          {invitations.map((invitation) => (
            <article className="house-invitation-card" key={invitation.id}>
              <div>
                <div className="house-tags">
                  <span className="ui-tag house-game">🎯 {invitation.house.game}</span>
                  <span className="ui-tag">🔒 초대 전용</span>
                </div>
                <h2>{invitation.house.name}</h2>
                <p>{invitation.invitedBy?.nickname || '방장'}님이 House에 초대했습니다.</p>
                <small>멤버 {invitation.house.currentMembers}/{invitation.house.maxMembers}명</small>
              </div>
              <div className="house-row-actions">
                <button className="ui-btn-primary ui-btn-sm" type="button"
                        disabled={working === `accept-${invitation.id}`}
                        onClick={() => decideInvitation(invitation, 'accept')}>수락</button>
                <button className="ui-btn-secondary ui-btn-sm" type="button"
                        disabled={working === `reject-${invitation.id}`}
                        onClick={() => decideInvitation(invitation, 'reject')}>거절</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
