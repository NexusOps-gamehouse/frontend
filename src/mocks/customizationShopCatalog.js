import {
  CUSTOMIZATION_CATEGORY,
} from './customizationItems';

/* =========================================================
   Customization Tier
========================================================= */

export const CUSTOMIZATION_TIER = {
  FREE: 'FREE',
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM',
};

export const CUSTOMIZATION_TIER_LABEL = {
  [CUSTOMIZATION_TIER.FREE]:
    '무료',

  [CUSTOMIZATION_TIER.STANDARD]:
    '일반',

  [CUSTOMIZATION_TIER.PREMIUM]:
    '고급',
};

/* =========================================================
   Price Policy
========================================================= */

/*
 * 일반 등급 기본 가격
 *
 * 테두리       150 HC
 * 휘장         150 HC
 * 채팅방 테마  150 HC
 * 프로필 배너  200 HC
 */
export const CUSTOMIZATION_BASE_PRICE = {
  [CUSTOMIZATION_CATEGORY.FRAME]:
    150,

  [CUSTOMIZATION_CATEGORY.PROFILE_BANNER]:
    200,

  [CUSTOMIZATION_CATEGORY.EMBLEM]:
    150,

  [CUSTOMIZATION_CATEGORY.CHAT_THEME]:
    150,
};

/*
 * 고급 등급 가격
 *
 * 테두리       250 HC
 * 휘장         250 HC
 * 채팅방 테마  250 HC
 * 프로필 배너  300 HC
 */
export const CUSTOMIZATION_PREMIUM_PRICE = {
  [CUSTOMIZATION_CATEGORY.FRAME]:
    250,

  [CUSTOMIZATION_CATEGORY.PROFILE_BANNER]:
    300,

  [CUSTOMIZATION_CATEGORY.EMBLEM]:
    250,

  [CUSTOMIZATION_CATEGORY.CHAT_THEME]:
    250,
};

/* =========================================================
   Frame Tier
========================================================= */

/*
 * 무료 테두리 9종
 */
const FREE_FRAME_KEYS = [
  'adventurers-spring',
  'forest-friend',
  'shining-butter',
  'night-firefly',
  'apprentice-mage',
  'amethyst',
  'ink-wash',
  'coin-rush',
  'mini-arcade',
];

/*
 * 일반 유료 테두리 4종
 *
 * 최종 결정:
 * 연등
 * 스페이스
 * 플레임 플레이
 * 아케이드 픽셀
 */
const STANDARD_FRAME_KEYS = [
  'lantern',
  'space',
  'flame-play',
  'arcade-pixel',
];

/*
 * 고급 유료 테두리 10종
 */
const PREMIUM_FRAME_KEYS = [
  'sunset-match',
  'starlight-galaxy',
  'cherry-blossom',
  'dice-party',
  'royal-house',
  'moon-dream',
  'olympia',
  'ocean-wave',
  'snow-town',
  'music-night',
];

/* =========================================================
   Profile Banner Tier
========================================================= */

/*
 * 일반 프로필 배너 4종
 *
 * 200 HC
 */
const STANDARD_BANNER_KEYS = [
  'guardian-name',
  'amethyst',
  'disco-pop',
  'forest-warrior',
  'starry-night',
];

/*
 * 고급 프로필 배너 4종
 *
 * 300 HC
 */
const PREMIUM_BANNER_KEYS = [
  'voyage-road',
  'fairy-garden',
  'mermaid-ocean',
];

/* =========================================================
   Emblem Tier
========================================================= */

/*
 * 일반 휘장
 *
 * 기존 casual 계열 6종
 * 150 HC
 */
const STANDARD_EMBLEM_KEYS = [
  'cherry-blossom',
  'laurel',
  'wave',
  'crescent-moon',
  'acorn',
  'pixel-heart',
];

/*
 * 고급 휘장
 *
 * 기존 combat 계열 8종
 * 250 HC
 */
const PREMIUM_EMBLEM_KEYS = [
  'archer',
  'crossed-axes',
  'crossed-swords',
  'hammer-anvil',
  'knight-shield',
  'oni-mask',
  'spear',
  'trident',
];

/* =========================================================
   Chat Theme Tier
========================================================= */

/*
 * 일반 채팅방 테마 4종
 *
 * 150 HC
 */
const STANDARD_CHAT_THEME_KEYS = [
  'moonlight-lounge',
  'cherry-garden',
  'green-forest',
  'ocean-walk',
];

/*
 * 고급 채팅방 테마 2종
 *
 * 250 HC
 */
const PREMIUM_CHAT_THEME_KEYS = [
  'pixel-arcade',
  'magic-library',
];

/* =========================================================
   Helpers
========================================================= */

