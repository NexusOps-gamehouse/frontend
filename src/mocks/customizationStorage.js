import {
  CUSTOMIZATION_CATEGORY,
  customizationItems,
} from './customizationItems';

import {
  mockGetHouseCoinWallet,
  mockSpendHouseCoin,
} from './houseCoinStorage';

import {
  getCustomizationItemPrice,
} from './customizationShopCatalog';

import {
  getChatThemeAvatarById,
  getDefaultChatThemeAvatar,
} from './customizationChatAvatars';

/*
 * v1은 디자인 테스트용으로
 * 모든 카탈로그 아이템을 보유했기 때문에
 * 구매 기능 도입 시 v2로 분리한다.
 */
const STORAGE_KEY =
  'gamehouse.customization.v2';

const CUSTOMIZATION_CHANGE_EVENT =
  'gamehouse:customization-changed';

const EQUIPPED_KEYS = {
  [CUSTOMIZATION_CATEGORY.FRAME]:
    'equippedFrameId',

  [CUSTOMIZATION_CATEGORY.PROFILE_BANNER]:
    'equippedBannerId',

  [CUSTOMIZATION_CATEGORY.EMBLEM]:
    'equippedEmblemId',

  [CUSTOMIZATION_CATEGORY.CHAT_THEME]:
    'equippedChatThemeId',
};

const clone = (value) =>
  JSON.parse(
    JSON.stringify(value),
  );

const userKey = (user) =>
  String(
    user?.id ??
      user?.userId ??
      user?.email ??
      user?.nickname ??
      '',
  ).trim();

const requireUserId = (
  user,
) => {
  const id =
    userKey(user);

  if (!id) {
    throw new Error(
      '꾸미기 정보를 사용하려면 로그인이 필요합니다.',
    );
  }

  return id;
};

const itemsByCategory = (
  category,
) =>
  customizationItems.filter(
    (item) =>
      item.category ===
      category,
  );

const firstItemId = (
  category,
) =>
  itemsByCategory(
    category,
  )[0]?.id ?? null;

/* =========================
   Starter Items
========================= */

const starterOwnedItemIds =
  () =>
    [
      firstItemId(
        CUSTOMIZATION_CATEGORY.FRAME,
      ),

      firstItemId(
        CUSTOMIZATION_CATEGORY.PROFILE_BANNER,
      ),

      firstItemId(
        CUSTOMIZATION_CATEGORY.EMBLEM,
      ),

      firstItemId(
        CUSTOMIZATION_CATEGORY.CHAT_THEME,
      ),
    ].filter(Boolean);

/* =========================
   Initial State
========================= */

const createInitialState =
  () => {
    const starters =
      starterOwnedItemIds();

    const equippedChatThemeId =
      firstItemId(
        CUSTOMIZATION_CATEGORY.CHAT_THEME,
      );

    return {
      ownedItemIds:
        starters,

      equippedFrameId:
        firstItemId(
          CUSTOMIZATION_CATEGORY.FRAME,
        ),

      equippedBannerId:
        firstItemId(
          CUSTOMIZATION_CATEGORY.PROFILE_BANNER,
        ),

      equippedEmblemId:
        firstItemId(
          CUSTOMIZATION_CATEGORY.EMBLEM,
        ),

      equippedChatThemeId:
        equippedChatThemeId,

      equippedChatAvatarId:
        getDefaultChatThemeAvatar(
          equippedChatThemeId,
        )?.id ?? null,
    };
  };

/* =========================
   Normalization
========================= */

const normalizeOwnedItemIds = (
  value,
) => {
  const validIds =
    new Set(
      customizationItems.map(
        (item) =>
          item.id,
      ),
    );

  const savedIds =
    Array.isArray(value)
      ? value.filter(
          (itemId) =>
            typeof itemId ===
              'string' &&
            validIds.has(
              itemId,
            ),
        )
      : [];

  /*
   * 기본 지급 아이템은
   * 항상 보유 상태를 보장한다.
   */
  return [
    ...new Set([
      ...starterOwnedItemIds(),
      ...savedIds,
    ]),
  ];
};

