import {
  mockAddHouseXp,
  mockAcceptInvitation,
  mockCreateHouseNotice,
  mockCreateHouseSchedule,
  mockDeleteHouseNotice,
  mockDeleteHouseSchedule,
  mockGetHouseWeeklyQuests,
  mockGetHouseSuggestionState,
  mockInviteFriends,
  mockListHouseNotices,
  mockListHouseSchedules,
  mockListMyInvitations,
  mockRejectInvitation,
  mockRecordHouseQuestProgress,
  mockResetHouseSuggestion,
  mockDismissHouseSuggestion,
  mockUpdateHouseNotice,
  mockUpdateHouseSchedule,
  mockUpdateHouse,
  mockUpdateScheduleAttendance,
} from '../mocks/houseStorage';
import {
  mockListHouseMessages,
  mockSendHouseMessage,
  mockSubscribeHouseMessages,
} from '../mocks/houseChatStorage';
import api, { errMsg } from './client';

/**
 * House 화면이 의존하는 API 계약입니다.
 * Crew API 응답과 기존 House 화면 모델의 차이는 이 경계에서 정규화합니다.
 */
const ROLE_MAP = {
  LEADER: 'OWNER',
  SUB_LEADER: 'MANAGER',
  MEMBER: 'MEMBER',
};

const normalizeRole = (role) => ROLE_MAP[role] || null;

const normalizeMember = (member) => ({
  ...member,
  id: member.memberId,
  role: normalizeRole(member.role) || 'MEMBER',
});

export const normalizeHouse = (house) => {
  const members = Array.isArray(house.members) ? house.members.map(normalizeMember) : [];
  const type = house.type;

  return {
    ...house,
    // 기존 화면의 공개 여부 필터와 새 Crew API의 type(PUBLIC/PRIVATE)을 연결한다.
    visibility: type,
    memberCount: Number.isFinite(Number(house.memberCount))
      ? Number(house.memberCount)
      : members.length,
    members,
    // 기존 화면은 owner 객체를 사용하지만 Crew API는 leaderId만 제공한다.
    owner: { id: house.leaderId },
    // 역할과 상태는 서로 다른 값이다. 역할만 기존 UI 값으로 변환하고,
    // APPROVED/PENDING/REJECTED 상태는 Crew API 원문을 보존한다.
    myRole: normalizeRole(house.myRole),
    myStatus: house.myStatus ?? null,
  };
};

const requestCrew = async (request) => {
  try {
    const { data } = await request();
    return data;
  } catch (error) {
    const status = error.response?.status;
    const responseData = error.response?.data;
    const serverMessage = typeof responseData === 'string'
      ? responseData
      : responseData?.message;
    const fallbackMessage = status === 409
      ? '이미 가입했거나 신청 중이거나, House 정원이 가득 찼습니다.'
      : status === 403
        ? '이 작업을 수행할 권한이 없습니다.'
        : errMsg(error);
    const normalizedError = new Error(serverMessage || fallbackMessage);
    normalizedError.code = error.code;
    normalizedError.status = status;
    normalizedError.response = error.response;
    throw normalizedError;
  }
};

export const listHouses = () => requestCrew(() => api.get('/crew/houses'))
  .then((data) => (Array.isArray(data) ? data : []).map(normalizeHouse));

export const getHouse = (houseId) => requestCrew(
  () => api.get(`/crew/houses/${encodeURIComponent(houseId)}`),
).then(normalizeHouse);

const toCrewHouseWriteRequest = (payload = {}) => {
  const description = payload.description == null ? null : String(payload.description).trim();
  const request = {
    name: String(payload.name ?? '').trim(),
    description: description || null,
  };
  const type = ['PUBLIC', 'PRIVATE'].includes(payload.visibility)
    ? payload.visibility
    : ['PUBLIC', 'PRIVATE'].includes(payload.type) ? payload.type : undefined;
  const maxMembers = Number(payload.maxMembers);

  if (type) request.type = type;
  if (Number.isInteger(maxMembers) && maxMembers > 0) request.maxMembers = maxMembers;
  return request;
};

export const createHouse = (payload) => requestCrew(
  () => api.post('/crew/houses', toCrewHouseWriteRequest(payload)),
).then(normalizeHouse);

export const joinHouse = (houseId) => requestCrew(
  () => api.post(`/crew/houses/${encodeURIComponent(houseId)}/join`),
).then(normalizeHouse);

export const leaveHouse = (houseId) => requestCrew(
  () => api.delete(`/crew/houses/${encodeURIComponent(houseId)}/join`),
);

export const listJoinRequests = (houseId) => requestCrew(
  () => api.get(`/crew/houses/${encodeURIComponent(houseId)}/join-requests`),
).then((data) => (Array.isArray(data) ? data : []).map(normalizeMember));

export const approveJoinRequest = (houseId, userId) => requestCrew(
  () => api.post(
    `/crew/houses/${encodeURIComponent(houseId)}/members/${encodeURIComponent(userId)}/approve`,
  ),
).then(normalizeMember);

export const rejectJoinRequest = (houseId, userId) => requestCrew(
  () => api.post(
    `/crew/houses/${encodeURIComponent(houseId)}/members/${encodeURIComponent(userId)}/reject`,
  ),
).then(normalizeMember);

const CREW_ROLE_MAP = {
  OWNER: 'LEADER',
  MANAGER: 'SUB_LEADER',
  MEMBER: 'MEMBER',
  LEADER: 'LEADER',
  SUB_LEADER: 'SUB_LEADER',
};

