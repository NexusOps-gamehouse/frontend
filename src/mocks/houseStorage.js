const STORAGE_KEY = 'gamehouse.houses.v1';
const SUGGESTION_STORAGE_KEY = 'gamehouse.houseSuggestions.v1';

const INITIAL_HOUSES = [
  {
    id: 'house-summoners-rest',
    name: '소환사의 쉼터',
    description: '티어와 실력보다 매너를 먼저 보는 편안한 친목 House입니다. 같이 게임하고 이야기 나눠요!',
    game: '리그오브레전드',
    maxMembers: 20,
    type: 'SOCIAL',
    visibility: 'PUBLIC',
    owner: { id: 'mock-owner-1', nickname: '포로대장' },
    members: [
      { id: 'mock-owner-1', nickname: '포로대장', role: 'OWNER' },
      { id: 'mock-member-1', nickname: '라일락', role: 'MEMBER' },
      { id: 'mock-member-2', nickname: '티모버섯', role: 'MEMBER' },
    ],
    joinRequests: [],
    invitations: [],
    createdAt: '2026-08-18T10:00:00.000Z',
  },
  {
    id: 'house-ranked-lab',
    name: '랭크 연구소',
    description: '목표 티어를 정하고 함께 피드백하며 성장하는 경쟁형 House입니다.',
    game: '리그오브레전드',
    maxMembers: 10,
    type: 'COMPETITIVE',
    visibility: 'PUBLIC',
    owner: { id: 'mock-owner-2', nickname: '넥서스지킴이' },
    members: [
      { id: 'mock-owner-2', nickname: '넥서스지킴이', role: 'OWNER' },
      { id: 'mock-member-3', nickname: '한타장인', role: 'MEMBER' },
    ],
    joinRequests: [],
    invitations: [],
    createdAt: '2026-08-20T12:30:00.000Z',
  },
  {
    id: 'house-night-queue',
    name: '심야 자유랭크',
    description: '초대받은 멤버끼리 늦은 밤 자유랭크를 즐기는 비공개 House입니다.',
    game: '리그오브레전드',
    maxMembers: 5,
    type: 'SOCIAL',
    visibility: 'PRIVATE',
    owner: { id: 'mock-owner-3', nickname: '새벽감성' },
    members: [{ id: 'mock-owner-3', nickname: '새벽감성', role: 'OWNER' }],
    joinRequests: [],
    invitations: [],
    createdAt: '2026-08-22T15:00:00.000Z',
  },
];

const clone = (value) => JSON.parse(JSON.stringify(value));
const MEMBER_ROLES = new Set(['OWNER', 'MANAGER', 'MEMBER']);

// 기존 v1 데이터에 요청 id, 초대 목록, 역할이 없어도 읽을 때 안전하게 보정한다.
const normalizeHouse = (house) => {
  const ownerId = String(house.owner?.id ?? '');
  return {
    ...house,
    owner: { ...house.owner, id: ownerId },
    game: house.game || '기타',
    maxMembers: Number(house.maxMembers) || 20,
    members: (Array.isArray(house.members) ? house.members : []).map((member) => ({
      ...member,
      id: String(member.id),
      role: String(member.id) === ownerId
        ? 'OWNER'
        : MEMBER_ROLES.has(member.role) && member.role !== 'OWNER' ? member.role : 'MEMBER',
    })),
    joinRequests: (Array.isArray(house.joinRequests) ? house.joinRequests : []).map((request) => ({
      ...request,
      id: request.id || `join-${house.id}-${request.userId}`,
      userId: String(request.userId),
    })),
    invitations: (Array.isArray(house.invitations) ? house.invitations : []).map((invitation) => ({
      ...invitation,
      id: invitation.id || `invite-${house.id}-${invitation.userId}`,
      userId: String(invitation.userId),
    })),
  };
};

function readHouses() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(saved)) return saved.map(normalizeHouse);
  } catch { /* 손상된 Mock 데이터는 초기값으로 복구 */ }

  const initial = clone(INITIAL_HOUSES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function writeHouses(houses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(houses));
}

