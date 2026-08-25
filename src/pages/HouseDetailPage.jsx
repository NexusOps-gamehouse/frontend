import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  approveJoinRequest,
  cancelJoinRequest,
  createHouseNotice,
  deleteHouseNotice,
  getHouse,
  inviteFriends,
  listJoinRequests,
  listHouseNotices,
  removeHouseMember,
  rejectJoinRequest,
  requestHouseJoin,
  updateHouseNotice,
  updateMemberRole,
} from '../api/houses';
import HouseInviteModal from '../components/HouseInviteModal';
import HouseNoticeFormModal from '../components/HouseNoticeFormModal';
import HouseSchedulesSection from '../components/HouseSchedulesSection';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useFriends } from '../context/FriendContext';
import './Houses.css';

const TYPE_LABEL = { SOCIAL: '친목형', COMPETITIVE: '경쟁형' };
const ROLE_LABEL = { OWNER: '방장', MANAGER: '부방장', MEMBER: '일반 멤버' };
const MEMBER_ROLES = ['OWNER', 'MANAGER', 'MEMBER'];
const NOTICE_MANAGER_ROLES = ['OWNER', 'MANAGER'];
const NOTICE_DATE_FORMAT = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

const newestFirst = (items) => [...items].sort((a, b) => (
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
));

const formatNoticeDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '작성일 정보 없음' : NOTICE_DATE_FORMAT.format(date);
};

