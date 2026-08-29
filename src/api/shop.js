import api from './client';

const SHOP_ERROR_MESSAGES = {
  400: '구매 요청 또는 상품 정보를 확인해주세요.',
  401: '로그인이 필요합니다.',
  403: '이 House의 아이템을 관리할 권한이 없습니다.',
  404: 'House, 상품 또는 Inventory를 찾을 수 없습니다.',
  409: 'HC가 부족하거나 처리할 수 없는 요청입니다.',
  500: '서버 오류가 발생했습니다.',
  network: '서버에 연결할 수 없습니다.',
};

const getErrorMessage = (error) => {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;
  if (serverMessage) return serverMessage;
  return SHOP_ERROR_MESSAGES[status]
    || (!status ? SHOP_ERROR_MESSAGES.network : '요청에 실패했습니다.');
};

const requestShop = async (request) => {
  try {
    const { data } = await request();
    return data;
  } catch (error) {
    const normalizedError = new Error(getErrorMessage(error));
    normalizedError.status = error?.response?.status;
    normalizedError.response = error?.response;
    normalizedError.code = error?.code;
    throw normalizedError;
  }
};

const normalizeShopItem = (item) => {
  if (!item || typeof item !== 'object') return null;
  const priceHc = Number(item.priceHc);
  return {
    ...item,
    id: item.id,
    name: String(item.name ?? '상품'),
    category: String(item.category ?? 'OTHER'),
    priceHc: Number.isSafeInteger(priceHc) && priceHc >= 0 ? priceHc : 0,
    imageUrl: item.imageUrl || null,
  };
};

const normalizeInventoryItem = (item) => {
  if (!item || typeof item !== 'object') return null;
  const quantity = Number(item.quantity);
  const shopItem = normalizeShopItem(item.item);
  return {
    ...item,
    id: item.id,
    inventoryId: item.id,
    userId: item.userId,
    houseId: item.houseId,
    item: shopItem,
    itemId: shopItem?.id,
    quantity: Number.isSafeInteger(quantity) && quantity >= 0 ? quantity : 0,
    isApplied: item.isApplied === true,
  };
};

export const listShopItems = () => requestShop(
  () => api.get('/shop/items'),
).then((data) => (
  Array.isArray(data) ? data.map(normalizeShopItem).filter(Boolean) : []
));

// Backend에서 상품 상세 endpoint를 제공하지 않으므로 별도 호출은 만들지 않는다.

export const buyShopItem = ({ houseId, itemId, quantity = 1 }) => {
  const safeQuantity = Number(quantity);
  if (houseId == null || itemId == null || !Number.isInteger(safeQuantity) || safeQuantity < 1) {
    return Promise.reject(new Error('구매 정보를 확인해주세요.'));
  }
  return requestShop(
    () => api.post(
      `/shop/buy?houseId=${encodeURIComponent(houseId)}`,
      { itemId, quantity: safeQuantity },
    ),
  );
};

export const listShopInventory = ({ houseId, userId } = {}) => {
  if (!houseId) return Promise.reject(new Error('Inventory를 조회할 House가 필요합니다.'));
  return requestShop(
    () => api.get(`/shop/inventory?houseId=${encodeURIComponent(houseId)}`),
  ).then((data) => {
    const inventory = Array.isArray(data)
      ? data.map(normalizeInventoryItem).filter(Boolean)
      : [];
    if (userId == null) return inventory;
    return inventory.filter((item) => String(item.userId) === String(userId));
  });
};

export const updateInventoryItemApplication = (inventoryItemId, { houseId, action } = {}) => {
  if (inventoryItemId == null || houseId == null || !['APPLY', 'UNAPPLY'].includes(action)) {
    return Promise.reject(new Error('아이템 적용 정보를 확인해주세요.'));
  }
  return requestShop(
    () => api.post(
      `/shop/inventory/${encodeURIComponent(inventoryItemId)}/toggle?houseId=${encodeURIComponent(houseId)}`,
      { action },
    ),
  );
};
