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

// 신청 상태별 뱃지 (대기중=기본, 승인=파랑, 확정=초록)
const APP_TAG_CLASS = {
  PENDING: 'ui-tag',
  APPROVED: 'ui-tag is-primary',
  CONFIRMED: 'ui-tag is-online',
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
      <div className="ui-narrow">
        {/* 프로필 카드 */}
        <div className="ui-profile-card">
          <div className="between">
            <div className="flex" style={{ gap: 20 }}>
              <div className="ui-avatar-ring">
                <Avatar user={user} size="lg" />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
                  {user.nickname}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {[profileMeta(user), profileTags(user).join(' ')].filter(Boolean).join(' · ')}
                </div>
                {(csv(user.gameModes).length > 0 || user.riotNickname) && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    {[csv(user.gameModes).join('/'), user.riotNickname].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            </div>
            <button className="ui-btn-secondary" onClick={() => navigate('/mypage/edit')}>
              프로필 수정
            </button>
          </div>
        </div>

        {/* 내 모집글 */}
        <p className="ui-section-title">내 모집글</p>
        {myPosts.length === 0 && (
          <div className="ui-empty">
            <p>작성한 모집글이 없습니다.<br />새로운 파티를 직접 꾸려보세요!</p>
          </div>
        )}
        {myPosts.map((post) => {
          const recruiting = post.status === 'RECRUITING';
          return (
            <div
              key={post.id}
              className={`ui-list-row${recruiting ? '' : ' is-done'}`}
              onClick={() => navigate(`/post/${post.id}`)}
            >
              <span className="row-title">{post.title}</span>
              <div className="flex">
                <span className={`ui-state ${recruiting ? 'is-open' : 'is-done'}`}>
                  {recruiting ? '모집중' : '모집완료'}
                </span>
                <span className="ui-tag">{post.currentMembers}/{post.targetMembers}명</span>
                {recruiting && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                    신청 {post.pendingCount}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* 내 신청 현황 */}
        <p className="ui-section-title">내 신청 현황</p>
        {myApps.length === 0 && (
          <div className="ui-empty">
            <p>
              신청 내역이 없습니다.<br />
              <span style={{ fontSize: 12, opacity: 0.7 }}>
                (1시간이 지난 대기 신청은 자동 만료됩니다)
              </span>
            </p>
          </div>
        )}
        {myApps.map((app) => (
          <div
            key={app.id}
            className="ui-list-row"
            onClick={() =>
              app.chatRoomId ? navigate(`/chat/${app.chatRoomId}`) : navigate(`/post/${app.postId}`)
            }
          >
            <span className="row-title">{app.postTitle}</span>
            <span className={APP_TAG_CLASS[app.status] || 'ui-tag'}>
              {APP_STATUS[app.status] || app.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}