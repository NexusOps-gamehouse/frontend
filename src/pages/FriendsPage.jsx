import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { errMsg } from '../api/client';
import { inviteFriends, listHouses } from '../api/houses';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useFriends } from '../context/FriendContext';
import { profileMeta } from '../utils';

// styles.css에 없는 탭 스타일만 스코프로 정의 (색은 전역 토큰 참조)
const styles = `
.fp .fp-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
.fp .fp-tab {
  background: none; border: none; cursor: pointer; font-family: inherit;
  font-size: 15px; font-weight: 700; color: var(--text-muted);
  padding: 12px 16px; border-bottom: 2px solid transparent; margin-bottom: -1px;
  display: inline-flex; align-items: center; gap: 6px; transition: color .2s;
}
.fp .fp-tab:hover { color: var(--text-main); }
.fp .fp-tab.active { color: var(--primary); border-bottom-color: var(--primary); }
[data-theme='dark'] .fp .fp-tab.active { color: #60a5fa; border-bottom-color: #60a5fa; }
.fp .fp-count {
  font-size: 12px; font-weight: 700; min-width: 18px; height: 18px; padding: 0 5px;
  border-radius: 9px; background: rgba(148,163,184,.18); color: var(--text-muted);
  display: inline-flex; align-items: center; justify-content: center;
}
.fp .fp-tab.active .fp-count { background: rgba(59,130,246,.15); color: var(--primary); }
[data-theme='dark'] .fp .fp-tab.active .fp-count { color: #60a5fa; }
.fp .fp-row-info { cursor: pointer; }
.fp .fp-house-option { justify-content: flex-start; cursor: pointer; }
.fp .fp-house-option input { width: 17px; height: 17px; accent-color: var(--primary); }
.fp .fp-house-option.disabled { opacity: .55; cursor: not-allowed; }
`;

function FriendRow({ friend, actions }) {
  const navigate = useNavigate();
  const u = friend.user;
  return (
    <div className="ui-list-row" style={{ cursor: 'default' }}>
      <div className="ui-author fp-row-info" onClick={() => navigate(`/profile/${u.id}`)}>
        <Avatar user={u} />
        <div className="ui-author-info">
          <div className="ui-author-name">
            {u.nickname}
            <span style={{ width: 6, height: 6, borderRadius: '50%',
                           background: u.online ? 'var(--online)' : 'var(--border)',
                           boxShadow: u.online ? '0 0 6px var(--online)' : 'none',
                           display: 'inline-block' }} />
          </div>
          <div className="ui-time">{profileMeta(u) || (u.online ? '온라인' : '오프라인')}</div>
        </div>
      </div>
      <div className="flex" style={{ gap: 8 }}>{actions}</div>
    </div>
  );
}

