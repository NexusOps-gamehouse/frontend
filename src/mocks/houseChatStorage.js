import { mockGetHouse } from './houseStorage.js';

const MESSAGE_STORAGE_KEY = 'gamehouse.houseMessages.v1';
const HOUSE_STORAGE_KEY = 'gamehouse.houses.v1';
const MESSAGE_CHANGE_EVENT = 'gamehouse:house-messages-changed';
const HOUSE_CHANGE_EVENT = 'gamehouse:houses-changed';
const MEMBER_ROLES = new Set(['OWNER', 'MANAGER', 'MEMBER']);
const MAX_MESSAGES_PER_HOUSE = 100;

const clone = (value) => JSON.parse(JSON.stringify(value));

function userKey(user) {
  return String(user?.id ?? user?.userId ?? user?.email ?? user?.nickname ?? '');
}

function readMessages() {
  try {
    const saved = JSON.parse(localStorage.getItem(MESSAGE_STORAGE_KEY) || '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
    return Object.fromEntries(Object.entries(saved).map(([houseId, messages]) => [
      houseId,
      (Array.isArray(messages) ? messages : []).slice(-MAX_MESSAGES_PER_HOUSE),
    ]));
  } catch {
    return {};
  }
}

function writeMessages(messagesByHouse, houseId) {
  localStorage.setItem(MESSAGE_STORAGE_KEY, JSON.stringify(messagesByHouse));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MESSAGE_CHANGE_EVENT, { detail: { houseId } }));
  }
}

async function requireHouseMember(houseId, user) {
  const house = await mockGetHouse(houseId, user);
  if (!MEMBER_ROLES.has(house.myStatus)) {
    throw new Error('House 멤버만 채팅을 이용할 수 있습니다.');
  }
  return house;
}

export async function mockListHouseMessages(houseId, user) {
  await requireHouseMember(houseId, user);
  const messages = readMessages()[houseId] || [];
  return clone(messages).sort((a, b) => (
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  ));
}

export async function mockSendHouseMessage(houseId, content, user) {
  const house = await requireHouseMember(houseId, user);
  const value = String(content ?? '').trim();
  if (!value) throw new Error('메시지를 입력해주세요.');
  if (value.length > 500) throw new Error('메시지는 500자 이하로 입력해주세요.');

  const id = userKey(user);
  const member = house.members.find((item) => String(item.id) === id);
  const message = {
    id: `house-message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    houseId,
    content: value,
    author: {
      id,
      nickname: member?.nickname || user.nickname || user.name || 'House 멤버',
      role: house.myStatus,
    },
    createdAt: new Date().toISOString(),
  };
  const messagesByHouse = readMessages();
  messagesByHouse[houseId] = [...(messagesByHouse[houseId] || []), message]
    .slice(-MAX_MESSAGES_PER_HOUSE);
  writeMessages(messagesByHouse, houseId);
  return clone(message);
}

export async function mockSubscribeHouseMessages(houseId, user, callback) {
  await requireHouseMember(houseId, user);
  if (typeof window === 'undefined') return () => {};

  const refresh = async () => {
    try {
      callback(await mockListHouseMessages(houseId, user), null);
    } catch (error) {
      callback(null, error);
    }
  };
  const onStorage = (event) => {
    if ([MESSAGE_STORAGE_KEY, HOUSE_STORAGE_KEY].includes(event.key)) refresh();
  };
  const onMessageChange = (event) => {
    if (!event.detail?.houseId || event.detail.houseId === houseId) refresh();
  };
  const onHouseChange = () => refresh();

  window.addEventListener('storage', onStorage);
  window.addEventListener(MESSAGE_CHANGE_EVENT, onMessageChange);
  window.addEventListener(HOUSE_CHANGE_EVENT, onHouseChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(MESSAGE_CHANGE_EVENT, onMessageChange);
    window.removeEventListener(HOUSE_CHANGE_EVENT, onHouseChange);
  };
}
