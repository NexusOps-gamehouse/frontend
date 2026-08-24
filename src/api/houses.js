import {
  mockAcceptInvitation,
  mockApproveJoinRequest,
  mockCancelJoinRequest,
  mockCreateHouse,
  mockGetHouse,
  mockGetHouseSuggestionState,
  mockInviteFriends,
  mockListJoinRequests,
  mockListHouses,
  mockListMyInvitations,
  mockRejectInvitation,
  mockRejectJoinRequest,
  mockResetHouseSuggestion,
  mockRequestHouseJoin,
  mockDismissHouseSuggestion,
  mockUpdateMemberRole,
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
