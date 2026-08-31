const STORAGE_KEY =
  'gamehouse.houseCoinWallets.v1';

const WALLET_CHANGE_EVENT =
  'gamehouse:house-coin-changed';

export const WEEKLY_COMPLETION_REWARD_HC =
  50;

const WEEKLY_REASON =
  'WEEKLY_QUEST_ALL_COMPLETED';

const PURCHASE_REASON =
  'CUSTOMIZATION_PURCHASE';

const emptyState = () => ({
  wallets: {},
  weeklyRewards: {},
});

const clone = (value) =>
  JSON.parse(
    JSON.stringify(value),
  );

const userKey = (user) =>
  String(
    user?.id ??
      user?.userId ??
      '',
  ).trim();

const requireUserId = (user) => {
  const id = userKey(user);

  if (!id) {
    throw new Error(
      'HC 지갑을 보려면 로그인이 필요합니다.',
    );
  }

  return id;
};

const isPositiveSafeInteger = (
  value,
) =>
  Number.isSafeInteger(value) &&
  value > 0;

const isNegativeSafeInteger = (
  value,
) =>
  Number.isSafeInteger(value) &&
  value < 0;

/* =========================
   Transaction IDs
========================= */

const weeklyTransactionId = (
  houseId,
  weekId,
  userId,
) =>
  `weekly-completion:${houseId}:${weekId}:${userId}`;

const purchaseTransactionId = (
  itemId,
  userId,
) =>
  `customization-purchase:${itemId}:${userId}`;

/* =========================
   Weekly Reward Transaction
========================= */

const normalizeWeeklyTransaction = (
  value,
  userId,
) => {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return null;
  }

  const id =
    String(value.id ?? '');

  const houseId =
    String(value.houseId ?? '');

  const weekId =
    String(value.weekId ?? '');

  const amount =
    Number(value.amount);

  if (
    !id ||
    !houseId ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      weekId,
    ) ||
    !isPositiveSafeInteger(
      amount,
    ) ||
    amount !==
      WEEKLY_COMPLETION_REWARD_HC ||
    id !==
      weeklyTransactionId(
        houseId,
        weekId,
        userId,
      )
  ) {
    return null;
  }

  return {
    id,

    reason:
      WEEKLY_REASON,

    houseId,

    weekId,

    amount,

    grantedAt:
      typeof value.grantedAt ===
      'string'
        ? value.grantedAt
        : new Date(
            0,
          ).toISOString(),
  };
};

/* =========================
   Purchase Transaction
========================= */

const normalizePurchaseTransaction = (
  value,
  userId,
) => {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return null;
  }

  const id =
    String(value.id ?? '');

  const itemId =
    String(value.itemId ?? '').trim();

  const amount =
    Number(value.amount);

  if (
    !id ||
    !itemId ||
    !isNegativeSafeInteger(
      amount,
    ) ||
    id !==
      purchaseTransactionId(
        itemId,
        userId,
      )
  ) {
    return null;
  }

  return {
    id,

    reason:
      PURCHASE_REASON,

    itemId,

    amount,

    spentAt:
      typeof value.spentAt ===
      'string'
        ? value.spentAt
        : new Date(
            0,
          ).toISOString(),
  };
};

/* =========================
   Transaction Normalizer
========================= */

const normalizeTransaction = (
  value,
  userId,
) => {
  if (
    value?.reason ===
    PURCHASE_REASON
  ) {
    return normalizePurchaseTransaction(
      value,
      userId,
    );
  }

  /*
   * 이전 localStorage 데이터와의
   * 호환성을 위해 reason이 없거나
   * WEEKLY_REASON이면 주간 보상으로 처리.
   */
  return normalizeWeeklyTransaction(
    value,
    userId,
  );
};

/* =========================
   Wallet Normalizer
========================= */

const normalizeWallet = (
  value,
  userId,
  weeklyRewards = null,
) => {
  const seen = new Set();

  const transactions = [];

  let balance = 0;

  const candidates =
    Array.isArray(
      value?.transactions,
    )
      ? value.transactions
      : [];

  candidates.forEach(
    (candidate) => {
      const transaction =
        normalizeTransaction(
          candidate,
          userId,
        );

      if (
        !transaction ||
        seen.has(
          transaction.id,
        )
      ) {
        return;
      }

      /*
       * 주간 퀘스트 적립 거래는
       * 실제 완료 기록과 일치해야 한다.
       */
      if (
        transaction.reason ===
          WEEKLY_REASON &&
        weeklyRewards
      ) {
        const reward =
          weeklyRewards[
            `weekly-completion:${transaction.houseId}:${transaction.weekId}`
          ];

        if (
          !reward ||
          reward.amount !==
            transaction.amount ||
          !reward.recipientIds.includes(
            userId,
          )
        ) {
          return;
        }
      }

      const nextBalance =
        balance +
        transaction.amount;

      /*
       * 잘못된 저장 데이터 때문에
       * 잔액이 음수가 되는 거래는 무시.
       */
      if (
        !Number.isSafeInteger(
          nextBalance,
        ) ||
        nextBalance < 0
      ) {
        return;
      }

      seen.add(
        transaction.id,
      );

      transactions.push(
        transaction,
      );

      balance =
        nextBalance;
    },
  );

  return {
    userId,
    balance,
    transactions,
  };
};

