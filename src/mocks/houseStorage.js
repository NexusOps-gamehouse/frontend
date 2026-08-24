const STORAGE_KEY = 'gamehouse.houses.v1';

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
    createdAt: '2026-08-22T15:00:00.000Z',
  },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

// 기존 v1 localStorage 데이터에도 새 필드가 안전하게 적용되도록 읽을 때 보정한다.
const normalizeHouse = (house) => ({
  ...house,
  game: house.game || '기타',
  maxMembers: Number(house.maxMembers) || 20,
  members: Array.isArray(house.members) ? house.members : [],
  joinRequests: Array.isArray(house.joinRequests) ? house.joinRequests : [],
});

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

function userKey(user) {
  return String(user?.id ?? user?.userId ?? user?.email ?? user?.nickname ?? '');
}

function currentState(house, user) {
  const id = userKey(user);
  if (!id) return 'NONE';
  if (String(house.owner.id) === id) return 'OWNER';
  if (house.members.some((member) => String(member.id) === id)) return 'MEMBER';
  if (house.joinRequests.some((request) => String(request.userId) === id)) return 'PENDING';
  return 'NONE';
}

function withViewerState(house, user) {
  return { ...clone(house), myStatus: currentState(house, user) };
}

export async function mockListHouses(user) {
  return readHouses()
    .filter((house) => {
      const status = currentState(house, user);
      return house.visibility === 'PUBLIC' || status === 'OWNER' || status === 'MEMBER';
    })
    .map((house) => withViewerState(house, user));
}

export async function mockGetHouse(houseId, user) {
  const house = readHouses().find((item) => item.id === houseId);
  if (!house) throw new Error('House를 찾을 수 없습니다.');
  const status = currentState(house, user);
  if (house.visibility === 'PRIVATE' && status !== 'OWNER' && status !== 'MEMBER') {
    const error = new Error('비공개 House는 멤버만 상세 정보를 볼 수 있습니다.');
    error.code = 'PRIVATE_HOUSE';
    throw error;
  }
  return withViewerState(house, user);
}

export async function mockCreateHouse(payload, user) {
  const id = userKey(user);
  if (!id) throw new Error('House를 만들려면 로그인이 필요합니다.');

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
    createdAt: new Date().toISOString(),
  };

  writeHouses([house, ...houses]);
  return withViewerState(house, user);
}

export async function mockRequestHouseJoin(houseId, user) {
  const id = userKey(user);
  if (!id) throw new Error('가입을 신청하려면 로그인이 필요합니다.');

  const houses = readHouses();
  const index = houses.findIndex((item) => item.id === houseId);
  if (index < 0) throw new Error('House를 찾을 수 없습니다.');

  const house = houses[index];
  if (house.visibility !== 'PUBLIC') throw new Error('비공개 House는 초대로만 가입할 수 있습니다.');
  if (currentState(house, user) !== 'NONE') return withViewerState(house, user);
  if (house.members.length >= house.maxMembers) throw new Error('정원이 가득 차 가입을 신청할 수 없습니다.');

  house.joinRequests.push({
    userId: id,
    nickname: user.nickname || user.name || '신청자',
    requestedAt: new Date().toISOString(),
  });
  houses[index] = house;
  writeHouses(houses);
  return withViewerState(house, user);
}
