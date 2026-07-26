import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { errMsg } from '../api/client';
import Avatar from '../components/Avatar';
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
  const [tab, setTab] = useState('friends');
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
            actions={<button className="ui-btn-secondary ui-btn-sm" onClick={() => onUnfriend(f.user)}>삭제</button>} />
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
    </div>
  );
}
