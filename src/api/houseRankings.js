import { mockListHouses } from '../mocks/houseStorage';
import { buildHouseRankingResult } from '../utils/houseRankings';

// TODO(house-ranking): 실제 backend 주간 랭킹/스냅샷 API가 제공되면 이 Mock adapter를 교체한다.
// 후보 API: GET /houses/rankings, GET /users/me/houses/rankings
export const listHouseRankings = async (user) => {
  const houses = await mockListHouses(user);
  return buildHouseRankingResult(houses, user);
};
