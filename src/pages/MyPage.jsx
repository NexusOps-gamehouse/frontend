import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFriends } from '../context/FriendContext';
import Avatar from '../components/Avatar';
import TierBadge from '../components/TierBadge';
import RiotLinkCard from '../components/RiotLinkCard';
import { csv, profileTags, profileMeta, riotIdOf } from '../utils';

const APP_STATUS = {
  PENDING: '대기중',
  APPROVED: '승인됨 → 채팅방',
  CONFIRMED: '✔ 확정 → 채팅방',
};

const APP_TAG_CLASS = {
  PENDING: 'ui-tag',
  APPROVED: 'ui-tag is-primary',
  CONFIRMED: 'ui-tag is-online',
};

export default function MyPage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const { friends, receivedCount } = useFriends();

  const [myPosts, setMyPosts] = useState([]);
  const [myApps, setMyApps] = useState([]);

  useEffect(() => {
    api
      .get('/users/me')
      .then(({ data }) => updateUser(data))
      .catch(() => {});

    api
      .get('/my/posts')
      .then(({ data }) => setMyPosts(data))
      .catch(() => {});

    api
      .get('/my/applications')
      .then(({ data }) => setMyApps(data))
      .catch(() => {});

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doLogout = () => {
    if (!confirm('로그아웃 할까요?')) return;

    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="page">
      <div className="mypage-layout">
        <aside className="mypage-side">
          <div className="mypage-side-head">
            <span>친구 {friends.length}</span>

            {receivedCount > 0 && (
              <Link
                to="/friends"
                className="side-req-link"
              >
                받은 신청 {receivedCount} ›
              </Link>
            )}
          </div>

          {friends.length === 0 ? (
            <div className="side-empty">
              <p>아직 친구가 없습니다.</p>

              <Link
                to="/friends"
                className="side-req-link"
              >
                친구 관리 ›
              </Link>
            </div>
          ) : (
            <>
              {friends.slice(0, 12).map((friend) => (
                <div
                  key={friend.id}
                  className="side-friend"
                  onClick={() =>
                    navigate(`/profile/${friend.user.id}`)
                  }
                >
                  <Avatar user={friend.user} />

                  <span className="side-friend-name">
                    {friend.user.nickname}
                  </span>

                  <span
                    style={{
                      marginLeft: 'auto',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: friend.user.online
                        ? 'var(--online)'
                        : 'var(--border)',
                      boxShadow: friend.user.online
                        ? '0 0 6px var(--online)'
                        : 'none',
                    }}
                  />
                </div>
              ))}

              <Link
                to="/friends"
                className="side-req-link"
                style={{
                  display: 'inline-block',
                  marginTop: 12,
                  fontSize: 12,
                }}
              >
                친구 전체 보기 ›
              </Link>
            </>
          )}
        </aside>

        <div className="mypage-main">
          <div className="ui-profile-card">
            <div className="between">
              <div
                className="flex"
                style={{ gap: 20 }}
              >
                <div className="ui-avatar-ring">
                  <Avatar
                    user={user}
                    size="lg"
                  />
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      marginBottom: 6,
                    }}
                  >
                    {user.nickname}
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      color: 'var(--text-muted)',
                      lineHeight: 1.6,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>
                        {[
                          profileMeta(user),
                          profileTags(user).join(' '),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>

                      <TierBadge
                        user={user}
                        height={20}
                      />
                    </span>
                  </div>

                  {(csv(user.gameModes).length > 0 ||
                    riotIdOf(user)) && (
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--text-muted)',
                        marginTop: 4,
                      }}
                    >
                      {[
                        csv(user.gameModes).join('/'),
                        riotIdOf(user),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  )}
                </div>
              </div>

              <div
                className="flex"
                style={{
                  gap: 8,
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  className="ui-btn-secondary"
                  onClick={() =>
                    navigate('/customization')
                  }
                >
                  내 꾸미기
                </button>

                <button
                  type="button"
                  className="ui-btn-secondary"
                  onClick={() =>
                    navigate('/customization/shop')
                  }
                >
                  꾸미기 상점
                </button>

                <button
                  type="button"
                  className="ui-btn-secondary"
                  onClick={() =>
                    navigate('/mypage/edit')
                  }
                >
                  프로필 수정
                </button>
              </div>
            </div>
          </div>

          <RiotLinkCard />

          <p className="ui-section-title">
            내 모집글
          </p>

          {myPosts.length === 0 && (
            <div className="ui-empty">
              <p>
                작성한 모집글이 없습니다.
                <br />
                새로운 파티를 직접 꾸려보세요!
              </p>
            </div>
          )}

          {myPosts.map((post) => {
            const recruiting =
              post.status === 'RECRUITING';

            return (
              <div
                key={post.id}
                className={`ui-list-row${
                  recruiting ? '' : ' is-done'
                }`}
                onClick={() =>
                  navigate(`/post/${post.id}`)
                }
              >
                <span className="row-title">
                  {post.title}
                </span>

                <div className="flex">
                  <span
                    className={`ui-state ${
                      recruiting
                        ? 'is-open'
                        : 'is-done'
                    }`}
                  >
                    {recruiting
                      ? '모집중'
                      : '모집완료'}
                  </span>

                  <span className="ui-tag">
                    {post.currentMembers}/
                    {post.targetMembers}명
                  </span>

                  {recruiting && (
                    <span
                      style={{
                        fontSize: 12,
                        color:
                          'var(--text-muted)',
                        marginLeft: 8,
                      }}
                    >
                      신청 {post.pendingCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          <p className="ui-section-title">
            내 신청 현황
          </p>

          {myApps.length === 0 && (
            <div className="ui-empty">
              <p>
                신청 내역이 없습니다.
                <br />

                <span
                  style={{
                    fontSize: 12,
                    opacity: 0.7,
                  }}
                >
                  (1시간이 지난 대기 신청은 자동
                  만료됩니다)
                </span>
              </p>
            </div>
          )}

          {myApps.map((app) => (
            <div
              key={app.id}
              className="ui-list-row"
              onClick={() =>
                app.chatRoomId
                  ? navigate(
                      `/chat/${app.chatRoomId}`,
                    )
                  : navigate(
                      `/post/${app.postId}`,
                    )
              }
            >
              <span className="row-title">
                {app.postTitle}
              </span>

              <span
                className={
                  APP_TAG_CLASS[app.status] ||
                  'ui-tag'
                }
              >
                {APP_STATUS[app.status] ||
                  app.status}
              </span>
            </div>
          ))}

          <div
            style={{
              textAlign: 'center',
              marginTop: 48,
            }}
          >
            <button
              className="textlink"
              onClick={doLogout}
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}