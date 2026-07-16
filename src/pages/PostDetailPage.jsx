import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { timeAgo, csv, profileTags, profileMeta } from '../utils';

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
    <div className="page">
      <div className="center chat">
        {/* 제목 + 상태 */}
        <div className="between" style={{ marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
          <p className="h2" style={{ margin: 0 }}>{post.title}</p>
          <span className="tag" style={recruiting ? { background: '#e8f5ec', color: '#2b7a43' } : undefined}>
            {recruiting ? '모집중' : '모집완료'}
          </span>
        </div>
        <p className="meta" style={{ marginBottom: 16 }}>{timeAgo(post.createdAt)}</p>

        {/* 모집 조건 */}
        <div className="card">
          <p className="q">모집 조건</p>
          <div className="row" style={{ marginBottom: 6 }}>
            {post.game && <span className="tag">{post.game}</span>}
            {post.gameMode && <span className="tag">{post.gameMode}</span>}
            {post.playTime && <span className="tag">🕐 {post.playTime}</span>}
            <span className="tag">{post.micRequired ? '마이크 필수' : '마이크 무관'}</span>
            <span className="tag">인원 {post.currentMembers}/{post.targetMembers}</span>
          </div>
          {csv(post.positions).length > 0 && (
            <div className="row" style={{ marginBottom: 0 }}>
              <span className="meta">찾는 포지션:</span>
              {csv(post.positions).map((p) => <span key={p} className="tag">{p}</span>)}
            </div>
          )}
        </div>

        {/* 내용 */}
        <div className="card">
          <p style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{post.content}</p>
        </div>

        {/* 작성자 */}
        <div className="card clickable" onClick={() => navigate(`/profile/${post.author.id}`)}>
          <div className="flex">
            <Avatar user={post.author} />
            <div>
              <div className="name">
                {post.author.nickname}{' '}
                <span className={`dot ${post.author.online ? '' : 'off'}`} />
              </div>
              <div className="meta">
                {[profileMeta(post.author), profileTags(post.author).join(' ')].filter(Boolean).join(' · ')}
              </div>
            </div>
          </div>
        </div>

        {/* 액션 */}
        {post.mine ? (
          <div className="flex" style={{ margin: '14px 0' }}>
            <button className="btn2 sm" onClick={() => navigate(`/post/${id}/edit`)}>수정</button>
            <button className="btn2 sm" onClick={remove}>삭제</button>
            {recruiting && <button className="btn sm" onClick={close}>모집완료</button>}
            {post.chatRoomId && (
              <button className="btn2 sm" onClick={() => navigate(`/chat/${post.chatRoomId}`)}>파티 채팅방</button>
            )}
          </div>
        ) : (
          <div style={{ margin: '14px 0' }}>
            {post.myApplicationStatus === null && recruiting && (
              <button className="btn" onClick={apply}>참가 신청</button>
            )}
            {post.myApplicationStatus === 'PENDING' && (
              <div className="flex">
                <span className="tag">신청 대기중</span>
                <button className="btn2 sm" onClick={cancelApplication}>신청 취소</button>
              </div>
            )}
            {(post.myApplicationStatus === 'APPROVED' || post.myApplicationStatus === 'CONFIRMED') && post.chatRoomId && (
              <button className="btn" onClick={() => navigate(`/chat/${post.chatRoomId}`)}>
                {post.myApplicationStatus === 'CONFIRMED' ? '확정됨 — 파티 채팅방' : '승인됨 — 파티 채팅방'}
              </button>
            )}
            {post.myApplicationStatus === 'REJECTED' && <span className="tag">거절됨</span>}
            {!recruiting && !post.myApplicationStatus && <span className="tag">모집이 완료된 글입니다</span>}
          </div>
        )}

        {/* 신청자 목록 (방장) */}
        {post.mine && (
          <>
            <p className="q section-gap">신청자 {apps.length > 0 && `(${apps.length})`}</p>
            {apps.length === 0 && <p className="meta">아직 신청자가 없습니다.</p>}
            {apps.map((app) => (
              <div key={app.id} className="card"
                   style={app.status === 'REJECTED' ? { opacity: 0.55 } : undefined}>
                <div className="between" style={{ flexWrap: 'wrap', gap: 8 }}>
                  <div className="flex" style={{ cursor: 'pointer' }}
                       onClick={() => navigate(`/profile/${app.applicant.id}`)}>
                    <Avatar user={app.applicant} />
                    <div>
                      <div className="name">
                        {app.applicant.nickname}{' '}
                        <span className={`dot ${app.applicant.online ? '' : 'off'}`} />
                      </div>
                      <div className="meta">
                        {[profileMeta(app.applicant), profileTags(app.applicant).join(' ')]
                          .filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex">
                    {app.status === 'PENDING' && (
                      <>
                        <button className="btn sm" onClick={() => approve(app.id)}>승인 → 채팅 초대</button>
                        <button className="btn2 sm" onClick={() => reject(app.id)}>거절</button>
                      </>
                    )}
                    {app.status === 'APPROVED' && (
                      <>
                        <span className="tag">채팅 참여중</span>
                        <button className="btn sm" onClick={() => confirmMember(app.id)}>확정</button>
                      </>
                    )}
                    {app.status === 'CONFIRMED' && <span className="tag">✔ 확정</span>}
                    {app.status === 'REJECTED' && <span className="meta">거절됨</span>}
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
