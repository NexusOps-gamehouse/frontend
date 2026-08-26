const STORAGE_KEY = 'gamehouse.houseCoinWallets.v1';
const WALLET_CHANGE_EVENT = 'gamehouse:house-coin-changed';

export const WEEKLY_COMPLETION_REWARD_HC = 50;

const emptyState = () => ({ wallets: {}, weeklyRewards: {} });

const userKey = (user) => String(user?.id ?? user?.userId ?? '').trim();

const requireUserId = (user) => {
  const id = userKey(user);
  if (!id) throw new Error('HC 지갑을 보려면 로그인이 필요합니다.');
  return id;
};

const isPositiveSafeInteger = (value) => Number.isSafeInteger(value) && value > 0;

const transactionId = (houseId, weekId, userId) => (
  `weekly-completion:${houseId}:${weekId}:${userId}`
);

const normalizeTransaction = (value, userId) => {
  if (!value || typeof value !== 'object') return null;
  const id = String(value.id ?? '');
  const houseId = String(value.houseId ?? '');
  const weekId = String(value.weekId ?? '');
  const amount = Number(value.amount);
  if (!id || !houseId || !/^\d{4}-\d{2}-\d{2}$/.test(weekId)
    || !isPositiveSafeInteger(amount) || amount !== WEEKLY_COMPLETION_REWARD_HC
    || id !== transactionId(houseId, weekId, userId)) return null;
  return {
    id,
    reason: 'WEEKLY_QUEST_ALL_COMPLETED',
    houseId,
    weekId,
    amount,
    grantedAt: typeof value.grantedAt === 'string' ? value.grantedAt : new Date(0).toISOString(),
  };
};

const normalizeWallet = (value, userId, weeklyRewards = null) => {
  const seen = new Set();
  const transactions = [];
  let balance = 0;
  const candidates = Array.isArray(value?.transactions) ? value.transactions : [];
  candidates.forEach((candidate) => {
    const transaction = normalizeTransaction(candidate, userId);
    if (!transaction || seen.has(transaction.id)) return;
    if (weeklyRewards) {
      const reward = weeklyRewards[`weekly-completion:${transaction.houseId}:${transaction.weekId}`];
      if (!reward || reward.amount !== transaction.amount || !reward.recipientIds.includes(userId)) return;
    }
    const nextBalance = balance + transaction.amount;
    if (!Number.isSafeInteger(nextBalance)) return;
    seen.add(transaction.id);
    transactions.push(transaction);
    balance = nextBalance;
  });
  return { userId, balance, transactions };
};

const normalizeReward = (value, rewardId) => {
  if (!value || typeof value !== 'object') return null;
  const houseId = String(value.houseId ?? '');
  const weekId = String(value.weekId ?? '');
  const amount = Number(value.amount);
  if (!houseId || !/^\d{4}-\d{2}-\d{2}$/.test(weekId)
    || rewardId !== `weekly-completion:${houseId}:${weekId}`
    || !isPositiveSafeInteger(amount) || amount !== WEEKLY_COMPLETION_REWARD_HC) return null;
  const recipientIds = [...new Set((Array.isArray(value.recipientIds) ? value.recipientIds : [])
    .map((id) => String(id).trim()).filter(Boolean))];
  if (recipientIds.length === 0) return null;
  return {
    id: rewardId,
    houseId,
    weekId,
    amount,
    recipientIds,
    completedAt: typeof value.completedAt === 'string' ? value.completedAt : new Date(0).toISOString(),
  };
};

const normalizeState = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyState();
  const rewardSource = value.weeklyRewards && typeof value.weeklyRewards === 'object'
    && !Array.isArray(value.weeklyRewards) ? value.weeklyRewards : {};
  const weeklyRewards = Object.fromEntries(Object.entries(rewardSource).flatMap(([id, reward]) => {
    const normalized = normalizeReward(reward, id);
    return normalized ? [[id, normalized]] : [];
  }));
  const walletSource = value.wallets && typeof value.wallets === 'object' && !Array.isArray(value.wallets)
    ? value.wallets : {};
  const wallets = Object.fromEntries(Object.entries(walletSource).flatMap(([rawId, wallet]) => {
    const id = String(rawId).trim();
    return id ? [[id, normalizeWallet(wallet, id, weeklyRewards)]] : [];
  }));
  return { wallets, weeklyRewards };
};

