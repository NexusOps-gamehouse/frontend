import {
  mockGetHouseCoinBalance,
  mockGetHouseCoinWallet,
  mockSpendHouseCoin,
} from '../mocks/houseCoinStorage';

/**
 * 로그인 사용자의 개인 HC 지갑 API 계약입니다.
 *
 * 현재:
 * Mock localStorage 기반
 *
 * 백엔드 준비 후 예상 API:
 *
 * GET  /users/me/house-coin
 * GET  /users/me/house-coin/transactions
 * POST /users/me/customization/purchases
 */

export const getHouseCoinBalance = (
  user,
) =>
  mockGetHouseCoinBalance(
    user,
  );

export const getHouseCoinWallet = (
  user,
) =>
  mockGetHouseCoinWallet(
    user,
  );

/*
 * 프론트 Mock에서만 직접 사용한다.
 *
 * 실제 서비스에서는 클라이언트가
 * amount를 신뢰해서 보내면 안 된다.
 * 서버가 itemId를 기준으로 가격을 조회하고
 * HC 차감 + 아이템 지급을 하나의
 * 트랜잭션으로 처리해야 한다.
 */
export const spendHouseCoin = (
  user,
  purchase,
) =>
  mockSpendHouseCoin(
    user,
    purchase,
  );

// TODO(house-coin):
// HC 보상 지급은 클라이언트 입력이 아니라
// 서버 내부 처리 또는 서버가 검증하는
// 별도 보상 API로 연결해야 한다.