const itemSearchText = (
  item,
) =>
  [
    item?.id,
    item?.name,
    item?.asset,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const matchesAnyKey = (
  item,
  keys,
) => {
  const source =
    itemSearchText(
      item,
    );

  return keys.some(
    (key) =>
      source.includes(
        key,
      ),
  );
};

/* =========================================================
   Tier Resolver
========================================================= */

export const getCustomizationItemTier = (
  item,
) => {
  if (!item) {
    throw new Error(
      '등급을 확인할 꾸미기 아이템이 필요합니다.',
    );
  }

  /* =========================
     Frame
  ========================= */

  if (
    item.category ===
    CUSTOMIZATION_CATEGORY.FRAME
  ) {
    if (
      matchesAnyKey(
        item,
        FREE_FRAME_KEYS,
      )
    ) {
      return CUSTOMIZATION_TIER.FREE;
    }

    if (
      matchesAnyKey(
        item,
        STANDARD_FRAME_KEYS,
      )
    ) {
      return CUSTOMIZATION_TIER.STANDARD;
    }

    if (
      matchesAnyKey(
        item,
        PREMIUM_FRAME_KEYS,
      )
    ) {
      return CUSTOMIZATION_TIER.PREMIUM;
    }
  }

  /* =========================
     Profile Banner
  ========================= */

  if (
    item.category ===
    CUSTOMIZATION_CATEGORY.PROFILE_BANNER
  ) {
    if (
      matchesAnyKey(
        item,
        STANDARD_BANNER_KEYS,
      )
    ) {
      return CUSTOMIZATION_TIER.STANDARD;
    }

    if (
      matchesAnyKey(
        item,
        PREMIUM_BANNER_KEYS,
      )
    ) {
      return CUSTOMIZATION_TIER.PREMIUM;
    }
  }

  /* =========================
     Emblem
  ========================= */

  if (
    item.category ===
    CUSTOMIZATION_CATEGORY.EMBLEM
  ) {
    if (
      matchesAnyKey(
        item,
        STANDARD_EMBLEM_KEYS,
      )
    ) {
      return CUSTOMIZATION_TIER.STANDARD;
    }

    if (
      matchesAnyKey(
        item,
        PREMIUM_EMBLEM_KEYS,
      )
    ) {
      return CUSTOMIZATION_TIER.PREMIUM;
    }
  }

  /* =========================
     Chat Theme
  ========================= */

  if (
    item.category ===
    CUSTOMIZATION_CATEGORY.CHAT_THEME
  ) {
    if (
      matchesAnyKey(
        item,
        STANDARD_CHAT_THEME_KEYS,
      )
    ) {
      return CUSTOMIZATION_TIER.STANDARD;
    }

    if (
      matchesAnyKey(
        item,
        PREMIUM_CHAT_THEME_KEYS,
      )
    ) {
      return CUSTOMIZATION_TIER.PREMIUM;
    }
  }

  /*
   * 새로운 꾸미기 아이템이 추가됐는데
   * 가격 등급을 지정하지 않은 경우
   * 임의 가격으로 판매하지 않는다.
   */
  throw new Error(
    `${item.name ?? '꾸미기 아이템'}의 가격 등급이 지정되지 않았습니다.`,
  );
};

/* =========================================================
   Free Check
========================================================= */

export const isFreeCustomizationItem = (
  item,
) =>
  getCustomizationItemTier(
    item,
  ) === CUSTOMIZATION_TIER.FREE;

/* =========================================================
   Price Resolver
========================================================= */

export const getCustomizationItemPrice = (
  item,
) => {
  if (!item) {
    throw new Error(
      '가격을 확인할 꾸미기 아이템이 필요합니다.',
    );
  }

  const tier =
    getCustomizationItemTier(
      item,
    );

  /*
   * 무료 아이템
   */
  if (
    tier ===
    CUSTOMIZATION_TIER.FREE
  ) {
    return 0;
  }

  /*
   * 일반 아이템
   */
  if (
    tier ===
    CUSTOMIZATION_TIER.STANDARD
  ) {
    const price =
      CUSTOMIZATION_BASE_PRICE[
        item.category
      ];

    if (
      !Number.isSafeInteger(
        price,
      ) ||
      price <= 0
    ) {
      throw new Error(
        '올바른 일반 꾸미기 아이템 가격이 없습니다.',
      );
    }

    return price;
  }

  /*
   * 고급 아이템
   */
  if (
    tier ===
    CUSTOMIZATION_TIER.PREMIUM
  ) {
    const price =
      CUSTOMIZATION_PREMIUM_PRICE[
        item.category
      ];

    if (
      !Number.isSafeInteger(
        price,
      ) ||
      price <= 0
    ) {
      throw new Error(
        '올바른 고급 꾸미기 아이템 가격이 없습니다.',
      );
    }

    return price;
  }

  throw new Error(
    '올바른 꾸미기 아이템 가격이 없습니다.',
  );
};

/* =========================================================
   Labels
========================================================= */

export const getCustomizationItemTierLabel = (
  item,
) => {
  const tier =
    getCustomizationItemTier(
      item,
    );

  return CUSTOMIZATION_TIER_LABEL[
    tier
  ];
};

export const getCustomizationItemPriceLabel = (
  item,
) => {
  const price =
    getCustomizationItemPrice(
      item,
    );

  return price === 0
    ? '무료'
    : `${price} HC`;
};

/* =========================================================
   Shop Item
========================================================= */

export const getCustomizationShopItem = (
  item,
) => {
  const tier =
    getCustomizationItemTier(
      item,
    );

  const price =
    getCustomizationItemPrice(
      item,
    );

  return {
    ...item,

    tier,

    tierLabel:
      CUSTOMIZATION_TIER_LABEL[
        tier
      ],

    price,

    isFree:
      price === 0,

    priceLabel:
      price === 0
        ? '무료'
        : `${price} HC`,
  };
};

/* =========================================================
   Shop Items
========================================================= */

export const getCustomizationShopItems = (
  items,
) =>
  items.map(
    getCustomizationShopItem,
  );