function readState() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
  } catch {
    return emptyState();
  }
}

function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(WALLET_CHANGE_EVENT));
}

function walletFor(state, userId) {
  if (!state.wallets[userId]) state.wallets[userId] = normalizeWallet(null, userId);
  return state.wallets[userId];
}

export async function mockGetHouseCoinWallet(user) {
  const userId = requireUserId(user);
  const state = readState();
  const wallet = walletFor(state, userId);
  writeState(state);
  return JSON.parse(JSON.stringify(wallet));
}

export async function mockGetHouseCoinBalance(user) {
  return (await mockGetHouseCoinWallet(user)).balance;
}

export function getWeeklyCompletionRewardStatus(houseId, weekId, user) {
  const userId = requireUserId(user);
  const state = readState();
  const rewardId = `weekly-completion:${houseId}:${weekId}`;
  const reward = state.weeklyRewards[rewardId];
  const wallet = walletFor(state, userId);
  return {
    amount: WEEKLY_COMPLETION_REWARD_HC,
    eligible: Boolean(reward?.recipientIds.includes(userId)),
    rewarded: wallet.transactions.some((transaction) => (
      transaction.id === transactionId(houseId, weekId, userId)
    )),
  };
}

// TODO(house-coin): 실제 서비스에서는 서버가 House/주차/완료 여부/대상 멤버를 검증하고,
// 거래 원장과 동시성 제어를 포함한 하나의 트랜잭션으로 HC를 지급해야 한다.
export function grantWeeklyCompletionReward({ houseId, weekId, houseType, allCompleted, members }) {
  if (houseType !== 'COMPETITIVE') throw new Error('경쟁형 House만 전체 완료 HC 보상을 받을 수 있습니다.');
  if (!allCompleted) throw new Error('주간 퀘스트를 모두 완료해야 HC 보상을 받을 수 있습니다.');
  const normalizedHouseId = String(houseId ?? '').trim();
  if (!normalizedHouseId || !/^\d{4}-\d{2}-\d{2}$/.test(weekId)) {
    throw new Error('올바른 House 주차 정보가 필요합니다.');
  }
  const amount = WEEKLY_COMPLETION_REWARD_HC;
  if (!isPositiveSafeInteger(amount)) throw new Error('HC 보상은 양의 정수여야 합니다.');

  const state = readState();
  const rewardId = `weekly-completion:${normalizedHouseId}:${weekId}`;
  let reward = state.weeklyRewards[rewardId];
  if (!reward) {
    const recipientIds = [...new Set((Array.isArray(members) ? members : [])
      .map((member) => String(member?.id ?? '').trim()).filter(Boolean))];
    if (recipientIds.length === 0) throw new Error('HC 보상 대상 House 멤버가 없습니다.');
    reward = {
      id: rewardId,
      houseId: normalizedHouseId,
      weekId,
      amount,
      recipientIds,
      completedAt: new Date().toISOString(),
    };
    state.weeklyRewards[rewardId] = reward;
  }

  reward.recipientIds.forEach((userId) => {
    const wallet = walletFor(state, userId);
    const id = transactionId(normalizedHouseId, weekId, userId);
    if (wallet.transactions.some((transaction) => transaction.id === id)) return;
    const nextBalance = wallet.balance + reward.amount;
    if (!Number.isSafeInteger(nextBalance)) throw new Error('적립 가능한 HC 범위를 초과했습니다.');
    wallet.transactions.push({
      id,
      reason: 'WEEKLY_QUEST_ALL_COMPLETED',
      houseId: normalizedHouseId,
      weekId,
      amount: reward.amount,
      grantedAt: reward.completedAt,
    });
    wallet.balance = nextBalance;
  });

  writeState(state);
  return JSON.parse(JSON.stringify(reward));
}
