import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getHouse, requestHouseJoin } from '../api/houses';
import { useAuth } from '../context/AuthContext';
import './Houses.css';

const TYPE_LABEL = { SOCIAL: '친목형', COMPETITIVE: '경쟁형' };

export default function HouseDetailPage() {
  const { houseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let alive = true;
    getHouse(houseId, user)
      .then((data) => { if (alive) setHouse(data); })
      .catch((err) => {
        if (!alive) return;
        setAccessDenied(err.code === 'PRIVATE_HOUSE');
        setError(err.message || 'House를 불러오지 못했습니다.');
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [houseId, user]);

  const requestJoin = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/houses/${houseId}` } });
      return;
    }
    setJoining(true);
    setError('');
    try {
      const updated = await requestHouseJoin(houseId, user);
      setHouse(updated);
    } catch (err) {
      setError(err.message || '가입을 신청하지 못했습니다.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className="page houses-page"><div className="ui-empty"><p>House를 불러오는 중…</p></div></div>;
  if (!house) return (
    <div className="page houses-page">
      <div className="ui-empty house-private-error">
        {accessDenied && <div className="house-lock" aria-hidden="true">🔒</div>}
        <h1>{accessDenied ? '비공개 House입니다' : 'House를 찾을 수 없습니다'}</h1>
        <p>{error || '요청한 House 정보를 확인할 수 없습니다.'}</p>
        <Link className="ui-btn-secondary house-empty-link" to="/houses">House 목록으로</Link>
      </div>
    </div>
  );

  const isPrivate = house.visibility === 'PRIVATE';
  const isMember = house.myStatus === 'OWNER' || house.myStatus === 'MEMBER';
  const isFull = house.members.length >= house.maxMembers;

  return (
    <div className="page houses-page">
      <Link className="house-back" to="/houses">← House 목록</Link>
      <section className="house-detail-hero">
        <div className="house-detail-copy">
          <div className="house-tags">
            <span className="ui-tag house-game">🎯 {house.game}</span>
            <span className={`ui-tag house-type ${house.type.toLowerCase()}`}>{TYPE_LABEL[house.type]}</span>
            <span className="ui-tag">{isPrivate ? '🔒 비공개' : '🌐 공개'}</span>
          </div>
          <h1>{house.name}</h1>
          <p>{house.description}</p>
          <div className="house-owner-line">
            <div className="ui-author-av">{house.owner.nickname?.[0] || '?'}</div>
            <span><strong>{house.owner.nickname}</strong><span className="owner-badge">방장</span></span>
          </div>
        </div>

        <aside className="house-join-card">
          <strong>{house.members.length}/{house.maxMembers}명의 멤버가 함께하고 있어요</strong>
          {isPrivate ? (
            <>
              <div className="house-lock" aria-hidden="true">🔒</div>
              <p>비공개 House입니다.<br />방장의 초대로만 가입할 수 있어요.</p>
              <button className="ui-btn-secondary" type="button" disabled>초대 전용</button>
            </>
          ) : house.myStatus === 'PENDING' ? (
            <>
              <p>가입 신청을 보냈습니다.<br />방장의 승인을 기다려주세요.</p>
              <button className="ui-btn-secondary" type="button" disabled>가입 신청 대기중</button>
            </>
          ) : isMember ? (
            <>
              <p>{house.myStatus === 'OWNER' ? '이 House의 방장입니다.' : '이미 이 House의 멤버입니다.'}</p>
              <button className="ui-btn-secondary" type="button" disabled>
                {house.myStatus === 'OWNER' ? '방장' : '가입 완료'}
              </button>
            </>
          ) : isFull ? (
            <>
              <p>House 정원이 가득 찼습니다.<br />자리가 생기면 가입을 신청할 수 있어요.</p>
              <button className="ui-btn-secondary" type="button" disabled>정원 마감</button>
            </>
          ) : (
            <>
              <p>공개 House는 누구나 가입을 신청할 수 있습니다.</p>
              <button className="ui-btn-primary" type="button" disabled={joining} onClick={requestJoin}>
                {joining ? '신청 중…' : user ? '가입 신청하기' : '로그인하고 가입 신청'}
              </button>
            </>
          )}
        </aside>
      </section>

      {error && <div className="house-alert error detail-error">{error}</div>}

      <section className="house-members-section">
        <div className="house-section-head">
          <h2>House 멤버</h2>
          <span>{house.members.length}명</span>
        </div>
        <div className="house-members-list">
          {house.members.map((member) => (
            <div className="house-member" key={member.id}>
              <div className="ui-author-av">{member.nickname?.[0] || '?'}</div>
              <span>{member.nickname}</span>
              {member.role === 'OWNER' && <span className="owner-badge">방장</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