export const updateMemberRole = (houseId, userId, role) => requestCrew(
  () => api.put(
    `/crew/houses/${encodeURIComponent(houseId)}/members/${encodeURIComponent(userId)}/role`,
    { role: CREW_ROLE_MAP[role] || role },
  ),
).then(normalizeMember);

export const removeHouseMember = (houseId, userId) => requestCrew(
  () => api.delete(
    `/crew/houses/${encodeURIComponent(houseId)}/members/${encodeURIComponent(userId)}`,
  ),
);

// 실제 API 연결 시 PUT /houses/:houseId 로 교체한다.
export const updateHouse = (houseId, payload, user) => mockUpdateHouse(houseId, payload, user);
// TODO(house-xp): 실제 서비스에서는 클라이언트가 XP 값을 결정하지 않는다.
// 서버가 게임·일정·퀘스트 활동을 검증해 POST /houses/:houseId/xp 로 지급한다.
export const addHouseXp = (houseId, amount, user) => mockAddHouseXp(houseId, amount, user);
// 실제 API 연결 시 GET /houses/:houseId/weekly-quests 로 교체한다.
export const getHouseWeeklyQuests = (houseId, user) => mockGetHouseWeeklyQuests(houseId, user);
// TODO(house-quests): 실서비스에서는 프론트가 진행도를 임의로 올리지 않는다.
// 서버가 게임 결과와 참여자를 검증해 POST /houses/:houseId/weekly-quests/progress 로 기록한다.
export const recordHouseQuestProgress = (houseId, questType, payload, user) => (
  mockRecordHouseQuestProgress(houseId, questType, payload, user)
);
// 기존 페이지/호출부와의 호환을 위한 이름이다. 실제 요청은 Crew endpoint를 사용한다.
export const requestHouseJoin = (houseId) => joinHouse(houseId);
export const cancelJoinRequest = (houseId) => leaveHouse(houseId);
// 실제 API 연결 시 GET /houses/:houseId/notices 로 교체한다.
export const listHouseNotices = (houseId, user) => mockListHouseNotices(houseId, user);
// 실제 API 연결 시 POST /houses/:houseId/notices 로 교체한다.
export const createHouseNotice = (houseId, payload, user) => (
  mockCreateHouseNotice(houseId, payload, user)
);
// 실제 API 연결 시 PUT /houses/:houseId/notices/:noticeId 로 교체한다.
export const updateHouseNotice = (houseId, noticeId, payload, user) => (
  mockUpdateHouseNotice(houseId, noticeId, payload, user)
);
// 실제 API 연결 시 DELETE /houses/:houseId/notices/:noticeId 로 교체한다.
export const deleteHouseNotice = (houseId, noticeId, user) => (
  mockDeleteHouseNotice(houseId, noticeId, user)
);
// 실제 API 연결 시 GET /houses/:houseId/schedules 로 교체한다.
export const listHouseSchedules = (houseId, user) => mockListHouseSchedules(houseId, user);
// 실제 API 연결 시 POST /houses/:houseId/schedules 로 교체한다.
export const createHouseSchedule = (houseId, payload, user) => (
  mockCreateHouseSchedule(houseId, payload, user)
);
// 실제 API 연결 시 PUT /houses/:houseId/schedules/:scheduleId 로 교체한다.
export const updateHouseSchedule = (houseId, scheduleId, payload, user) => (
  mockUpdateHouseSchedule(houseId, scheduleId, payload, user)
);
// 실제 API 연결 시 DELETE /houses/:houseId/schedules/:scheduleId 로 교체한다.
export const deleteHouseSchedule = (houseId, scheduleId, user) => (
  mockDeleteHouseSchedule(houseId, scheduleId, user)
);
// 실제 API 연결 시 PUT /houses/:houseId/schedules/:scheduleId/attendance 로 교체한다.
export const updateScheduleAttendance = (houseId, scheduleId, status, user) => (
  mockUpdateScheduleAttendance(houseId, scheduleId, status, user)
);
// 실제 API 연결 시 GET /houses/:houseId/messages 로 교체한다.
export const listHouseMessages = (houseId, user) => mockListHouseMessages(houseId, user);
// 실제 API 연결 시 POST /houses/:houseId/messages 또는 STOMP SEND로 교체한다.
export const sendHouseMessage = (houseId, content, user) => (
  mockSendHouseMessage(houseId, content, user)
);
// 실제 연결 시 STOMP SUBSCRIBE /topic/houses/:houseId 로 교체한다.
export const subscribeHouseMessages = (houseId, user, callback) => (
  mockSubscribeHouseMessages(houseId, user, callback)
);
export const inviteFriends = (houseId, friends, user) => mockInviteFriends(houseId, friends, user);
export const listMyInvitations = (user) => mockListMyInvitations(user);
export const acceptInvitation = (invitationId, user) => mockAcceptInvitation(invitationId, user);
export const rejectInvitation = (invitationId, user) => mockRejectInvitation(invitationId, user);
export const getHouseSuggestionState = (suggestionId, user) => (
  mockGetHouseSuggestionState(suggestionId, user)
);
export const dismissHouseSuggestion = (suggestionId, user) => (
  mockDismissHouseSuggestion(suggestionId, user)
);
export const resetHouseSuggestion = (suggestionId, user) => (
  mockResetHouseSuggestion(suggestionId, user)
);
