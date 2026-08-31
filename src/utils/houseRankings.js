import { getKstWeek } from './houseWeeklyQuests';

export const HOUSE_RANKING_SNAPSHOT_STORAGE_KEY = 'gamehouse.houseRankings.v1';

const MEMBER_ROLES = new Set(['OWNER', 'MANAGER', 'MEMBER']);

const safeXp = (value) => {
  const xp = Number(value);
  return Number.isFinite(xp) && xp >= 0 ? Math.floor(xp) : 0;
};

const safeId = (value) => {
  const id = String(value ?? '').trim();
  return id || null;
};

const safeCreatedAt = (value) => {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
};

const isPublicCompetitiveHouse = (house) => (
  house?.visibility === 'PUBLIC' && house?.type === 'COMPETITIVE'
);

const isMockMember = (house, user) => {
  const userId = safeId(user?.id ?? user?.userId ?? user?.email ?? user?.nickname);
  const role = house?.myRole ?? house?.myStatus;
  if (MEMBER_ROLES.has(role) || house?.myStatus === 'APPROVED') return true;
  if (!userId) return false;
  return safeId(house?.owner?.id) === userId
    || (Array.isArray(house?.members)
      && house.members.some((member) => safeId(member?.id ?? member?.userId) === userId));
};

export const normalizeHouseRankingCandidates = (houses = []) => {
  if (!Array.isArray(houses)) return [];

  const seenIds = new Set();
  return houses.reduce((result, house, originalIndex) => {
    const id = safeId(house?.id);
    if (!id || seenIds.has(id) || !isPublicCompetitiveHouse(house)) return result;
    seenIds.add(id);
    result.push({
      ...house,
      id,
      xp: safeXp(house.xp),
      originalIndex,
      createdAtValue: safeCreatedAt(house.createdAt),
    });
    return result;
  }, []);
};

export const sortHouseRankings = (houses = []) => [...houses].sort((left, right) => (
  right.xp - left.xp
    || left.createdAtValue - right.createdAtValue
    || String(left.name ?? '').localeCompare(String(right.name ?? ''), 'ko')
    || String(left.id).localeCompare(String(right.id), 'en')
    || left.originalIndex - right.originalIndex
));

export const addCompetitionRanks = (houses = []) => {
  let previousXp = null;
  let previousRank = 0;

  return houses.map((house, index) => {
    const rank = house.xp === previousXp ? previousRank : index + 1;
    previousXp = house.xp;
    previousRank = rank;
    return { ...house, rank };
  });
};

const validSnapshotItems = (items) => {
  if (!Array.isArray(items)) return null;
  const seenIds = new Set();
  const normalized = [];

  for (const item of items) {
    const id = safeId(item?.id);
    const rank = Number(item?.rank);
    if (!id || seenIds.has(id) || !Number.isSafeInteger(rank) || rank < 1) return null;
    seenIds.add(id);
    normalized.push({ id, rank });
  }

  return normalized;
};

export const readHouseRankingSnapshots = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(HOUSE_RANKING_SNAPSHOT_STORAGE_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(Object.entries(parsed).flatMap(([weekId, snapshot]) => {
      if (getKstWeek(`${weekId}T00:00:00+09:00`).weekId !== weekId) return [];
      const items = validSnapshotItems(snapshot?.items);
      if (!items) return [];
      return [[weekId, { weekId, items }]];
    }));
  } catch {
    return {};
  }
};

export const writeHouseRankingSnapshots = (snapshots) => {
  try {
    localStorage.setItem(HOUSE_RANKING_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshots));
  } catch {
    // Storage가 불가능한 환경에서는 현재 순위만 표시하고 계속 진행한다.
  }
};

export const getHouseRankingMovement = (rank, previousRank) => {
  if (!Number.isSafeInteger(previousRank) || previousRank < 1) {
    return { movement: 'NEW', movementDelta: null, previousRank: null };
  }
  if (rank < previousRank) {
    return { movement: 'UP', movementDelta: previousRank - rank, previousRank };
  }
  if (rank > previousRank) {
    return { movement: 'DOWN', movementDelta: rank - previousRank, previousRank };
  }
  return { movement: 'SAME', movementDelta: 0, previousRank };
};

export const buildHouseRankingResult = (houses, user, now = Date.now()) => {
  const week = getKstWeek(now);
  const candidates = normalizeHouseRankingCandidates(houses);
  const ranked = addCompetitionRanks(sortHouseRankings(candidates));
  const snapshots = readHouseRankingSnapshots();
  let snapshot = snapshots[week.weekId];

  if (!snapshot) {
    snapshot = {
      weekId: week.weekId,
      items: ranked.map((house) => ({ id: house.id, rank: house.rank })),
    };
    writeHouseRankingSnapshots({ ...snapshots, [week.weekId]: snapshot });
  }

  const previousRanks = new Map(snapshot.items.map((item) => [item.id, item.rank]));
  const userIsLoggedIn = Boolean(user?.id ?? user?.userId ?? user?.email ?? user?.nickname);
  const items = ranked.map((house) => ({
    ...house,
    isMine: userIsLoggedIn && isMockMember(house, user),
    ...getHouseRankingMovement(house.rank, previousRanks.get(house.id)),
  }));

  const myHouses = items.filter((house) => house.isMine);
  return {
    items,
    topHouses: items.slice(0, 10),
    myHouses,
    totalElements: items.length,
    weekId: week.weekId,
    startDate: week.startDate,
    endDate: week.endDate,
    updatedAt: new Date(now).toISOString(),
  };
};
