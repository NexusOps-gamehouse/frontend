import {
  mockAcceptInvitation,
  mockApproveJoinRequest,
  mockCancelJoinRequest,
  mockCreateHouse,
  mockCreateHouseNotice,
  mockCreateHouseSchedule,
  mockDeleteHouseNotice,
  mockDeleteHouseSchedule,
  mockGetHouse,
  mockGetHouseSuggestionState,
  mockInviteFriends,
  mockListJoinRequests,
  mockListHouses,
  mockListHouseNotices,
  mockListHouseSchedules,
  mockListMyInvitations,
  mockRejectInvitation,
  mockRejectJoinRequest,
  mockRemoveHouseMember,
  mockResetHouseSuggestion,
  mockRequestHouseJoin,
  mockDismissHouseSuggestion,
  mockUpdateMemberRole,
  mockUpdateHouseNotice,
  mockUpdateHouseSchedule,
  mockUpdateScheduleAttendance,
} from '../mocks/houseStorage';

/**
 * House 화면이 의존하는 API 계약입니다.
 * 백엔드 준비 후 이 파일의 구현만 Axios 호출로 교체하면 pages와 Mock 저장소는
 * 수정하지 않아도 됩니다.
 */
export const listHouses = (user) => mockListHouses(user);
export const getHouse = (houseId, user) => mockGetHouse(houseId, user);
export const createHouse = (payload, user) => mockCreateHouse(payload, user);
export const requestHouseJoin = (houseId, user) => mockRequestHouseJoin(houseId, user);
export const cancelJoinRequest = (houseId, user) => mockCancelJoinRequest(houseId, user);
export const listJoinRequests = (houseId, user) => mockListJoinRequests(houseId, user);
export const approveJoinRequest = (houseId, requestId, user) => (
  mockApproveJoinRequest(houseId, requestId, user)
);
export const rejectJoinRequest = (houseId, requestId, user) => (
  mockRejectJoinRequest(houseId, requestId, user)
);
export const updateMemberRole = (houseId, memberId, role, user) => (
  mockUpdateMemberRole(houseId, memberId, role, user)
);
// 실제 API 연결 시 DELETE /houses/:houseId/members/:memberId 로 교체한다.
export const removeHouseMember = (houseId, memberId, user) => (
  mockRemoveHouseMember(houseId, memberId, user)
);
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
