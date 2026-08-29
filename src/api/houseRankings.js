import { mockListHouses } from '../mocks/houseStorage';
import { buildHouseRankingResult } from '../utils/houseRankings';
import { calculateHouseGrowth } from '../utils/houseGrowth';
import api, { errMsg } from './client';

const USE_MOCK = import.meta.env.VITE_USE_HOUSE_RANKING_MOCK === 'true';

const RANKING_ERROR_MESSAGES = {
  400: '랭킹 요청 내용을 확인해주세요.',
  401: '로그인이 필요합니다.',
  403: '랭킹을 확인할 권한이 없습니다.',
  404: '랭킹 정보를 찾을 수 없습니다.',
  500: '서버 오류가 발생했습니다.',
  network: '서버에 연결할 수 없습니다.',
};

const requestRanking = async (request) => {
  try {
    const { data } = await request();
    return data;
  } catch (error) {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;
    const normalized = new Error(
      serverMessage || RANKING_ERROR_MESSAGES[status]
        || (!status ? RANKING_ERROR_MESSAGES.network : errMsg(error)),
    );
    normalized.status = status;
    normalized.response = error.response;
    throw normalized;
  }
};

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const normalizeRankingItem = (item = {}) => {
  const xp = Math.max(0, Math.floor(safeNumber(item.xp)));
  const currentMembers = Math.max(0, Math.floor(safeNumber(item.currentMembers ?? item.memberCount)));
  const movementType = item.rankChange?.type ?? item.movement;
  const movement = ['UP', 'DOWN', 'SAME', 'NEW'].includes(movementType) ? movementType : 'SAME';
  const movementDelta = movement === 'NEW'
    ? null
    : movement === 'SAME'
      ? 0
      : Math.max(0, Math.floor(safeNumber(item.rankChange?.amount ?? item.movementDelta)));

  return {
    ...item,
    id: item.houseId ?? item.id,
    houseId: item.houseId ?? item.id,
    name: item.name ?? '',
    representativeGame: item.representativeGame ?? null,
    game: item.representativeGame ?? item.game ?? null,
    xp,
    level: Number.isInteger(Number(item.level)) && Number(item.level) > 0
      ? Number(item.level)
      : calculateHouseGrowth(xp).level,
    currentMembers,
    memberCount: currentMembers,
    maxMembers: item.maxMembers == null ? null : Math.max(0, Math.floor(safeNumber(item.maxMembers))),
    rank: Math.max(1, Math.floor(safeNumber(item.rank, 1))),
    movement,
    movementDelta,
  };
};

const normalizeRankingResponse = (data = {}, requestedPage = 0, requestedSize = 20) => {
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items = rawItems.map(normalizeRankingItem);
  const topHouses = (Array.isArray(data.topHouses) ? data.topHouses : items)
    .map(normalizeRankingItem);
  const totalElements = Math.max(0, Math.floor(safeNumber(data.totalElements, items.length)));
  const size = Math.max(1, Math.floor(safeNumber(data.size, requestedSize)));

  return {
    ...data,
    items,
    topHouses,
    myHouses: Array.isArray(data.myHouses) ? data.myHouses.map(normalizeRankingItem) : [],
    totalElements,
    totalPages: Math.max(0, Math.floor(safeNumber(data.totalPages,
      totalElements ? Math.ceil(totalElements / size) : 0))),
    page: Math.max(0, Math.floor(safeNumber(data.page, requestedPage))),
    size,
    weekId: data.weekId ?? '',
    updatedAt: data.updatedAt ?? null,
  };
};

const isLegacyCall = (value) => value
  && !Object.prototype.hasOwnProperty.call(value, 'page')
  && !Object.prototype.hasOwnProperty.call(value, 'size')
  && !Object.prototype.hasOwnProperty.call(value, 'user')
  && ['id', 'userId', 'email', 'nickname'].some((key) => value[key] != null);

export const listHouseRankings = async (options = {}) => {
  const requestOptions = options && typeof options === 'object' ? options : {};
  const legacyUser = isLegacyCall(requestOptions) ? requestOptions : null;
  const { page = 0, size = 20, user = legacyUser } = legacyUser ? {} : requestOptions;

  if (USE_MOCK) {
    const houses = await mockListHouses(user);
    const mockResult = buildHouseRankingResult(houses, user);
    const normalized = normalizeRankingResponse({
      ...mockResult,
      items: mockResult.items.slice(page * size, page * size + size),
      topHouses: mockResult.topHouses,
      myHouses: mockResult.myHouses,
    }, page, size);
    return normalized;
  }

  return requestRanking(() => api.get('/crew/houses/rankings', {
    params: { page, size },
  })).then((data) => normalizeRankingResponse(data, page, size));
};

export const listMyHouseRankings = async (user) => {
  if (USE_MOCK) {
    const houses = await mockListHouses(user);
    return buildHouseRankingResult(houses, user).myHouses.map(normalizeRankingItem);
  }

  return requestRanking(() => api.get('/crew/houses/rankings/me'))
    .then((data) => (Array.isArray(data) ? data : data?.items || []).map(normalizeRankingItem));
};