/* =========================
   Weekly Reward Normalizer
========================= */

const normalizeReward = (
  value,
  rewardId,
) => {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return null;
  }

  const houseId =
    String(
      value.houseId ?? '',
    );

  const weekId =
    String(
      value.weekId ?? '',
    );

  const amount =
    Number(value.amount);

  if (
    !houseId ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      weekId,
    ) ||
    rewardId !==
      `weekly-completion:${houseId}:${weekId}` ||
    !isPositiveSafeInteger(
      amount,
    ) ||
    amount !==
      WEEKLY_COMPLETION_REWARD_HC
  ) {
    return null;
  }

  const recipientIds = [
    ...new Set(
      (
        Array.isArray(
          value.recipientIds,
        )
          ? value.recipientIds
          : []
      )
        .map((id) =>
          String(id).trim(),
        )
        .filter(Boolean),
    ),
  ];

  if (
    recipientIds.length === 0
  ) {
    return null;
  }

  return {
    id: rewardId,

    houseId,

    weekId,

    amount,

    recipientIds,

    completedAt:
      typeof value.completedAt ===
      'string'
        ? value.completedAt
        : new Date(
            0,
          ).toISOString(),
  };
};

/* =========================
   State Normalizer
========================= */

const normalizeState = (
  value,
) => {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return emptyState();
  }

  const rewardSource =
    value.weeklyRewards &&
    typeof value.weeklyRewards ===
      'object' &&
    !Array.isArray(
      value.weeklyRewards,
    )
      ? value.weeklyRewards
      : {};

  const weeklyRewards =
    Object.fromEntries(
      Object.entries(
        rewardSource,
      ).flatMap(
        ([id, reward]) => {
          const normalized =
            normalizeReward(
              reward,
              id,
            );

          return normalized
            ? [[
                id,
                normalized,
              ]]
            : [];
        },
      ),
    );

  const walletSource =
    value.wallets &&
    typeof value.wallets ===
      'object' &&
    !Array.isArray(
      value.wallets,
    )
      ? value.wallets
      : {};

  const wallets =
    Object.fromEntries(
      Object.entries(
        walletSource,
      ).flatMap(
        ([
          rawId,
          wallet,
        ]) => {
          const id =
            String(
              rawId,
            ).trim();

          return id
            ? [[
                id,
                normalizeWallet(
                  wallet,
                  id,
                  weeklyRewards,
                ),
              ]]
            : [];
        },
      ),
    );

  return {
    wallets,
    weeklyRewards,
  };
};

/* =========================
   Read / Write
========================= */

function readState() {
  try {
    return normalizeState(
      JSON.parse(
        localStorage.getItem(
          STORAGE_KEY,
        ) || 'null',
      ),
    );
  } catch {
    return emptyState();
  }
}

function writeState(
  state,
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state),
  );

  if (
    typeof window !==
    'undefined'
  ) {
    window.dispatchEvent(
      new CustomEvent(
        WALLET_CHANGE_EVENT,
      ),
    );
  }
}

function walletFor(
  state,
  userId,
) {
  if (
    !state.wallets[userId]
  ) {
    state.wallets[userId] =
      normalizeWallet(
        null,
        userId,
      );
  }

  return state.wallets[
    userId
  ];
}

/* =========================
   Wallet API
========================= */

export async function mockGetHouseCoinWallet(
  user,
) {
  const userId =
    requireUserId(user);

  const state =
    readState();

  const wallet =
    walletFor(
      state,
      userId,
    );

  writeState(state);

  return clone(wallet);
}

export async function mockGetHouseCoinBalance(
  user,
) {
  return (
    await mockGetHouseCoinWallet(
      user,
    )
  ).balance;
}

/* =========================
   Spend HC
========================= */

