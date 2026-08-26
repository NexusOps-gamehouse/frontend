import {
  CUSTOMIZATION_CATEGORY,
} from './customizationItems';

/*
 * 현재 프론트 Mock 상점 가격표.
 *
 * 실제 백엔드 연동 시에는 가격 역시
 * 서버가 내려주는 값으로 교체해야 한다.
 */
export const CUSTOMIZATION_BASE_PRICE = {
  [CUSTOMIZATION_CATEGORY.FRAME]: 200,
  [CUSTOMIZATION_CATEGORY.PROFILE_BANNER]: 300,
  [CUSTOMIZATION_CATEGORY.EMBLEM]: 180,
  [CUSTOMIZATION_CATEGORY.CHAT_THEME]: 200,
};

/*
 * 채팅 테마는 와이어프레임처럼
 * 테마별 가격 차이를 둔다.
 */
const CHAT_THEME_PRICES = [
  ['moonlight-lounge', 200],
  ['cherry-garden', 200],
  ['green-forest', 180],
  ['pixel-arcade', 250],
  ['magic-library', 250],
  ['ocean-walk', 200],
];

const itemSearchText = (item) =>
  [
    item?.id,
    item?.name,
    item?.asset,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

export const getCustomizationItemPrice = (
  item,
) => {
  if (!item) {
    throw new Error(
      '가격을 확인할 꾸미기 아이템이 필요합니다.',
    );
  }

  if (
    item.category ===
    CUSTOMIZATION_CATEGORY.CHAT_THEME
  ) {
    const source =
      itemSearchText(item);

    const matched =
      CHAT_THEME_PRICES.find(
        ([key]) =>
          source.includes(key),
      );

    if (matched) {
      return matched[1];
    }
  }

  const price =
    CUSTOMIZATION_BASE_PRICE[
      item.category
    ];

  if (
    !Number.isSafeInteger(price) ||
    price <= 0
  ) {
    throw new Error(
      '올바른 꾸미기 아이템 가격이 없습니다.',
    );
  }

  return price;
};

export const getCustomizationShopItem = (
  item,
) => ({
  ...item,
  price:
    getCustomizationItemPrice(
      item,
    ),
});

export const getCustomizationShopItems = (
  items,
) =>
  items.map(
    getCustomizationShopItem,
  );