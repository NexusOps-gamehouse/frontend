import {
  mockAddHouseXp,
  mockCreateHouseNotice,
  mockCreateHouseSchedule,
  mockDeleteHouseNotice,
  mockDeleteHouseSchedule,
  mockGetHouseWeeklyQuests,
  mockClaimHouseWeeklyXpReward,
  mockGetHouseSuggestionState,
  mockListHouseNotices,
  mockListHouseSchedules,
  mockRecordHouseQuestProgress,
  mockResetHouseSuggestion,
  mockDismissHouseSuggestion,
  mockSetHouseNoticePinned,
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
import {
  Client,
} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api, { errMsg } from './client';
import {
  HOUSE_WEEKLY_XP_REWARD,
} from '../utils/houseWeeklyQuests';
import { calculateHouseGrowth } from '../utils/houseGrowth';

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

// 권한 role과 화면에 보이는 House rank는 별도 계약으로 유지한다.
// Crew rank가 응답되면 NEW_MEMBER만 표시 rank로 사용하고,
// 누락되거나 MEMBER인 경우에는 일반 회원으로 보정한다.
export const getHouseDisplayRank = (member = {}) => {
  const permissionRole = normalizeRole(member.role) || member.role;

  if (permissionRole === 'OWNER') return 'OWNER';
  if (permissionRole === 'MANAGER') return 'MANAGER';
  if (member.rank === 'NEW_MEMBER') return 'NEW_MEMBER';
  return 'MEMBER';
};

const normalizeMember = (member) => ({
  ...member,
  id: member.memberId,
  role: normalizeRole(member.role) || 'MEMBER',
});

const normalizeNotice = (notice) => ({
  ...notice,
  pinned: Boolean(notice.pinned ?? notice.isPinned ?? notice.pinnedAt),
  author: notice.author || { id: notice.authorId },
});

const normalizeSchedule = (schedule) => ({
  ...schedule,
  // 기존 일정 UI는 startAt을 사용하고, Crew API는 timezone 없는 scheduledAt을 사용한다.
  startAt: schedule.scheduledAt,
  participantUserIds: Array.isArray(schedule.participantUserIds)
    ? schedule.participantUserIds
    : [],
  participantCount: Number(schedule.participantCount) || 0,
  maxParticipants: Number(schedule.maxParticipants) || 5,
  joined: Boolean(schedule.joined),
});

const normalizeHouseMessage = (message) => {
  const houseId = message?.houseId;
  const senderId = message?.senderId;
  const content = message?.message ?? message?.content ?? '';
  const createdAt = message?.timestamp ?? message?.createdAt;
  const senderName = String(message?.senderName ?? '').trim();
  const id = message?.id
    ?? `crew-house-message-${houseId}-${senderId}-${createdAt}-${content}`;

  return {
    ...message,
    id,
    houseId,
    senderId,
    senderName,
    message: content,
    timestamp: createdAt,
    content,
    author: {
      id: senderId,
      nickname: senderName || `사용자 #${senderId}`,
      // Crew chat payload에는 role이 없으므로 House 상세 멤버 정보로 보완한다.
      role: null,
    },
    createdAt,
  };
};

const houseStompClients = new Map();

export const normalizeHouse = (house) => {
  const members = Array.isArray(house.members)
    ? house.members.map(normalizeMember)
    : [];

  const backendType = house.type;
  const isCrewHouse = ['PUBLIC', 'PRIVATE'].includes(backendType);

  // Crew API:
  //   type            = PUBLIC | PRIVATE
  //   activityType    = SOCIAL | COMPETITIVE
  //   representativeGame
  //
  // 기존 Frontend House 모델:
  //   visibility      = PUBLIC | PRIVATE
  //   type            = SOCIAL | COMPETITIVE
  //   game
  //
  // API 경계에서 기존 Frontend 모델로 정규화한다.
  const visibility = isCrewHouse
    ? backendType
    : house.visibility ?? (
      ['PUBLIC', 'PRIVATE'].includes(backendType) ? backendType : null
    );

  const activityType = isCrewHouse
    ? house.activityType
    : house.activityType ?? (
      ['SOCIAL', 'COMPETITIVE'].includes(backendType)
        ? backendType
        : null
    );

  const growth = house.xp === undefined
    ? {}
    : calculateHouseGrowth(house.xp);

  return {
    ...house,
    ...growth,
    isCrewHouse,
    visibility,
    type: activityType ?? backendType,
    activityType: activityType ?? null,
    game: house.game ?? house.representativeGame ?? '',
    memberCount: Number.isFinite(Number(house.memberCount))
      ? Number(house.memberCount)
      : members.length,
    members,
    owner: { id: house.leaderId ?? house.owner?.id },
    myRole: normalizeRole(house.myRole) ?? house.myRole ?? null,
    myStatus: house.myStatus ?? null,
  };
};

const normalizeHouseInvitation = (invitation = {}) => {
  const house = invitation.house || {};
  const invitedByUserId = invitation.invitedByUserId ?? invitation.invitedBy?.id ?? null;
  const currentMembers = Number(
    house.currentMembers ?? house.memberCount ?? 0,
  );

  return {
    ...invitation,
    invitedBy: invitation.invitedBy || (
      invitedByUserId == null
        ? null
        : {
            id: invitedByUserId,
            nickname: `사용자 #${invitedByUserId}`,
          }
    ),
    house: {
      ...house,
      visibility: house.visibility ?? house.type,
      game: house.game ?? house.representativeGame ?? '',
      currentMembers: Number.isFinite(currentMembers) ? currentMembers : 0,
      memberCount: Number.isFinite(currentMembers) ? currentMembers : 0,
    },
  };
};

const QUEST_ERROR_MESSAGES = {
  400: '요청 내용을 확인해주세요.',
  401: '로그인이 필요합니다.',
  403: '이 House에 접근할 권한이 없습니다.',
  404: 'House 또는 퀘스트를 찾을 수 없습니다.',
  409: '완료되지 않았거나 이미 보상을 받은 퀘스트입니다.',
  500: '서버 오류가 발생했습니다.',
  503: '서버에 연결할 수 없습니다.',
  network: '서버에 연결할 수 없습니다.',
};

const requestCrew = async (request, fallbackMessages = {}) => {
  try {
    const { data } = await request();
    return data;
  } catch (error) {
    const status = error.response?.status;
    const responseData = error.response?.data;
    const serverMessage = typeof responseData === 'string'
      ? responseData
      : responseData?.message;
    const fallbackMessage = fallbackMessages[status]
      || (!status ? fallbackMessages.network : null)
      || (status === 409
        ? '이미 가입했거나 신청 중이거나, House 정원이 가득 찼습니다.'
        : status === 403
          ? '이 작업을 수행할 권한이 없습니다.'
          : status === 400
            ? '입력값을 확인해주세요.'
            : status === 401
              ? '로그인이 필요합니다.'
              : status === 404
                ? 'House 또는 대상을 찾을 수 없습니다.'
                : status === 503
                  ? '서버에 연결할 수 없습니다.'
                  : errMsg(error));
    const normalizedError = new Error(serverMessage || fallbackMessage);
    normalizedError.code = error.code;
    normalizedError.status = status;
    normalizedError.response = error.response;
    throw normalizedError;
  }
};

export const listHouses = () => requestCrew(() => api.get('/crew/houses'))
  .then((data) => (Array.isArray(data) ? data : []).map(normalizeHouse));

export const listMyHouses = () => listHouses()
  .then((houses) => houses.filter((house) => house.myStatus === 'APPROVED'));

// Crew는 추천 결과의 userId만 반환한다. 사용자 프로필로 변환하거나 mock을 섞지 않는다.
export const listRecommendedPlaymates = () => requestCrew(
  () => api.get('/crew/recommendations/playmates'),
).then((data) => {
  if (!Array.isArray(data)) {
    throw new Error('플레이메이트 추천 응답 형식이 올바르지 않습니다.');
  }
  return data;
});

export const getHouse = (houseId) => requestCrew(
  () => api.get(`/crew/houses/${encodeURIComponent(houseId)}`),
).then(normalizeHouse);

const toCrewHouseWriteRequest = (payload = {}) => {
  const description = payload.description == null
    ? null
    : String(payload.description).trim();

  const request = {
    name: String(payload.name ?? '').trim(),
    description: description || null,
  };

  // Frontend visibility -> Crew HouseType
  const visibility = ['PUBLIC', 'PRIVATE'].includes(payload.visibility)
    ? payload.visibility
    : ['PUBLIC', 'PRIVATE'].includes(payload.houseType)
      ? payload.houseType
      : undefined;

  // Frontend type -> Crew HouseActivityType
  const activityType = ['SOCIAL', 'COMPETITIVE'].includes(payload.activityType)
    ? payload.activityType
    : ['SOCIAL', 'COMPETITIVE'].includes(payload.type)
      ? payload.type
      : undefined;

  const representativeGame = String(
    payload.representativeGame ?? payload.game ?? '',
  ).trim();

  const maxMembers = Number(payload.maxMembers);

  if (visibility) request.type = visibility;
  if (activityType) request.activityType = activityType;
  if (representativeGame) request.representativeGame = representativeGame;

  if (Number.isInteger(maxMembers) && maxMembers > 0) {
    request.maxMembers = maxMembers;
  }

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

// Crew House는 실제 PUT API를 사용하고, legacy House는 기존 mock 동작을 유지한다.
export const updateHouse = (houseId, payload, user, useCrewApi = false) => {
  if (!useCrewApi) return mockUpdateHouse(houseId, payload, user);
  return requestCrew(
    () => api.put(
      `/crew/houses/${encodeURIComponent(houseId)}`,
      toCrewHouseWriteRequest(payload),
    ),
  ).then(normalizeHouse);
};
// TODO(house-xp): 실제 서비스에서는 클라이언트가 XP 값을 결정하지 않는다.
// Crew backend의 검증된 XP 지급 계약이 준비되기 전까지는 mock/dev 경로만 유지한다.
export const addHouseXp = (houseId, amount, user) => mockAddHouseXp(houseId, amount, user);
const CREW_WEEKLY_QUEST_COPY = {
  WIN_TOGETHER: {
    title: '함께 승리하기',
    description: (target) => `House 멤버들과 함께 ${target}번 승리하세요.`,
  },
  PLAY_TOGETHER: {
    title: '함께 플레이하기',
    description: (target) => `House 멤버 2명 이상이 함께 ${target}번 플레이하세요.`,
  },
  SCHEDULE_JOIN: {
    title: '일정 참여하기',
    description: (target) => `House 일정에 ${target}번 참여하세요.`,
  },
  DAILY_ACTIVE: {
    title: '꾸준히 함께하기',
    description: '서로 다른 3일 동안 House 멤버와 함께 플레이하세요.',
  },
};

const safeQuestCount = (value, fallback = 0) => {
  const count = Number(value);
  return Number.isSafeInteger(count) && count >= 0 ? count : fallback;
};

const normalizeCrewWeeklyQuest = (quest, fallbackHouseId, index = 0) => {
  if (!quest || typeof quest !== 'object' || Array.isArray(quest)) {
    throw new Error('주간 퀘스트 응답 형식이 올바르지 않습니다.');
  }

  const questType = quest.questType ?? quest.type ?? `quest-${index}`;
  const fallbackCopy = CREW_WEEKLY_QUEST_COPY[questType] || {};
  const id = quest.questId ?? quest.id ?? quest.questType ?? quest.type ?? `quest-${index}`;
  const current = safeQuestCount(quest.currentCount ?? quest.currentProgress ?? quest.current);
  const target = safeQuestCount(quest.targetCount ?? quest.targetProgress ?? quest.target);
  const completed = typeof quest.isCompleted === 'boolean'
    ? quest.isCompleted
    : typeof quest.completed === 'boolean'
      ? quest.completed
      : target > 0 && current >= target;
  const rewardClaimed = typeof quest.isRewardClaimed === 'boolean'
    ? quest.isRewardClaimed
    : quest.rewardClaimed === true;

  return {
    ...quest,
    id,
    houseId: quest.houseId ?? fallbackHouseId,
    type: questType,
    title: quest.title || fallbackCopy.title || '주간 퀘스트',
    description: quest.description ?? (typeof fallbackCopy.description === 'function'
      ? fallbackCopy.description(target) : fallbackCopy.description ?? ''),
    current,
    target,
    completed,
    rewardClaimed,
    rewardHc: safeQuestCount(quest.rewardHc),
    rewardXp: safeQuestCount(quest.rewardXp),
  };
};

const normalizeWeeklyQuestResponse = (value = {}, fallbackHouseId) => {
  const isCrewResponse = Array.isArray(value);

  if (isCrewResponse) {
    const quests = value.map((quest, index) => normalizeCrewWeeklyQuest(quest, fallbackHouseId, index));
    const totalCount = quests.length;
    const completedCount = quests.filter((quest) => quest.completed).length;
    const weekStartDate = quests.find((quest) => quest.weekStartDate)?.weekStartDate || null;
    const weekId = typeof weekStartDate === 'string' ? weekStartDate.slice(0, 10) : '';

    return {
      weekId,
      isMock: false,
      startAt: weekStartDate,
      endAt: null,
      startDate: weekId,
      endDate: '',
      quests,
      completedCount,
      totalCount,
      allCompleted: totalCount > 0 && completedCount === totalCount,
      reward: {
        type: 'HC',
        amount: null,
        rewarded: false,
      },
      xpReward: {
        type: 'XP',
        amount: null,
        rewarded: false,
      },
    };
  }

  // 기존 mock/legacy House 경로는 기존 호환성을 유지한다.
  const sourceQuests = Array.isArray(value.quests) ? value.quests : [];

  const quests = sourceQuests.map((quest, index) => {
    const current = Number(quest.current ?? quest.progress);
    const target = Number(quest.target);
    const safeCurrent = Number.isSafeInteger(current) && current >= 0 ? current : 0;
    const safeTarget = Number.isSafeInteger(target) && target > 0 ? target : 0;

    return {
      id: quest.id ?? quest.type ?? `quest-${index}`,
      type: quest.type ?? quest.id ?? `quest-${index}`,
      title: quest.title ?? quest.name ?? '주간 퀘스트',
      description: quest.description ?? '',
      current: safeCurrent,
      target: safeTarget,
      completed: quest.completed === true || (safeTarget > 0 && safeCurrent >= safeTarget),
      rewardClaimed: quest.rewardClaimed === true || quest.rewarded === true,
      rewardHc: 0,
      rewardXp: 0,
    };
  });

  const totalCount = quests.length;
  const completedCount = quests.filter((quest) => quest.completed).length;

  const reward = value.reward ?? value.houseCoinReward ?? {};
  const amount = Number(reward.amount);

  const xpReward = value.xpReward ?? value.rewards?.xp ?? {};
  const xpAmount = Number(xpReward.amount);

  return {
    weekId: value.weekId ?? '',
    isMock: value.isMock === true,
    startAt: value.startAt ?? value.weekStart ?? null,
    endAt: value.endAt ?? value.weekEnd ?? null,
    startDate: value.startDate ?? value.weekStart ?? '',
    endDate: value.endDate ?? value.weekEnd ?? '',
    quests,
    completedCount,
    totalCount,
    allCompleted: totalCount > 0 && completedCount === totalCount,
    reward: {
      type: 'HC',
      amount: Number.isSafeInteger(amount) && amount >= 0 ? amount : 50,
      rewarded: reward.rewarded === true,
    },
    xpReward: {
      type: 'XP',
      amount: Number.isSafeInteger(xpAmount) && xpAmount >= 0
        ? xpAmount
        : HOUSE_WEEKLY_XP_REWARD,
      rewarded: xpReward.rewarded === true,
    },
  };
};

export const getHouseWeeklyQuests = (houseId, user, useCrewApi = false) => {
  if (useCrewApi) {
    return listHouseQuests(houseId);
  }
  return mockGetHouseWeeklyQuests(houseId, user, Date.now(), { grantReward: false })
    .then(normalizeWeeklyQuestResponse);
};

export const listHouseQuests = (houseId) => requestCrew(
  () => api.get(`/houses/${encodeURIComponent(houseId)}/quests`),
  QUEST_ERROR_MESSAGES,
).then((data) => normalizeWeeklyQuestResponse(data, houseId));

// Crew develop에는 진행도 PATCH Controller가 없으므로 일반 화면에서 호출하지 않는다.
// TODO(house-quest): 실제 활동 이벤트가 연결되면 backend Controller 계약에 맞춰 추가한다.
export const updateHouseQuestProgress = () => Promise.reject(
  new Error('현재 Crew에서는 퀘스트 진행도 변경 API를 지원하지 않습니다.'),
);

// 기존 개발용 mock 진행도 함수는 보존하되, House 주간 퀘스트 UI에서는 호출하지 않는다.
export const recordHouseQuestProgress = (houseId, questType, payload, user) => (
  mockRecordHouseQuestProgress(houseId, questType, payload, user)
);

// Crew XP 보상 endpoint는 아직 존재하지 않으므로 production에서는 호출하지 않는다.
// legacy/mock 개발 화면에서만 서버 보상 흐름을 대체하는 adapter를 사용한다.
export const claimHouseWeeklyXpReward = (houseId, weekId, user, useCrewApi = false) => {
  if (useCrewApi) {
    return Promise.reject(new Error('Crew 주간 XP 보상 API가 아직 준비되지 않았습니다.'));
  }
  return mockClaimHouseWeeklyXpReward(houseId, weekId, user)
    .then((result) => ({
      ...result,
      weeklyQuests: normalizeWeeklyQuestResponse(result.weeklyQuests),
    }));
};

export const claimHouseQuestReward = (houseId, questId) => requestCrew(
  () => api.post(
    `/houses/${encodeURIComponent(houseId)}/quests/${encodeURIComponent(questId)}/claim`,
  ),
  QUEST_ERROR_MESSAGES,
).then((data) => (data && typeof data === 'object'
  ? normalizeCrewWeeklyQuest(data, houseId)
  : data));

// 기존 HouseWeeklyQuestsPanel 및 legacy 호출부와의 호환 alias.
export const claimHouseWeeklyQuestReward = claimHouseQuestReward;

const normalizeHouseCurrency = (currency = {}) => {
  const source = currency && typeof currency === 'object' ? currency : {};
  const hc = source.hc ?? source.currentHc;
  const xp = source.xp ?? source.currentXp;
  return {
    ...source,
    hc: safeQuestCount(hc),
    xp: safeQuestCount(xp),
  };
};

export const getHouseCurrency = (houseId) => requestCrew(
  () => api.get(`/crew/houses/${encodeURIComponent(houseId)}/currency`),
  QUEST_ERROR_MESSAGES,
).then(normalizeHouseCurrency);

// Crew develop에는 batch currency Controller가 없으므로 존재하지 않는 endpoint를 호출하지 않는다.
export const getHouseCurrencies = () => Promise.reject(
  new Error('현재 Crew에서는 House currency 일괄 조회 API를 지원하지 않습니다.'),
);
// 기존 페이지/호출부와의 호환을 위한 이름이다. 실제 요청은 Crew endpoint를 사용한다.
export const requestHouseJoin = (houseId) => joinHouse(houseId);
export const cancelJoinRequest = (houseId) => leaveHouse(houseId);
export const listHouseNotices = (houseId, user, useCrewApi = false) => {
  if (!useCrewApi) {
    return mockListHouseNotices(houseId, user)
      .then((data) => (Array.isArray(data) ? data : []).map(normalizeNotice));
  }
  return requestCrew(
    () => api.get(`/crew/houses/${encodeURIComponent(houseId)}/notices`),
  ).then((data) => (Array.isArray(data) ? data : []).map(normalizeNotice));
};

export const createHouseNotice = (houseId, payload, user, useCrewApi = false) => {
  if (!useCrewApi) return mockCreateHouseNotice(houseId, payload, user);
  return requestCrew(
    () => api.post(`/crew/houses/${encodeURIComponent(houseId)}/notices`, {
      title: String(payload?.title ?? '').trim(),
      content: payload?.content == null ? null : String(payload.content).trim(),
      pinned: Boolean(payload?.pinned),
    }),
  ).then(normalizeNotice);
};

export const setHouseNoticePinned = (houseId, noticeId, pinned, user, useCrewApi = false) => {
  if (!useCrewApi) return mockSetHouseNoticePinned(houseId, noticeId, pinned, user);
  return requestCrew(
    () => api.put(
      `/crew/houses/${encodeURIComponent(houseId)}/notices/${encodeURIComponent(noticeId)}/pin`,
      { pinned: Boolean(pinned) },
    ),
  ).then((data) => (data ? normalizeNotice(data) : null));
};

export const updateHouseNotice = (houseId, noticeId, payload, user, useCrewApi = false) => {
  if (!useCrewApi) return mockUpdateHouseNotice(houseId, noticeId, payload, user);
  return requestCrew(
    () => api.put(
      `/crew/houses/${encodeURIComponent(houseId)}/notices/${encodeURIComponent(noticeId)}`,
      {
        title: String(payload?.title ?? '').trim(),
        content: payload?.content == null ? null : String(payload.content).trim(),
      },
    ),
  ).then(normalizeNotice);
};
export const deleteHouseNotice = (houseId, noticeId, user, useCrewApi = false) => {
  if (!useCrewApi) return mockDeleteHouseNotice(houseId, noticeId, user);
  return requestCrew(
    () => api.delete(
      `/crew/houses/${encodeURIComponent(houseId)}/notices/${encodeURIComponent(noticeId)}`,
    ),
  );
};

const toCrewScheduleWriteRequest = (payload = {}) => {
  const rawScheduledAt = String(payload.scheduledAt ?? payload.startAt ?? '').trim();
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(rawScheduledAt)) {
    throw new Error('일정 시각에는 timezone을 포함할 수 없습니다.');
  }
  const scheduledAt = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(rawScheduledAt)
    ? `${rawScheduledAt}:00`
    : rawScheduledAt;
  const request = {
    title: String(payload.title ?? '').trim(),
    scheduledAt,
  };
  const maxParticipants = Number(payload.maxParticipants);
  if (Number.isInteger(maxParticipants) && maxParticipants > 0) {
    request.maxParticipants = maxParticipants;
  }
  return request;
};

export const listHouseSchedules = (houseId, user, useCrewApi = false) => {
  if (!useCrewApi) return mockListHouseSchedules(houseId, user);
  return requestCrew(
    () => api.get(`/crew/houses/${encodeURIComponent(houseId)}/schedules`),
  ).then((data) => (Array.isArray(data) ? data : []).map(normalizeSchedule));
};

export const createHouseSchedule = (houseId, payload, user, useCrewApi = false) => {
  if (!useCrewApi) return mockCreateHouseSchedule(houseId, payload, user);
  return requestCrew(
    () => api.post(
      `/crew/houses/${encodeURIComponent(houseId)}/schedules`,
      toCrewScheduleWriteRequest(payload),
    ),
  ).then(normalizeSchedule);
};

export const joinHouseSchedule = (houseId, scheduleId) => requestCrew(
  () => api.post(
    `/crew/houses/${encodeURIComponent(houseId)}/schedules/${encodeURIComponent(scheduleId)}/participants`,
  ),
).then(normalizeSchedule);

export const leaveHouseSchedule = (houseId, scheduleId) => requestCrew(
  () => api.delete(
    `/crew/houses/${encodeURIComponent(houseId)}/schedules/${encodeURIComponent(scheduleId)}/participants`,
  ),
).then(normalizeSchedule);

export const updateHouseSchedule = (houseId, scheduleId, payload, user, useCrewApi = false) => {
  if (!useCrewApi) return mockUpdateHouseSchedule(houseId, scheduleId, payload, user);
  return requestCrew(
    () => api.put(
      `/crew/houses/${encodeURIComponent(houseId)}/schedules/${encodeURIComponent(scheduleId)}`,
      toCrewScheduleWriteRequest(payload),
    ),
  ).then(normalizeSchedule);
};

export const deleteHouseSchedule = (houseId, scheduleId, user, useCrewApi = false) => {
  if (!useCrewApi) return mockDeleteHouseSchedule(houseId, scheduleId, user);
  return requestCrew(
    () => api.delete(
      `/crew/houses/${encodeURIComponent(houseId)}/schedules/${encodeURIComponent(scheduleId)}`,
    ),
  );
};
// Crew API는 JOINED/DECLINED attendance 저장 endpoint를 제공하지 않는다.
export const updateScheduleAttendance = (houseId, scheduleId, status, user) => (
  mockUpdateScheduleAttendance(houseId, scheduleId, status, user)
);
const crewHouseId = (houseId) => {
  const numericHouseId = Number(houseId);
  return Number.isSafeInteger(numericHouseId) ? numericHouseId : houseId;
};

const crewMessageError = (message) => {
  const error = new Error(message);
  error.status = undefined;
  return error;
};

// 기존 mock House 호출부를 보존하면서 Crew House만 실제 history API를 사용한다.
export const listHouseMessages = (houseId, user, useCrewApi = false) => {
  if (!useCrewApi) return mockListHouseMessages(houseId, user);
  return requestCrew(
    () => api.get(`/crew/houses/${encodeURIComponent(houseId)}/chat/messages`),
  ).then((data) => (Array.isArray(data) ? data : []).map(normalizeHouseMessage));
};

export const sendHouseMessage = (houseId, content, user, useCrewApi = false) => {
  if (!useCrewApi) return mockSendHouseMessage(houseId, content, user);

  const message = String(content ?? '').trim();
  if (!message) return Promise.reject(crewMessageError('메시지를 입력해주세요.'));
  if (message.length > 500) {
    return Promise.reject(crewMessageError('메시지는 500자 이하로 입력해주세요.'));
  }

  const client = houseStompClients.get(String(houseId));
  if (!client?.connected) {
    return Promise.reject(crewMessageError('House 채팅 연결을 기다려주세요.'));
  }

  // senderId/senderName은 보내지 않는다. Crew가 CONNECT Principal로 결정한다.
  client.publish({
    destination: '/pub/house/chat',
    body: JSON.stringify({
      houseId: crewHouseId(houseId),
      message,
    }),
  });
  return Promise.resolve();
};

export const subscribeHouseMessages = (
  houseId,
  user,
  callback,
  useCrewApi = false,
) => {
  if (!useCrewApi) return mockSubscribeHouseMessages(houseId, user, callback);

  const token = localStorage.getItem('token');
  const key = String(houseId);
  const previousClient = houseStompClients.get(key);
  if (previousClient) previousClient.deactivate();

  let connectedOnce = false;
  let cleanedUp = false;
  let subscription = null;
  const client = new Client({
    webSocketFactory: () => new SockJS('/ws-house'),
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 3000,
    onConnect: async () => {
      if (cleanedUp) return;

      const reconnecting = connectedOnce;
      connectedOnce = true;
      callback(null, null, { connected: true });

      if (!subscription) subscription = client.subscribe(`/topic/crew.houses.${encodeURIComponent(houseId)}`, (frame) => {
        try {
          callback(
            normalizeHouseMessage(JSON.parse(frame.body)),
            null,
            { realtime: true },
          );
        } catch {
          callback(null, crewMessageError('House 채팅 메시지를 읽지 못했습니다.'));
        }
      });

      // 재연결 사이에 놓친 메시지를 보완하되, 최초 history 조회와 중복 호출하지 않는다.
      if (reconnecting) {
        try {
          const history = await listHouseMessages(houseId, user, true);
          if (!cleanedUp) callback(history, null, { history: true, connected: true });
        } catch (error) {
          if (!cleanedUp) callback(null, error, { connected: true });
        }
      }
    },
    onDisconnect: () => {
      if (!cleanedUp) callback(null, null, { connected: false });
    },
    onStompError: (frame) => {
      if (cleanedUp) return;
      callback(
        null,
        crewMessageError(frame.headers?.message || 'House 채팅 서버 오류가 발생했습니다.'),
        { connected: false },
      );
    },
    onWebSocketError: () => {
      if (!cleanedUp) callback(null, crewMessageError('House 채팅 연결에 실패했습니다. 재연결 중입니다.'));
    },
    onWebSocketClose: () => {
      if (!cleanedUp) callback(null, null, { connected: false, reconnecting: true });
    },
  });

  houseStompClients.set(key, client);
  client.activate();

  return Promise.resolve(async () => {
    cleanedUp = true;
    if (houseStompClients.get(key) === client) houseStompClients.delete(key);
    subscription?.unsubscribe();
    subscription = null;
    await client.deactivate();
  });
};
export const inviteFriends = (houseId, friends) => {
  const userIds = [...new Set(
    (Array.isArray(friends) ? friends : [])
      .map((friend) => Number(friend?.userId ?? friend?.id))
      .filter((id) => Number.isSafeInteger(id) && id > 0),
  )];

  if (userIds.length === 0) {
    return Promise.reject(crewMessageError('초대할 친구를 선택해주세요.'));
  }

  return requestCrew(
    () => api.post(
      `/crew/houses/${encodeURIComponent(houseId)}/invitations`,
      { userIds },
    ),
    {
      400: '초대할 친구 정보를 확인해주세요.',
      403: 'House 친구 초대 권한이 없습니다.',
      404: 'House를 찾을 수 없습니다.',
      409: '선택한 친구는 이미 멤버이거나 초대 중입니다.',
    },
  ).then((data) => ({
    ...data,
    invitations: Array.isArray(data?.invitations)
      ? data.invitations.map(normalizeHouseInvitation)
      : [],
  }));
};

export const listMyInvitations = () => requestCrew(
  () => api.get('/crew/invitations/me'),
).then((data) => (
  Array.isArray(data) ? data.map(normalizeHouseInvitation) : []
));

export const acceptInvitation = (invitationId) => requestCrew(
  () => api.post(
    `/crew/invitations/${encodeURIComponent(invitationId)}/accept`,
  ),
).then(normalizeHouseInvitation);

export const rejectInvitation = (invitationId) => requestCrew(
  () => api.post(
    `/crew/invitations/${encodeURIComponent(invitationId)}/reject`,
  ),
).then(normalizeHouseInvitation);
export const getHouseSuggestionState = (suggestionId, user) => (
  mockGetHouseSuggestionState(suggestionId, user)
);
export const dismissHouseSuggestion = (suggestionId, user) => (
  mockDismissHouseSuggestion(suggestionId, user)
);
export const resetHouseSuggestion = (suggestionId, user) => (
  mockResetHouseSuggestion(suggestionId, user)
);
