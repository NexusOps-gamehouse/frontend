import {
  mockGetCustomizationState,
  mockGetOwnedCustomizationItems,
  mockPurchaseCustomizationItem,
  mockResetCustomization,
  mockSaveEquippedCustomization,
  subscribeCustomizationChange,
} from '../mocks/customizationStorage';

/*
 * 꾸미기 API 계약
 *
 * 현재는 Mock Storage 사용.
 *
 * 백엔드 연동 후 예상:
 *
 * GET  /users/me/customization
 * GET  /users/me/customization/items
 * PUT  /users/me/customization/equipped
 * POST /users/me/customization/purchases
 */

export const getCustomizationState = (
  user,
) =>
  mockGetCustomizationState(
    user,
  );

export const getOwnedCustomizationItems = (
  user,
) =>
  mockGetOwnedCustomizationItems(
    user,
  );

export const saveEquippedCustomization = (
  user,
  equippedItems,
) =>
  mockSaveEquippedCustomization(
    user,
    equippedItems,
  );

export const purchaseCustomizationItem = (
  user,
  itemId,
) =>
  mockPurchaseCustomizationItem(
    user,
    itemId,
  );

export const subscribeCustomization = (
  callback,
) =>
  subscribeCustomizationChange(
    callback,
  );

/*
 * 개발 환경 초기화용.
 */
export const resetCustomization = (
  user,
) =>
  mockResetCustomization(
    user,
  );