const normalizeEquippedItem = (
  itemId,
  category,
  ownedItemIds,
) => {
  const item =
    customizationItems.find(
      (candidate) =>
        candidate.id ===
          itemId &&
        candidate.category ===
          category,
    );

  if (
    item &&
    ownedItemIds.includes(
      item.id,
    )
  ) {
    return item.id;
  }

  const fallback =
    itemsByCategory(
      category,
    ).find(
      (candidate) =>
        ownedItemIds.includes(
          candidate.id,
        ),
    );

  return fallback?.id ??
    null;
};

const normalizeUserState = (
  value,
) => {
  const initial =
    createInitialState();

  if (
    !value ||
    typeof value !==
      'object' ||
    Array.isArray(value)
  ) {
    return initial;
  }

  const ownedItemIds =
    normalizeOwnedItemIds(
      value.ownedItemIds,
    );

  const equippedChatThemeId =
    normalizeEquippedItem(
      value.equippedChatThemeId,
      CUSTOMIZATION_CATEGORY.CHAT_THEME,
      ownedItemIds,
    );

  const savedChatAvatar =
    getChatThemeAvatarById(
      value.equippedChatAvatarId,
    );

  const equippedChatAvatarId =
    savedChatAvatar?.themeId ===
      equippedChatThemeId
      ? savedChatAvatar.id
      : getDefaultChatThemeAvatar(
          equippedChatThemeId,
        )?.id ?? null;

  return {
    ownedItemIds,

    equippedFrameId:
      normalizeEquippedItem(
        value.equippedFrameId,
        CUSTOMIZATION_CATEGORY.FRAME,
        ownedItemIds,
      ),

    equippedBannerId:
      normalizeEquippedItem(
        value.equippedBannerId,
        CUSTOMIZATION_CATEGORY.PROFILE_BANNER,
        ownedItemIds,
      ),

    equippedEmblemId:
      normalizeEquippedItem(
        value.equippedEmblemId,
        CUSTOMIZATION_CATEGORY.EMBLEM,
        ownedItemIds,
      ),

    equippedChatThemeId:
      equippedChatThemeId,

    equippedChatAvatarId,
  };
};

/* =========================
   Read / Write
========================= */

const readAllStates =
  () => {
    try {
      const saved =
        JSON.parse(
          localStorage.getItem(
            STORAGE_KEY,
          ) || '{}',
        );

      if (
        saved &&
        typeof saved ===
          'object' &&
        !Array.isArray(saved)
      ) {
        return saved;
      }
    } catch {
      // 손상된 Mock 데이터는 복구
    }

    return {};
  };

const writeAllStates = (
  states,
) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(states),
  );

  if (
    typeof window !==
      'undefined'
  ) {
    window.dispatchEvent(
      new CustomEvent(
        CUSTOMIZATION_CHANGE_EVENT,
      ),
    );
  }
};

const getUserState = (
  states,
  userId,
) => {
  const normalized =
    normalizeUserState(
      states[userId],
    );

  states[userId] =
    normalized;

  return normalized;
};

/* =========================
   Get Customization State
========================= */

export async function mockGetCustomizationState(
  user,
) {
  const userId =
    requireUserId(user);

  const states =
    readAllStates();

  const state =
    getUserState(
      states,
      userId,
    );

  writeAllStates(
    states,
  );

  return clone(state);
}

/* =========================
   Save Equipped Items
========================= */

export async function mockSaveEquippedCustomization(
  user,
  equippedItems,
) {
  const userId =
    requireUserId(user);

  const states =
    readAllStates();

  const current =
    getUserState(
      states,
      userId,
    );

  const nextState = {
    ...current,
  };

  Object.entries(
    EQUIPPED_KEYS,
  ).forEach(
    ([
      category,
      stateKey,
    ]) => {
      const itemId =
        equippedItems?.[
          category
        ];

      if (
        itemId ===
        undefined
      ) {
        return;
      }

      if (
        itemId === null
      ) {
        nextState[
          stateKey
        ] = null;

        return;
      }

      const item =
        customizationItems.find(
          (candidate) =>
            candidate.id ===
              itemId &&
            candidate.category ===
              category,
        );

      if (!item) {
        throw new Error(
          '올바르지 않은 꾸미기 아이템입니다.',
        );
      }

      if (
        !current.ownedItemIds.includes(
          item.id,
        )
      ) {
        throw new Error(
          '보유하지 않은 아이템은 장착할 수 없습니다.',
        );
      }

      nextState[
        stateKey
      ] = item.id;
    },
  );

  const requestedChatAvatarId =
    equippedItems?.equippedChatAvatarId;

  if (
    requestedChatAvatarId !==
      undefined
  ) {
    if (
      requestedChatAvatarId === null &&
      nextState.equippedChatThemeId === null
    ) {
      nextState.equippedChatAvatarId =
        null;
    } else {
      const avatar =
        getChatThemeAvatarById(
          requestedChatAvatarId,
        );

      if (
        !avatar ||
        avatar.themeId !==
          nextState.equippedChatThemeId
      ) {
        throw new Error(
          '선택한 채팅 테마에서 사용할 수 없는 프로필 이미지입니다.',
        );
      }

      nextState.equippedChatAvatarId =
        avatar.id;
    }
  }

  states[userId] =
    normalizeUserState(
      nextState,
    );

  writeAllStates(
    states,
  );

  return clone(
    states[userId],
  );
}

