import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { csv, profileTags, profileMeta } from '../utils';

const APP_STATUS = {
  PENDING: '대기중',
  APPROVED: '승인됨 → 채팅방',
  CONFIRMED: '✔ 확정 → 채팅방',
};

export default function MyPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [myPosts, setMyPosts] = useState([]);
  const [myApps, setMyApps] = useState([]);

  useEffect(() => {
    api.get('/users/me').then(({ data }) => updateUser(data)).catch(() => {});
    api.get('/my/posts').then(({ data }) => setMyPosts(data)).catch(() => {});
    api.get('/my/applications').then(({ data }) => setMyApps(data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  return (
    <div className="page">
      <div className="center chat">
        <div className="card">
          <div className="between">
            <div className="flex">
              <Avatar user={user} size="lg" />
              <div>
                <div className="name">{user.nickname}</div>
                <div className="meta">
                  {[profileMeta(user), profileTags(user).join(' ')].filter(Boolean).join(' · ')}
                </div>
                {(csv(user.gameModes).length > 0 || user.riotNickname) && (
                  <div className="meta">
                    {[csv(user.gameModes).join('/'), user.riotNickname].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            </div>
            <button className="btn2 sm" onClick={() => navigate('/mypage/edit')}>프로필 수정</button>
          </div>
        </div>

        <p className="q section-gap">내 모집글</p>
        {myPosts.length === 0 && <p className="meta">작성한 모집글이 없습니다.</p>}
        {myPosts.map((post) => (
          <div key={post.id} className="card between clickable"
               onClick={() => navigate(`/post/${post.id}`)}>
            <span style={{ fontSize: 13 }}>{post.title}</span>
            <div className="flex">
              <span className="tag" style={post.status === 'RECRUITING'
                ? { background: '#e8f5ec', color: '#2b7a43' } : undefined}>
                {post.status === 'RECRUITING' ? '모집중' : '모집완료'}
              </span>
              <span className="tag">{post.currentMembers}/{post.targetMembers}명</span>
              <span className="meta">신청 {post.pendingCount}</span>
            </div>
          </div>
        ))}

        <p className="q section-gap">내 신청 현황</p>
        {myApps.length === 0 && (
          <p className="meta">신청 내역이 없습니다. (1시간이 지난 대기 신청은 자동 만료됩니다)</p>
        )}
        {myApps.map((app) => (
          <div key={app.id} className="card between clickable"
               onClick={() => (app.chatRoomId ? navigate(`/chat/${app.chatRoomId}`) : navigate(`/post/${app.postId}`))}>
            <span style={{ fontSize: 13 }}>{app.postTitle}</span>
            <span className="tag">{APP_STATUS[app.status] || app.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
