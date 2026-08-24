import {
  mockCreateHouse,
  mockGetHouse,
  mockListHouses,
  mockRequestHouseJoin,
} from '../mocks/houseStorage';

/**
 * House 화면이 의존하는 API 계약입니다.
 * 백엔드 준비 후 이 파일의 구현만 Axios 호출로 교체하면 pages와 Mock 저장소는
 * 수정하지 않아도 됩니다.
 */
export const listHouses = (user) => mockListHouses(user);
export const getHouse = (houseId, user) => mockGetHouse(houseId, user);
export const createHouse = (payload, user) => mockCreateHouse(payload, user);
export const requestHouseJoin = (houseId, user) => mockRequestHouseJoin(houseId, user);
