import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import FriendButton from '../components/FriendButton';
import TierBadge from '../components/TierBadge';
import { timeAgo, csv, profileTags, profileMeta } from '../utils';
import RiotProfileCard from '../components/RiotProfileCard';
import { profileFromUser } from '../api/riot';

// styles.css에 없는 것만 여기서 정의 (.dp 스코프, 색은 전역 토큰 참조)
const styles = `
.dp .dp-title { font-size: 26px; font-weight: 800; color: var(--text-main); letter-spacing: -.5px; margin: 0; word-break: keep-all; }
.dp .dp-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 16px; transition: all .2s ease; }
.dp .dp-card.clickable { cursor: pointer; }
.dp .dp-card.clickable:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.2); }
.dp .dp-section { font-size: 16px; font-weight: 800; margin: 32px 0 16px; color: var(--text-main); }
.dp .dp-body { font-size: 14.5px; line-height: 1.7; white-space: pre-wrap; color: var(--text-main); margin: 0; }
.dp .dp-actions { display: flex; gap: 12px; flex-wrap: wrap; margin: 24px 0; align-items: center; }

/* 알약형 상태 배지 */
.dp .dp-status { font-size: 14px; font-weight: 800; display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; white-space: nowrap; }
.dp .dp-status.open { color: var(--online); background: rgba(16,185,129,.1); }
.dp .dp-status.done { color: var(--text-muted); background: var(--surface); border: 1px solid var(--border); }

/* 네온 점 */
.dp .dp-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--online); box-shadow: 0 0 6px var(--online); display: inline-block; }
.dp .dp-dot.off { background: var(--border); box-shadow: none; }

/* 태그 색 변형 (기존 .ui-tag2 위에 얹어 씀) */
.dp .ui-tags { align-items: center; }
.dp .ui-tag2 { display: inline-flex; align-items: center; gap: 4px; line-height: 1; }
.dp .ui-tag2.dp-primary { color: var(--primary); }
.dp .ui-tag2.dp-ok { color: var(--online); background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.2); }

/* 작은 버튼 (기존 .ui-btn-* 와 함께) */
.dp .dp-btn-sm { height: 34px; padding: 0 14px; font-size: 13px; }
/* muted 큰버튼 (모집완료 처리) */
.dp .dp-btn-muted { background: var(--border); box-shadow: none; color: var(--text-main); }
`;