export default function FriendsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('friends');
  const [inviteTarget, setInviteTarget] = useState(null);
  const [ownedHouses, setOwnedHouses] = useState([]);
  const [selectedHouseId, setSelectedHouseId] = useState('');
  const [houseLoading, setHouseLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const {
    friends, received, sent, loading,
    acceptRequest, deleteRequest, unfriend,
  } = useFriends();

  const call = async (fn) => {
    try { await fn(); }
    catch (err) { alert(errMsg(err)); }
  };

  const onUnfriend = (u) => {
    if (!confirm(`${u.nickname}님을 친구 목록에서 삭제할까요?`)) return;
    call(() => unfriend(u.id));
  };
  const onReject = (req) => {
    if (!confirm('이 신청을 거절할까요?')) return;
    call(() => deleteRequest(req.id));
  };
  const onCancel = (req) => {
    if (!confirm('보낸 신청을 취소할까요?')) return;
    call(() => deleteRequest(req.id));
  };

  const openHouseInvite = async (friend) => {
    setInviteTarget(friend);
    setOwnedHouses([]);
    setSelectedHouseId('');
    setInviteError('');
    setHouseLoading(true);
    try {
      const houses = await listHouses(user);
      setOwnedHouses(houses.filter((house) => house.myRole === 'OWNER' && house.visibility === 'PRIVATE'));
    } catch (err) {
      setInviteError(err.message || 'House 목록을 불러오지 못했습니다.');
    } finally {
      setHouseLoading(false);
    }
  };

  const inviteToHouse = async () => {
    if (!selectedHouseId || !inviteTarget) return;
    setInviteLoading(true);
    setInviteError('');
    try {
      await inviteFriends(selectedHouseId, [inviteTarget], user);
      setInviteTarget(null);
    } catch (err) {
      setInviteError(err.message || 'House 초대를 보내지 못했습니다.');
    } finally {
      setInviteLoading(false);
    }
  };

  const houseAvailability = (house) => {
    const id = String(inviteTarget?.id ?? '');
    if (house.members.some((member) => String(member.id) === id)) return '이미 멤버';
    if ((house.invitations || []).some((invitation) => String(invitation.userId) === id)) return '초대 대기중';
    return '';
  };

  const list = tab === 'friends' ? friends : tab === 'received' ? received : sent;
  const emptyMsg = {
    friends: '아직 친구가 없습니다.\n프로필이나 모집글에서 친구 신청을 보내보세요!',
    received: '받은 친구 신청이 없습니다.',
    sent: '보낸 친구 신청이 없습니다.',
  }[tab];

  return (
    <div className="page fp">
      <style>{styles}</style>
      <div className="ui-narrow">
        <p className="ui-section-title" style={{ marginTop: 0 }}>친구</p>

        <div className="fp-tabs">
          <button className={`fp-tab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>
            친구 목록 <span className="fp-count">{friends.length}</span>
          </button>
          <button className={`fp-tab ${tab === 'received' ? 'active' : ''}`} onClick={() => setTab('received')}>
            받은 신청 <span className="fp-count">{received.length}</span>
          </button>
          <button className={`fp-tab ${tab === 'sent' ? 'active' : ''}`} onClick={() => setTab('sent')}>
            보낸 신청 <span className="fp-count">{sent.length}</span>
          </button>
        </div>

        {loading && list.length === 0 && <div className="ui-empty"><p>불러오는 중…</p></div>}

        {!loading && list.length === 0 && (
          <div className="ui-empty"><p style={{ whiteSpace: 'pre-line' }}>{emptyMsg}</p></div>
        )}

        {tab === 'friends' && friends.map((f) => (
          <FriendRow key={f.id} friend={f}
            actions={<>
              <button className="ui-btn-primary ui-btn-sm" onClick={() => openHouseInvite(f.user)}>House 초대</button>
              <button className="ui-btn-secondary ui-btn-sm" onClick={() => onUnfriend(f.user)}>삭제</button>
            </>} />
        ))}

        {tab === 'received' && received.map((f) => (
          <FriendRow key={f.id} friend={f} actions={<>
            <button className="ui-btn-primary ui-btn-sm" onClick={() => call(() => acceptRequest(f.id))}>수락</button>
            <button className="ui-btn-secondary ui-btn-sm" onClick={() => onReject(f)}>거절</button>
          </>} />
        ))}

        {tab === 'sent' && sent.map((f) => (
          <FriendRow key={f.id} friend={f} actions={<>
            <span className="ui-tag2">대기중</span>
            <button className="ui-btn-secondary ui-btn-sm" onClick={() => onCancel(f)}>취소</button>
          </>} />
        ))}
      </div>

      <Modal open={Boolean(inviteTarget)} title={`${inviteTarget?.nickname || '친구'}님을 House에 초대`}
             onClose={() => setInviteTarget(null)} footer={<>
        <button className="ui-btn-secondary" type="button" onClick={() => setInviteTarget(null)}>취소</button>
        <button className="ui-btn-primary" type="button" onClick={inviteToHouse}
                disabled={!selectedHouseId || inviteLoading}>
          {inviteLoading ? '초대 중…' : '초대 보내기'}
        </button>
      </>}>
        <p className="modal-description">방장인 비공개 House 중 하나를 선택해주세요.</p>
        {houseLoading && <div className="ui-empty"><p>House 목록을 불러오는 중…</p></div>}
        {!houseLoading && ownedHouses.length === 0 && (
          <div className="ui-empty">
            <p>초대할 수 있는 비공개 House가 없습니다.</p>
            <button className="ui-btn-secondary house-empty-link" type="button" onClick={() => {
              const friend = inviteTarget;
              setInviteTarget(null);
              navigate('/houses/new', { state: { invitedFriends: [friend] } });
            }}>비공개 House 만들기</button>
          </div>
        )}
        {!houseLoading && ownedHouses.length > 0 && (
          <div className="modal-selection-list">
            {ownedHouses.map((house) => {
              const unavailable = houseAvailability(house);
              return (
                <label className={`modal-selection-row fp-house-option${unavailable ? ' disabled' : ''}`} key={house.id}>
                  <input type="radio" name="invite-house" value={house.id} disabled={Boolean(unavailable)}
                         checked={selectedHouseId === house.id} onChange={() => setSelectedHouseId(house.id)} />
                  <span className="modal-selection-copy">
                    <strong>{house.name}</strong>
                    <small>{unavailable || `${house.game} · ${house.members.length}/${house.maxMembers}명`}</small>
                  </span>
                </label>
              );
            })}
          </div>
        )}
        {inviteError && <div className="house-alert error" role="alert">{inviteError}</div>}
      </Modal>
    </div>
  );
}
