import { useState } from 'react';
import { addHouseXp } from '../api/houses';

const XP_OPTIONS = [50, 150, 200];
const numberFormat = new Intl.NumberFormat('ko-KR');

export default function HouseGrowthPanel({ house, user, onUpdate, onNotice }) {
  const [working, setWorking] = useState(0);
  const [error, setError] = useState('');
  const currentXp = Math.max(0, Number(house.currentLevelXp) || 0);
  const nextXp = Math.max(1, Number(house.nextLevelXp) || 1);
  const progress = Math.min(100, Math.max(0, (currentXp / nextXp) * 100));
  const remainingXp = Math.max(0, nextXp - currentXp);
  const competitive = house.type === 'COMPETITIVE';

  const addXp = async (amount) => {
    if (working) return;
    setWorking(amount);
    setError('');
    try {
      const updated = await addHouseXp(house.id, amount, user);
      const leveledUp = updated.level > house.level;
      onUpdate(updated);
      onNotice(leveledUp
        ? `House가 LV. ${updated.level}(으)로 성장했습니다!`
        : `${numberFormat.format(amount)} XP를 적립했습니다.`);
    } catch (err) {
      setError(err.message || 'House XP를 적립하지 못했습니다.');
    } finally {
      setWorking(0);
    }
  };

  return (
    <section className={`house-growth-panel ${competitive ? 'competitive' : 'social'}`}>
      <div className="house-growth-head">
        <div>
          <span className="house-eyebrow">HOUSE GROWTH</span>
          <h2>HOUSE LV. {house.level}</h2>
          <p>{competitive
            ? 'House 활동으로 경험치를 쌓고 함께 더 높은 레벨에 도전해보세요.'
            : '함께한 활동이 차곡차곡 쌓인 House의 성장 기록입니다.'}</p>
        </div>
        <strong>누적 {numberFormat.format(house.xp)} XP</strong>
      </div>
      <div className="house-growth-progress-copy">
        <span>{numberFormat.format(currentXp)} / {numberFormat.format(nextXp)} XP</span>
        <span>다음 레벨까지 {numberFormat.format(remainingXp)} XP</span>
      </div>
      <div className="house-growth-track" role="progressbar" aria-label="House 레벨 진행률"
           aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress)}>
        <div style={{ width: `${progress}%` }} />
      </div>

      {import.meta.env.DEV && house.myStatus === 'OWNER' && (
        <div className="house-growth-dev">
          <div><strong>개발 전용 Mock XP</strong><small>실제 게임 결과와 연결되지 않은 UI 테스트 기능입니다.</small></div>
          <div className="house-growth-dev-actions">
            {XP_OPTIONS.map((amount) => (
              <button className="ui-btn-secondary ui-btn-sm" type="button" key={amount}
                      disabled={Boolean(working)} onClick={() => addXp(amount)}>
                {working === amount ? '적립 중…' : `+${amount} XP`}
              </button>
            ))}
          </div>
          {error && <div className="house-alert error" role="alert">{error}</div>}
        </div>
      )}
    </section>
  );
}