/* =========================
   Owned Items
========================= */

export async function mockGetOwnedCustomizationItems(
  user,
) {
  const state =
    await mockGetCustomizationState(
      user,
    );

  return customizationItems.filter(
    (item) =>
      state.ownedItemIds.includes(
        item.id,
      ),
  );
}

/* =========================
   Purchase / Free Acquire
========================= */

export async function mockPurchaseCustomizationItem(
  user,
  itemId,
) {
  const userId =
    requireUserId(user);

  const normalizedItemId =
    String(
      itemId ?? '',
    ).trim();

  const item =
    customizationItems.find(
      (candidate) =>
        candidate.id ===
        normalizedItemId,
    );

  if (!item) {
    throw new Error(
      '구매할 꾸미기 아이템을 찾을 수 없습니다.',
    );
  }

  const states =
    readAllStates();

  const current =
    getUserState(
      states,
      userId,
    );

  const price =
    getCustomizationItemPrice(
      item,
    );

  /*
   * 이미 보유 중이라면
   * 무료/유료 여부와 관계없이
   * 다시 지급하거나 HC를 차감하지 않는다.
   */
  if (
    current.ownedItemIds.includes(
      item.id,
    )
  ) {
    return {
      item:
        clone(item),

      price,

      isFree:
        price === 0,

      alreadyOwned:
        true,

      customization:
        clone(current),

      wallet:
        await mockGetHouseCoinWallet(
          user,
        ),
    };
  }

  /*
   * 유료 아이템:
   * HC를 먼저 차감한다.
   *
   * 무료 아이템:
   * HC 거래를 만들지 않고
   * 현재 지갑 상태만 조회한다.
   */
  const wallet =
    price === 0
      ? await mockGetHouseCoinWallet(
          user,
        )
      : await mockSpendHouseCoin(
          user,
          {
            amount:
              price,

            itemId:
              item.id,
          },
        );

  /*
   * 아이템 소유권 추가
   */
  current.ownedItemIds = [
    ...new Set([
      ...current.ownedItemIds,
      item.id,
    ]),
  ];

  states[userId] =
    normalizeUserState(
      current,
    );

  writeAllStates(
    states,
  );

  /*
   * 실제 백엔드에서는 유료 구매의 경우
   *
   * HC 차감
   * +
   * 소유 아이템 지급
   *
   * 을 하나의 DB Transaction으로
   * 처리해야 한다.
   *
   * 무료 아이템은 가격이 0인 상품으로
   * 서버에서 소유권만 지급하도록 처리한다.
   */
  return {
    item:
      clone(item),

    price,

    isFree:
      price === 0,

    alreadyOwned:
      false,

    customization:
      clone(
        states[userId],
      ),

    wallet,
  };
}

/* =========================
   Subscription
========================= */

export function subscribeCustomizationChange(
  callback,
) {
  if (
    typeof window ===
      'undefined'
  ) {
    return () => {};
  }

  const handler =
    () => {
      callback?.();
    };

  window.addEventListener(
    CUSTOMIZATION_CHANGE_EVENT,
    handler,
  );

  return () => {
    window.removeEventListener(
      CUSTOMIZATION_CHANGE_EVENT,
      handler,
    );
  };
}

/* =========================
   DEV Reset
========================= */

export async function mockResetCustomization(
  user,
) {
  const userId =
    requireUserId(user);

  const states =
    readAllStates();

  delete states[
    userId
  ];

  writeAllStates(
    states,
  );

  return mockGetCustomizationState(
    user,
  );
}