export default function HouseDetailPage() {
  const { houseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { friends, loading: friendsLoading } = useFriends();
  const [house, setHouse] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(() => location.state?.houseCreationNotice || '');
  const [accessDenied, setAccessDenied] = useState(false);
  const [working, setWorking] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removingMember, setRemovingMember] = useState(false);
  const [removeError, setRemoveError] = useState('');
  const [notices, setNotices] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(false);
  const [noticesError, setNoticesError] = useState('');
  const [noticeEditor, setNoticeEditor] = useState(null);
  const [noticeToDelete, setNoticeToDelete] = useState(null);
  const [deletingNotice, setDeletingNotice] = useState(false);
  const [deleteNoticeError, setDeleteNoticeError] = useState('');

  const loadNotices = useCallback(async () => {
    setNoticesLoading(true);
    setNoticesError('');
    try {
      setNotices(newestFirst(await listHouseNotices(houseId, user)));
    } catch (err) {
      setNotices([]);
      setNoticesError(err.message || '공지를 불러오지 못했습니다.');
    } finally {
      setNoticesLoading(false);
    }
  }, [houseId, user]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getHouse(houseId, user);
      setHouse(data);
      if (MEMBER_ROLES.includes(data.myStatus)) {
        await loadNotices();
      } else {
        setNotices([]);
        setNoticesError('');
      }
      if (data.myStatus === 'OWNER' && data.visibility === 'PUBLIC') {
        setRequestsLoading(true);
        try {
          setRequests(await listJoinRequests(houseId, user));
        } finally {
          setRequestsLoading(false);
        }
      } else {
        setRequests([]);
      }
    } catch (err) {
      setAccessDenied(err.code === 'PRIVATE_HOUSE');
      setError(err.message || 'House를 불러오지 못했습니다.');
      setHouse(null);
    } finally {
      setLoading(false);
    }
  }, [houseId, loadNotices, user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!location.state?.houseCreationNotice) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const run = async (key, task, successMessage) => {
    setWorking(key);
    setError('');
    setNotice('');
    try {
      const updated = await task();
      if (updated?.members) setHouse(updated);
      if (successMessage) setNotice(successMessage);
      return updated;
    } catch (err) {
      setError(err.message || '요청을 처리하지 못했습니다.');
      throw err;
    } finally {
      setWorking('');
    }
  };

  const requestJoin = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/houses/${houseId}` } });
      return;
    }
    try {
      await run('join', () => requestHouseJoin(houseId, user), '가입 신청을 보냈습니다.');
    } catch { /* 화면 오류로 안내 */ }
  };

  const cancelRequest = async () => {
    try {
      await run('cancel', () => cancelJoinRequest(houseId, user), '가입 신청을 취소했습니다.');
    } catch { /* 화면 오류로 안내 */ }
  };

  const decideRequest = async (requestId, decision) => {
    const task = decision === 'approve'
      ? () => approveJoinRequest(houseId, requestId, user)
      : () => rejectJoinRequest(houseId, requestId, user);
    try {
      await run(`${decision}-${requestId}`, task,
        decision === 'approve' ? '가입을 승인했습니다.' : '가입 신청을 거절했습니다.');
      setRequests((prev) => prev.filter((request) => request.id !== requestId));
    } catch { /* 화면 오류로 안내 */ }
  };

  const changeRole = async (member) => {
    const nextRole = member.role === 'MANAGER' ? 'MEMBER' : 'MANAGER';
    try {
      await run(`role-${member.id}`,
        () => updateMemberRole(houseId, member.id, nextRole, user),
        nextRole === 'MANAGER' ? '부방장으로 지정했습니다.' : '부방장 지정을 해제했습니다.');
    } catch { /* 화면 오류로 안내 */ }
  };

  const openRemoveMember = (member) => {
    setMemberToRemove(member);
    setRemoveError('');
  };

  const closeRemoveMember = () => {
    if (removingMember) return;
    setMemberToRemove(null);
    setRemoveError('');
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove || removingMember) return;
    setRemovingMember(true);
    setRemoveError('');
    setError('');
    setNotice('');
    try {
      const updated = await removeHouseMember(houseId, memberToRemove.id, user);
      const nickname = memberToRemove.nickname;
      setHouse(updated);
      setMemberToRemove(null);
      setNotice(`${nickname}님을 House에서 강퇴했습니다.`);
    } catch (err) {
      setRemoveError(err.message || '멤버를 강퇴하지 못했습니다.');
    } finally {
      setRemovingMember(false);
    }
  };

  const saveNotice = async (values) => {
    const saved = noticeEditor?.notice
      ? await updateHouseNotice(houseId, noticeEditor.notice.id, values, user)
      : await createHouseNotice(houseId, values, user);
    setNotices((prev) => newestFirst(noticeEditor?.notice
      ? prev.map((item) => (item.id === saved.id ? saved : item))
      : [saved, ...prev]));
    setNoticeEditor(null);
    setNotice(noticeEditor?.notice ? '공지를 수정했습니다.' : '공지를 등록했습니다.');
  };

  const openDeleteNotice = (houseNotice) => {
    setNoticeToDelete(houseNotice);
    setDeleteNoticeError('');
  };

  const closeDeleteNotice = () => {
    if (deletingNotice) return;
    setNoticeToDelete(null);
    setDeleteNoticeError('');
  };

  const confirmDeleteNotice = async () => {
    if (!noticeToDelete || deletingNotice) return;
    setDeletingNotice(true);
    setDeleteNoticeError('');
    try {
      await deleteHouseNotice(houseId, noticeToDelete.id, user);
      setNotices((prev) => prev.filter((item) => item.id !== noticeToDelete.id));
      setNoticeToDelete(null);
      setNotice('공지를 삭제했습니다.');
    } catch (err) {
      setDeleteNoticeError(err.message || '공지를 삭제하지 못했습니다.');
    } finally {
      setDeletingNotice(false);
    }
  };

  const invite = async (selectedFriends) => {
    const result = await run('invite', () => inviteFriends(houseId, selectedFriends, user));
    if (result?.house) setHouse(result.house);
    setNotice(`${result.invitedCount}명에게 House 초대를 보냈습니다.`);
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
  const isOwner = house.myStatus === 'OWNER';
  const isMember = MEMBER_ROLES.includes(house.myStatus);
  const canManageNotices = NOTICE_MANAGER_ROLES.includes(house.myStatus);
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
            {isMember && <span className={`role-badge ${house.myStatus.toLowerCase()}`}>{ROLE_LABEL[house.myStatus]}</span>}
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
              <p>비공개 House는 초대로만 가입할 수 있습니다.<br />현재 역할: {ROLE_LABEL[house.myStatus]}</p>
              {isOwner && <button className="ui-btn-primary" type="button" onClick={() => setInviteOpen(true)}>친구 초대</button>}
            </>
          ) : house.myStatus === 'PENDING' ? (
            <>
              <p>가입 신청을 보냈습니다.<br />방장의 승인을 기다려주세요.</p>
              <button className="ui-btn-secondary" type="button" disabled={working === 'cancel'} onClick={cancelRequest}>
                {working === 'cancel' ? '취소 중…' : '가입 신청 취소'}
              </button>
            </>
          ) : isMember ? (
            <>
              <p>{isOwner ? '이 House의 방장입니다.' : `이 House의 ${ROLE_LABEL[house.myStatus]}입니다.`}</p>
              <button className="ui-btn-secondary" type="button" disabled>{ROLE_LABEL[house.myStatus]}</button>
            </>
          ) : isFull ? (
            <>
              <p>House 정원이 가득 찼습니다.<br />자리가 생기면 가입을 신청할 수 있어요.</p>
              <button className="ui-btn-secondary" type="button" disabled>정원 마감</button>
            </>
          ) : (
            <>
              <p>공개 House는 누구나 가입을 신청할 수 있습니다.</p>
              <button className="ui-btn-primary" type="button" disabled={working === 'join'} onClick={requestJoin}>
                {working === 'join' ? '신청 중…' : user ? '가입 신청하기' : '로그인하고 가입 신청'}
              </button>
            </>
          )}
        </aside>
      </section>

      {error && <div className="house-alert error detail-error" role="alert">{error}</div>}
      {notice && <div className="house-alert success detail-error" role="status">{notice}</div>}

      {isOwner && !isPrivate && (
        <section className="house-management-section">
          <div className="house-section-head">
            <h2>가입 신청</h2><span>{requests.length}건</span>
          </div>
          {requestsLoading && <div className="ui-empty"><p>가입 신청을 불러오는 중…</p></div>}
          {!requestsLoading && requests.length === 0 && <div className="ui-empty"><p>대기 중인 가입 신청이 없습니다.</p></div>}
          {!requestsLoading && requests.length > 0 && (
            <div className="house-request-list">
              {requests.map((request) => (
                <div className="house-request-row" key={request.id}>
                  <div className="ui-author">
                    <div className="ui-author-av">{request.nickname?.[0] || '?'}</div>
                    <div className="ui-author-info"><strong>{request.nickname}</strong><small>가입 승인 대기중</small></div>
                  </div>
                  <div className="house-row-actions">
                    <button className="ui-btn-primary ui-btn-sm" type="button"
                            disabled={working === `approve-${request.id}` || isFull}
                            onClick={() => decideRequest(request.id, 'approve')}>승인</button>
                    <button className="ui-btn-secondary ui-btn-sm" type="button"
                            disabled={working === `reject-${request.id}`}
                            onClick={() => decideRequest(request.id, 'reject')}>거절</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {isMember && (
        <section className="house-notices-section">
          <div className="house-section-head">
            <h2>House 공지</h2><span>{notices.length}건</span>
            {canManageNotices && (
              <button className="ui-btn-primary ui-btn-sm house-section-action" type="button"
                      onClick={() => setNoticeEditor({ notice: null })}>+ 공지 작성</button>
            )}
          </div>
          {noticesLoading && <div className="ui-empty"><p>공지를 불러오는 중…</p></div>}
          {!noticesLoading && noticesError && (
            <div className="house-notice-error" role="alert">
              <p>{noticesError}</p>
              <button className="ui-btn-secondary ui-btn-sm" type="button" onClick={loadNotices}>다시 시도</button>
            </div>
          )}
          {!noticesLoading && !noticesError && notices.length === 0 && (
            <div className="ui-empty"><p>등록된 공지가 없습니다.</p></div>
          )}
          {!noticesLoading && !noticesError && notices.length > 0 && (
            <div className="house-notice-list">
              {notices.map((houseNotice) => (
                <article className="house-notice-card" key={houseNotice.id}>
                  <div className="house-notice-head">
                    <div>
                      <h3>{houseNotice.title}</h3>
                      <div className="house-notice-meta">
                        <span>{houseNotice.author?.nickname || 'House 멤버'}</span>
                        <span>{ROLE_LABEL[houseNotice.author?.role] || '일반 멤버'}</span>
                        <time dateTime={houseNotice.createdAt}>{formatNoticeDate(houseNotice.createdAt)}</time>
                        {houseNotice.updatedAt && <span className="house-notice-edited">수정됨</span>}
                      </div>
                    </div>
                    {canManageNotices && (
                      <div className="house-notice-actions">
                        <button className="house-role-btn" type="button"
                                onClick={() => setNoticeEditor({ notice: houseNotice })}>수정</button>
                        <button className="house-remove-btn" type="button"
                                onClick={() => openDeleteNotice(houseNotice)}>삭제</button>
                      </div>
                    )}
                  </div>
                  <p>{houseNotice.content}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {isMember && <HouseSchedulesSection house={house} user={user} onSuccess={setNotice} />}

      <section className="house-members-section">
        <div className="house-section-head">
          <h2>House 멤버</h2><span>{house.members.length}명</span>
          {isOwner && isPrivate && (
            <button className="ui-btn-secondary ui-btn-sm house-section-action" type="button"
                    onClick={() => setInviteOpen(true)}>+ 친구 초대</button>
          )}
        </div>
        <div className="house-members-list">
          {house.members.map((member) => (
            <div className="house-member" key={member.id}>
              <div className="ui-author-av">{member.nickname?.[0] || '?'}</div>
              <span className="house-member-name">{member.nickname}</span>
              <span className={`role-badge ${member.role.toLowerCase()}`}>{ROLE_LABEL[member.role]}</span>
              {isOwner && member.role !== 'OWNER' && (
                <div className="house-member-actions">
                  <button className="house-role-btn" type="button" disabled={working === `role-${member.id}`}
                          onClick={() => changeRole(member)}>
                    {member.role === 'MANAGER' ? '부방장 해제' : '부방장 지정'}
                  </button>
                  <button className="house-remove-btn" type="button" onClick={() => openRemoveMember(member)}>
                    강퇴
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <HouseInviteModal open={inviteOpen} house={house} friends={friends}
                        friendsLoading={friendsLoading} onClose={() => setInviteOpen(false)} onInvite={invite} />
      <HouseNoticeFormModal open={Boolean(noticeEditor)} notice={noticeEditor?.notice}
                            onClose={() => setNoticeEditor(null)} onSubmit={saveNotice} />
      <Modal open={Boolean(noticeToDelete)} title="공지 삭제" size="sm"
             onClose={closeDeleteNotice} footer={<>
        <button className="ui-btn-secondary" type="button" disabled={deletingNotice}
                onClick={closeDeleteNotice}>취소</button>
        <button className="house-danger-btn" type="button" disabled={deletingNotice}
                onClick={confirmDeleteNotice}>
          {deletingNotice ? '삭제 중…' : '삭제'}
        </button>
      </>}>
        <div className="house-danger-copy">
          <div aria-hidden="true">⚠️</div>
          <p><strong>{noticeToDelete?.title}</strong> 공지를 삭제할까요?</p>
          <small>삭제한 공지는 다시 복구할 수 없습니다.</small>
        </div>
        {deleteNoticeError && <div className="house-alert error" role="alert">{deleteNoticeError}</div>}
      </Modal>
      <Modal open={Boolean(memberToRemove)} title="House 멤버 강퇴" size="sm"
             onClose={closeRemoveMember} footer={<>
        <button className="ui-btn-secondary" type="button" disabled={removingMember}
                onClick={closeRemoveMember}>취소</button>
        <button className="house-danger-btn" type="button" disabled={removingMember}
                onClick={confirmRemoveMember}>
          {removingMember ? '강퇴 중…' : '강퇴'}
        </button>
      </>}>
        <div className="house-danger-copy">
          <div aria-hidden="true">⚠️</div>
          <p><strong>{memberToRemove?.nickname}</strong>님을 House에서 강퇴할까요?</p>
          <small>강퇴된 멤버는 비공개 House 상세에 더 이상 접근할 수 없습니다.</small>
        </div>
        {removeError && <div className="house-alert error" role="alert">{removeError}</div>}
      </Modal>
    </div>
  );
}