export default function PostDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [apps, setApps] = useState([]);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/posts/${id}`);
      setPost(data);
      if (data.mine) {
        const res = await api.get(`/posts/${id}/applications`);
        setApps(res.data);
      }
    } catch (err) {
      alert(errMsg(err));
      navigate('/');
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const apply = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      await api.post(`/posts/${id}/apply`);
      alert('참가 신청이 완료되었습니다!');
      load();
    } catch (err) { alert(errMsg(err)); }
  };

  const cancelApplication = async () => {
    if (!confirm('참가 신청을 취소할까요?')) return;
    try {
      await api.delete(`/posts/${id}/apply`);
      alert('참가 신청이 취소되었습니다.');
      load();
    } catch (err) { alert(errMsg(err)); }
  };

  const approve = async (appId) => {
    try {
      const { data } = await api.post(`/applications/${appId}/approve`);
      if (confirm('승인했습니다. 파티 채팅방으로 이동할까요?')) navigate(`/chat/${data.chatRoomId}`);
      else load();
    } catch (err) { alert(errMsg(err)); load(); }
  };

  const confirmMember = async (appId) => {
    try { await api.post(`/applications/${appId}/confirm`); load(); }
    catch (err) { alert(errMsg(err)); }
  };

  const reject = async (appId) => {
    if (!confirm('이 신청을 거절할까요?')) return;
    try { await api.post(`/applications/${appId}/reject`); load(); }
    catch (err) { alert(errMsg(err)); }
  };

  const close = async () => {
    // TODO(house-suggestion): 모집완료는 게임 종료가 아니다. 실제 game/party 종료 이벤트가
    // participant 목록과 고유 suggestionId를 제공하면 HouseCreateSuggestionModal을 연결한다.
    if (!confirm('모집을 완료 처리할까요? 이후 참가 신청을 받지 않습니다.')) return;
    try { await api.post(`/posts/${id}/close`); load(); }
    catch (err) { alert(errMsg(err)); }
  };

  const remove = async () => {
    if (!confirm('이 모집글을 삭제할까요? 채팅방까지 함께 삭제됩니다.')) return;
    try { await api.delete(`/posts/${id}`); navigate('/'); }
    catch (err) { alert(errMsg(err)); }
  };

  if (!post) return null;
  const recruiting = post.status === 'RECRUITING';

  return (
    <div className="page dp">
      <style>{styles}</style>
      <div className="ui-narrow">
        {/* 제목 + 상태 */}
        <div className="between" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
          <h1 className="dp-title">{post.title}</h1>
          <span className={`dp-status ${recruiting ? 'open' : 'done'}`}>
            {recruiting ? '모집중' : '모집완료'}
          </span>
        </div>
        <div className="ui-time" style={{ marginBottom: 24 }}>
          {timeAgo(post.createdAt)}{post.mine ? ' · 내 모집글' : ''}
        </div>

        {/* 모집 조건 */}
        <div className="dp-card">
          <div className="dp-section" style={{ marginTop: 0, fontSize: 15 }}>모집 조건</div>
          <div className="ui-tags" style={{ marginBottom: csv(post.positions).length > 0 ? 12 : 0 }}>
            {post.game && <span className="ui-game-badge">{post.game}</span>}
            {post.gameMode && <span className="ui-tag2">{post.gameMode}</span>}
            {post.playTime && <span className="ui-tag2">🕐 {post.playTime}</span>}
            <span className={`ui-tag2${post.micRequired ? ' is-highlight' : ''}`}>
              {post.micRequired ? '🎙 마이크 필수' : '마이크 무관'}
            </span>
            <span className="ui-tag2">인원 {post.currentMembers}/{post.targetMembers}</span>
          </div>
          {csv(post.positions).length > 0 && (
            <div className="ui-tags" style={{ alignItems: 'center' }}>
              <span className="ui-time" style={{ fontWeight: 600 }}>찾는 포지션:</span>
              {csv(post.positions).map((p) => <span key={p} className="ui-tag2 is-highlight">{p}</span>)}
            </div>
          )}
        </div>

        {/* 내용 */}
        <div className="dp-card">
          <p className="dp-body">{post.content}</p>
        </div>

{/* 작성자 */}
        <div className="dp-section">작성자</div>
        <div className="dp-card clickable" onClick={() => navigate(`/profile/${post.author.id}`)}>
          <div className="between" style={{ gap: 12, flexWrap: 'wrap' }}>
            <div className="ui-author">
              <span className="ui-avatar-ring"><Avatar user={post.author} /></span>
              <div className="ui-author-info">
                <div className="ui-author-name">
                  {post.author.nickname}
                  <span className={`dp-dot ${post.author.online ? '' : 'off'}`} />
                  <TierBadge user={post.author} />
                </div>
                <div className="ui-time">
                  {[profileMeta(post.author), profileTags(post.author).join(' ')].filter(Boolean).join(' · ')}
                </div>
                {/* 티어는 위 배지에 이미 있으므로 모스트 챔피언만 */}
                <RiotProfileCard profile={profileFromUser(post.author)} variant="compact" showTier={false} />
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <FriendButton userId={post.author.id} compact />
            </div>
          </div>
        </div>

        {/* 액션 */}
        {post.mine ? (
          <div className="dp-actions">
            <button className="ui-btn-secondary" onClick={() => navigate(`/post/${id}/edit`)}>수정</button>
            <button className="ui-btn-secondary" onClick={remove}>삭제</button>
            {recruiting && (
              <button className="ui-btn-primary dp-btn-muted" onClick={close}>모집완료 처리</button>
            )}
            {post.chatRoomId && (
              <button className="ui-btn-primary" onClick={() => navigate(`/chat/${post.chatRoomId}`)}>
                파티 채팅방
              </button>
            )}
          </div>
        ) : (
          <div className="dp-actions">
            {post.myApplicationStatus === null && recruiting && (
              <button className="ui-btn-primary" onClick={apply}>참가 신청</button>
            )}
            {post.myApplicationStatus === 'PENDING' && (
              <>
                <span className="ui-tag2 is-highlight" style={{ padding: '12px 20px', fontSize: 14 }}>신청 대기중</span>
                <button className="ui-btn-secondary" onClick={cancelApplication}>신청 취소</button>
              </>
            )}
            {(post.myApplicationStatus === 'APPROVED' || post.myApplicationStatus === 'CONFIRMED') && post.chatRoomId && (
              <button className="ui-btn-primary" onClick={() => navigate(`/chat/${post.chatRoomId}`)}>
                {post.myApplicationStatus === 'CONFIRMED' ? '확정됨 — 파티 채팅방' : '승인됨 — 파티 채팅방'}
              </button>
            )}
            {post.myApplicationStatus === 'REJECTED' && <span className="ui-tag2">거절됨</span>}
            {!recruiting && !post.myApplicationStatus && (
              <span className="ui-tag2" style={{ padding: '12px 20px', fontSize: 14 }}>모집이 완료된 글입니다</span>
            )}
          </div>
        )}

        {/* 신청자 목록 (방장) */}
        {post.mine && (
          <>
            <div className="dp-section">신청자 {apps.length > 0 && `(${apps.length})`}</div>
            {apps.length === 0 && <div className="ui-empty"><p>아직 신청자가 없습니다.</p></div>}
            {apps.map((app) => (
              <div key={app.id} className="dp-card"
                   style={app.status === 'REJECTED' ? { opacity: 0.55 } : undefined}>
                <div className="between" style={{ flexWrap: 'wrap', gap: 8 }}>
                  <div className="ui-author" style={{ cursor: 'pointer' }}
                       onClick={() => navigate(`/profile/${app.applicant.id}`)}>
                    <Avatar user={app.applicant} />
                    <div className="ui-author-info">
                      <div className="ui-author-name">
                        {app.applicant.nickname}
                        <span className={`dp-dot ${app.applicant.online ? '' : 'off'}`} />
                        <TierBadge user={app.applicant} />
                      </div>
                      <div className="ui-time">
                        {[profileMeta(app.applicant), profileTags(app.applicant).join(' ')].filter(Boolean).join(' · ')}
                      </div>
                      <RiotProfileCard profile={profileFromUser(app.applicant)} variant="compact" showTier={false} />
                    </div>
                  </div>
                  <div className="flex">
                    {app.status === 'PENDING' && (
                      <>
                        <button className="ui-btn-primary dp-btn-sm" onClick={() => approve(app.id)}>승인 → 채팅 초대</button>
                        <button className="ui-btn-secondary dp-btn-sm" onClick={() => reject(app.id)}>거절</button>
                      </>
                    )}
                    {app.status === 'APPROVED' && (
                      <>
                        <span className="ui-tag2 dp-primary">채팅 참여중</span>
                        <button className="ui-btn-primary dp-btn-sm" onClick={() => confirmMember(app.id)}>확정</button>
                      </>
                    )}
                    {app.status === 'CONFIRMED' && <span className="ui-tag2 dp-ok">✔ 확정</span>}
                    {app.status === 'REJECTED' && <span className="ui-time">거절됨</span>}
                    <FriendButton userId={app.applicant.id} compact />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