function readSuggestionStates() {
  try {
    const saved = JSON.parse(localStorage.getItem(SUGGESTION_STORAGE_KEY) || '{}');
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch {
    return {};
  }
}

function writeSuggestionStates(states) {
  localStorage.setItem(SUGGESTION_STORAGE_KEY, JSON.stringify(states));
}

function userKey(user) {
  return String(user?.id ?? user?.userId ?? user?.email ?? user?.nickname ?? '');
}

function currentState(house, user) {
  const id = userKey(user);
  if (!id) return 'NONE';
  if (String(house.owner.id) === id) return 'OWNER';
  const member = house.members.find((item) => String(item.id) === id);
  if (member) return member.role;
  if (house.joinRequests.some((request) => String(request.userId) === id)) return 'PENDING';
  return 'NONE';
}

function withViewerState(house, user) {
  const status = currentState(house, user);
  const result = { ...clone(house), myStatus: status };
  if (status !== 'OWNER') {
    delete result.joinRequests;
    delete result.invitations;
  }
  return result;
}

function requireUser(user, message = '로그인이 필요합니다.') {
  const id = userKey(user);
  if (!id) throw new Error(message);
  return id;
}

function requireHouse(houses, houseId) {
  const index = houses.findIndex((item) => item.id === houseId);
  if (index < 0) throw new Error('House를 찾을 수 없습니다.');
  return { house: houses[index], index };
}

function requireOwner(house, user) {
  if (currentState(house, user) !== 'OWNER') {
    throw new Error('방장만 이 작업을 수행할 수 있습니다.');
  }
}

function ensureCapacity(house) {
  if (house.members.length >= house.maxMembers) throw new Error('House 정원이 가득 찼습니다.');
}

export async function mockListHouses(user) {
  return readHouses()
    .filter((house) => {
      const status = currentState(house, user);
      return house.visibility === 'PUBLIC' || ['OWNER', 'MANAGER', 'MEMBER'].includes(status);
    })
    .map((house) => withViewerState(house, user));
}

export async function mockGetHouse(houseId, user) {
  const house = readHouses().find((item) => item.id === houseId);
  if (!house) throw new Error('House를 찾을 수 없습니다.');
  const status = currentState(house, user);
  if (house.visibility === 'PRIVATE' && !['OWNER', 'MANAGER', 'MEMBER'].includes(status)) {
    const error = new Error('비공개 House는 멤버만 상세 정보를 볼 수 있습니다.');
    error.code = 'PRIVATE_HOUSE';
    throw error;
  }
  return withViewerState(house, user);
}

export async function mockCreateHouse(payload, user) {
  const id = requireUser(user, 'House를 만들려면 로그인이 필요합니다.');
  const houses = readHouses();
  const owner = { id, nickname: user.nickname || user.name || '방장' };
  const house = {
    id: `house-${Date.now()}`,
    name: payload.name.trim(),
    description: payload.description.trim(),
    game: payload.game,
    maxMembers: Number(payload.maxMembers),
    type: payload.type,
    visibility: payload.visibility,
    owner,
    members: [{ ...owner, role: 'OWNER' }],
    joinRequests: [],
    invitations: [],
    createdAt: new Date().toISOString(),
  };
  writeHouses([house, ...houses]);
  return withViewerState(house, user);
}

export async function mockRequestHouseJoin(houseId, user) {
  const id = requireUser(user, '가입을 신청하려면 로그인이 필요합니다.');
  const houses = readHouses();
  const { house } = requireHouse(houses, houseId);
  if (house.visibility !== 'PUBLIC') throw new Error('비공개 House는 초대로만 가입할 수 있습니다.');
  if (currentState(house, user) !== 'NONE') throw new Error('이미 가입했거나 처리 중인 신청이 있습니다.');
  ensureCapacity(house);
  house.joinRequests.push({
    id: `join-${Date.now()}-${id}`,
    userId: id,
    nickname: user.nickname || user.name || '신청자',
    requestedAt: new Date().toISOString(),
  });
  writeHouses(houses);
  return withViewerState(house, user);
}

export async function mockCancelJoinRequest(houseId, user) {
  const id = requireUser(user);
  const houses = readHouses();
  const { house } = requireHouse(houses, houseId);
  const before = house.joinRequests.length;
  house.joinRequests = house.joinRequests.filter((request) => request.userId !== id);
  if (before === house.joinRequests.length) throw new Error('취소할 가입 신청이 없습니다.');
  writeHouses(houses);
  return withViewerState(house, user);
}

export async function mockListJoinRequests(houseId, user) {
  const houses = readHouses();
  const { house } = requireHouse(houses, houseId);
  requireOwner(house, user);
  return clone(house.joinRequests);
}

export async function mockApproveJoinRequest(houseId, requestId, user) {
  const houses = readHouses();
  const { house } = requireHouse(houses, houseId);
  requireOwner(house, user);
  const request = house.joinRequests.find((item) => item.id === requestId);
  if (!request) throw new Error('가입 신청을 찾을 수 없습니다.');
  if (house.members.some((member) => member.id === request.userId)) {
    throw new Error('이미 House에 가입한 사용자입니다.');
  }
  ensureCapacity(house);
  house.members.push({ id: request.userId, nickname: request.nickname, role: 'MEMBER' });
  house.joinRequests = house.joinRequests.filter((item) => item.id !== requestId);
  house.invitations = house.invitations.filter((item) => item.userId !== request.userId);
  writeHouses(houses);
  return withViewerState(house, user);
}

export async function mockRejectJoinRequest(houseId, requestId, user) {
  const houses = readHouses();
  const { house } = requireHouse(houses, houseId);
  requireOwner(house, user);
  const before = house.joinRequests.length;
  house.joinRequests = house.joinRequests.filter((request) => request.id !== requestId);
  if (before === house.joinRequests.length) throw new Error('가입 신청을 찾을 수 없습니다.');
  writeHouses(houses);
  return withViewerState(house, user);
}

export async function mockUpdateMemberRole(houseId, memberId, role, user) {
  if (!['MANAGER', 'MEMBER'].includes(role)) throw new Error('변경할 수 없는 역할입니다.');
  const houses = readHouses();
  const { house } = requireHouse(houses, houseId);
  requireOwner(house, user);
  if (String(house.owner.id) === String(memberId)) throw new Error('방장 역할은 변경할 수 없습니다.');
  const member = house.members.find((item) => item.id === String(memberId));
  if (!member) throw new Error('House 멤버를 찾을 수 없습니다.');
  member.role = role;
  writeHouses(houses);
  return withViewerState(house, user);
}

export async function mockInviteFriends(houseId, friends, user) {
  requireUser(user);
  const houses = readHouses();
  const { house } = requireHouse(houses, houseId);
  requireOwner(house, user);
  if (house.visibility !== 'PRIVATE') throw new Error('친구 초대는 비공개 House에서만 가능합니다.');
  if (!Array.isArray(friends) || friends.length === 0) throw new Error('초대할 친구를 선택해주세요.');

  const memberIds = new Set(house.members.map((member) => member.id));
  const invitedIds = new Set(house.invitations.map((invitation) => invitation.userId));
  const unique = new Map(friends.map((friend) => [String(friend.id), friend]));
  const eligible = [...unique.values()].filter((friend) => {
    const id = String(friend.id);
    return id && !memberIds.has(id) && !invitedIds.has(id);
  });
  if (eligible.length === 0) throw new Error('선택한 친구는 이미 멤버이거나 초대 중입니다.');

  const inviter = { id: userKey(user), nickname: user.nickname || user.name || '방장' };
  const createdAt = new Date().toISOString();
  eligible.forEach((friend, offset) => {
    house.invitations.push({
      id: `invite-${Date.now()}-${offset}-${friend.id}`,
      userId: String(friend.id),
      nickname: friend.nickname || friend.name || '친구',
      invitedBy: inviter,
      createdAt,
    });
  });
  writeHouses(houses);
  return { house: withViewerState(house, user), invitedCount: eligible.length };
}

export async function mockListMyInvitations(user) {
  const id = requireUser(user);
  return readHouses().flatMap((house) => house.invitations
    .filter((invitation) => invitation.userId === id)
    .map((invitation) => ({
      ...clone(invitation),
      house: {
        id: house.id,
        name: house.name,
        game: house.game,
        type: house.type,
        visibility: house.visibility,
        currentMembers: house.members.length,
        maxMembers: house.maxMembers,
      },
    })));
}

export async function mockAcceptInvitation(invitationId, user) {
  const id = requireUser(user);
  const houses = readHouses();
  const house = houses.find((item) => item.invitations.some((invite) => invite.id === invitationId));
  if (!house) throw new Error('House 초대를 찾을 수 없습니다.');
  const invitation = house.invitations.find((item) => item.id === invitationId);
  if (invitation.userId !== id) throw new Error('이 초대를 처리할 권한이 없습니다.');
  if (house.members.some((member) => member.id === id)) throw new Error('이미 House 멤버입니다.');
  ensureCapacity(house);
  house.members.push({ id, nickname: invitation.nickname, role: 'MEMBER' });
  house.invitations = house.invitations.filter((item) => item.id !== invitationId);
  house.joinRequests = house.joinRequests.filter((item) => item.userId !== id);
  writeHouses(houses);
  return withViewerState(house, user);
}

export async function mockRejectInvitation(invitationId, user) {
  const id = requireUser(user);
  const houses = readHouses();
  const house = houses.find((item) => item.invitations.some((invite) => invite.id === invitationId));
  if (!house) throw new Error('House 초대를 찾을 수 없습니다.');
  const invitation = house.invitations.find((item) => item.id === invitationId);
  if (invitation.userId !== id) throw new Error('이 초대를 처리할 권한이 없습니다.');
  house.invitations = house.invitations.filter((item) => item.id !== invitationId);
  writeHouses(houses);
  return { invitationId };
}

function suggestionKey(suggestionId, user) {
  const viewerId = userKey(user) || 'anonymous';
  return `${viewerId}:${suggestionId}`;
}

export async function mockGetHouseSuggestionState(suggestionId, user) {
  const states = readSuggestionStates();
  return states[suggestionKey(suggestionId, user)] || { suggestionId, dismissed: false };
}

export async function mockDismissHouseSuggestion(suggestionId, user) {
  const states = readSuggestionStates();
  const state = { suggestionId, dismissed: true, dismissedAt: new Date().toISOString() };
  states[suggestionKey(suggestionId, user)] = state;
  writeSuggestionStates(states);
  return state;
}

export async function mockResetHouseSuggestion(suggestionId, user) {
  const states = readSuggestionStates();
  delete states[suggestionKey(suggestionId, user)];
  writeSuggestionStates(states);
  return { suggestionId, dismissed: false };
}
