import { useCallback, useEffect, useState } from 'react';
import { getHouseCoinBalance } from '../api/houseCoin';

export default function HouseCoinWallet({ user, refreshKey = 0 }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      setBalance(await getHouseCoinBalance(user));
    } catch (err) {
      setBalance(null);
      setError(err.message || 'HC 잔액을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load, refreshKey]);

  if (!user) return null;

  return (
    <section className="house-coin-wallet" aria-label="내 House Coin 지갑">
      <div>
        <span className="house-eyebrow">MY HOUSE COIN</span>
        <strong>내 HC 지갑</strong>
        <p>House 활동으로 받은 개인 꾸미기 재화입니다.</p>
      </div>
      {loading && <span className="house-coin-balance" aria-live="polite">불러오는 중…</span>}
      {!loading && !error && <span className="house-coin-balance" aria-live="polite">HC {balance}</span>}
      {!loading && error && (
        <div className="house-coin-error" role="alert">
          <span>{error}</span>
          <button className="ui-btn-secondary ui-btn-sm" type="button" onClick={load}>다시 시도</button>
        </div>
      )}
    </section>
  );
}
