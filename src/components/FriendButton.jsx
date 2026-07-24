import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFriends } from '../context/FriendContext';

/**
 * 친구 관계에 따라 알맞은 버튼을 렌더.
 * - NONE     → 친구 신청
 * - SENT     → 신청함 + 취소
 * - RECEIVED → 수락 + 거절
 * - FRIEND   → ✔ 친구 (태그)
 * - SELF     → 렌더 안 함
 *
 * props:
 *  - userId  : 상대 userId
 *  - compact : 게시글 카드용 작은 버튼
 *  - block   : 부모 flex 안에서 꽉 채우기(프로필 액션 영역 50/50 용). 높이 44px 고정.
 */
export default function FriendButton({ userId, compact = false, block = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getRelation, getRequestId, sendRequest, acceptRequest, deleteRequest } = useFriends();
  const [busy, setBusy] = useState(false);

  const relation = getRelation(userId);
  if (relation === 'SELF' || !userId) return null;

  const sm = compact ? ' ui-btn-sm' : '';
  // block: 루트가 부모 flex에서 한 칸(flex:1)을 차지하고, 내부 버튼은 높이 44px로 채움
  const rootStyle = block ? { flex: 1, display: 'flex', gap: 8 } : { gap: 8 };
  const itemStyle = block ? { flex: 1, height: 44 } : undefined;

  const run = async (fn) => {
    if (busy) return;
    setBusy(true);
    try { await fn(); }
    catch (err) { alert(errMsg(err)); }
    finally { setBusy(false); }
  };

  const onSend = () => {
    if (!user) { navigate('/login'); return; }
    run(() => sendRequest(userId));
  };
  const onAccept = () => run(() => acceptRequest(getRequestId(userId)));
  const onCancelOrReject = () => run(() => deleteRequest(getRequestId(userId)));

  if (relation === 'FRIEND') {
    return (
      <span className="ui-tag2 is-friend"
            style={block ? { flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' } : undefined}>
        ✔ 친구
      </span>
    );
  }

  if (relation === 'SENT') {
    return (
      <div className="flex" style={rootStyle}>
        <span className="ui-tag2"
              style={block ? { flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' } : undefined}>
          신청함
        </span>
        <button className={`ui-btn-secondary${sm}`} style={itemStyle} onClick={onCancelOrReject} disabled={busy}>
          취소
        </button>
      </div>
    );
  }

  if (relation === 'RECEIVED') {
    return (
      <div className="flex" style={rootStyle}>
        <button className={`ui-btn-primary${sm}`} style={itemStyle} onClick={onAccept} disabled={busy}>수락</button>
        <button className={`ui-btn-secondary${sm}`} style={itemStyle} onClick={onCancelOrReject} disabled={busy}>거절</button>
      </div>
    );
  }

  // NONE
  return (
    <button className={`ui-btn-primary${sm}`} style={block ? { flex: 1, height: 44 } : undefined}
            onClick={onSend} disabled={busy}>
      친구 신청
    </button>
  );
}
