import {
  mockGetHouseCoinBalance,
  mockGetHouseCoinWallet,
} from '../mocks/houseCoinStorage';

/**
 * 로그인 사용자의 개인 HC 지갑 API 계약입니다.
 * 백엔드 준비 후 GET /users/me/house-coin 및
 * GET /users/me/house-coin/transactions 호출로 교체합니다.
 */
export const getHouseCoinBalance = (user) => mockGetHouseCoinBalance(user);
export const getHouseCoinWallet = (user) => mockGetHouseCoinWallet(user);

// TODO(house-coin): HC 보상 지급은 클라이언트 입력이 아니라 서버 내부 처리 또는
// 서버가 검증하는 별도 보상 API로 연결해야 한다.