export async function mockSpendHouseCoin(
  user,
  {
    amount,
    itemId,
  },
) {
  const userId =
    requireUserId(user);

  const normalizedAmount =
    Number(amount);

  const normalizedItemId =
    String(
      itemId ?? '',
    ).trim();

  if (
    !isPositiveSafeInteger(
      normalizedAmount,
    )
  ) {
    throw new Error(
      'HC 사용 금액은 양의 정수여야 합니다.',
    );
  }

  if (
    !normalizedItemId
  ) {
    throw new Error(
      '구매할 꾸미기 아이템 정보가 필요합니다.',
    );
  }

  const state =
    readState();

  const wallet =
    walletFor(
      state,
      userId,
    );

  const id =
    purchaseTransactionId(
      normalizedItemId,
      userId,
    );

  /*
   * 같은 아이템 구매 거래가 이미 존재하면
   * 다시 차감하지 않는다.
   */
  if (
    wallet.transactions.some(
      (transaction) =>
        transaction.id === id,
    )
  ) {
    return clone(wallet);
  }

  if (
    wallet.balance <
    normalizedAmount
  ) {
    throw new Error(
      `HC가 부족합니다. 필요 ${normalizedAmount} HC · 현재 ${wallet.balance} HC`,
    );
  }

  const nextBalance =
    wallet.balance -
    normalizedAmount;

  if (
    !Number.isSafeInteger(
      nextBalance,
    ) ||
    nextBalance < 0
  ) {
    throw new Error(
      'HC 잔액을 올바르게 계산할 수 없습니다.',
    );
  }

  wallet.transactions.push({
    id,

    reason:
      PURCHASE_REASON,

    itemId:
      normalizedItemId,

    /*
     * 거래 원장에서는
     * 지출을 음수로 기록.
     */
    amount:
      -normalizedAmount,

    spentAt:
      new Date().toISOString(),
  });

  wallet.balance =
    nextBalance;

  writeState(state);

  return clone(wallet);
}

/* =========================
   Weekly Reward Status
========================= */

export function getWeeklyCompletionRewardStatus(
  houseId,
  weekId,
  user,
) {
  const userId =
    requireUserId(user);

  const state =
    readState();

  const rewardId =
    `weekly-completion:${houseId}:${weekId}`;

  const reward =
    state.weeklyRewards[
      rewardId
    ];

  const wallet =
    walletFor(
      state,
      userId,
    );

  return {
    amount:
      WEEKLY_COMPLETION_REWARD_HC,

    eligible:
      Boolean(
        reward?.recipientIds.includes(
          userId,
        ),
      ),

    rewarded:
      wallet.transactions.some(
        (transaction) =>
          transaction.id ===
          weeklyTransactionId(
            houseId,
            weekId,
            userId,
          ),
      ),
  };
}

/* =========================
   Weekly Reward
========================= */

/*
 * TODO(house-coin):
 * 실제 서비스에서는 서버가
 * House / 주차 / 완료 여부 / 대상 멤버를 검증하고
 * 거래 원장과 동시성 제어를 포함한
 * 하나의 트랜잭션으로 HC를 지급해야 한다.
 */
export function grantWeeklyCompletionReward({
  houseId,
  weekId,
  houseType,
  allCompleted,
  members,
}) {
  if (
    houseType !==
    'COMPETITIVE'
  ) {
    throw new Error(
      '경쟁형 House만 전체 완료 HC 보상을 받을 수 있습니다.',
    );
  }

  if (
    !allCompleted
  ) {
    throw new Error(
      '주간 퀘스트를 모두 완료해야 HC 보상을 받을 수 있습니다.',
    );
  }

  const normalizedHouseId =
    String(
      houseId ?? '',
    ).trim();

  if (
    !normalizedHouseId ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      weekId,
    )
  ) {
    throw new Error(
      '올바른 House 주차 정보가 필요합니다.',
    );
  }

  const amount =
    WEEKLY_COMPLETION_REWARD_HC;

  if (
    !isPositiveSafeInteger(
      amount,
    )
  ) {
    throw new Error(
      'HC 보상은 양의 정수여야 합니다.',
    );
  }

  const state =
    readState();

  const rewardId =
    `weekly-completion:${normalizedHouseId}:${weekId}`;

  let reward =
    state.weeklyRewards[
      rewardId
    ];

  if (!reward) {
    const recipientIds = [
      ...new Set(
        (
          Array.isArray(
            members,
          )
            ? members
            : []
        )
          .map((member) =>
            String(
              member?.id ??
                '',
            ).trim(),
          )
          .filter(Boolean),
      ),
    ];

    if (
      recipientIds.length ===
      0
    ) {
      throw new Error(
        'HC 보상 대상 House 멤버가 없습니다.',
      );
    }

    reward = {
      id: rewardId,

      houseId:
        normalizedHouseId,

      weekId,

      amount,

      recipientIds,

      completedAt:
        new Date().toISOString(),
    };

    state.weeklyRewards[
      rewardId
    ] = reward;
  }

  reward.recipientIds.forEach(
    (userId) => {
      const wallet =
        walletFor(
          state,
          userId,
        );

      const id =
        weeklyTransactionId(
          normalizedHouseId,
          weekId,
          userId,
        );

      if (
        wallet.transactions.some(
          (transaction) =>
            transaction.id ===
            id,
        )
      ) {
        return;
      }

      const nextBalance =
        wallet.balance +
        reward.amount;

      if (
        !Number.isSafeInteger(
          nextBalance,
        )
      ) {
        throw new Error(
          '적립 가능한 HC 범위를 초과했습니다.',
        );
      }

      wallet.transactions.push({
        id,

        reason:
          WEEKLY_REASON,

        houseId:
          normalizedHouseId,

        weekId,

        amount:
          reward.amount,

        grantedAt:
          reward.completedAt,
      });

      wallet.balance =
        nextBalance;
    },
  );

  writeState(state);

  return clone(reward);
}