import TierIcon from './icons/TierIcon';
import { userTierText } from '../api/riot';

/**
 * 티어를 엠블럼 + 글자로 표시한다. 티어가 없으면 아무것도 그리지 않는다.
 * user는 UserDto 또는 { tier, rank }를 가진 객체.
 * '언랭'은 엠블럼이 없어 글자만 나온다.
 */
export default function TierBadge({ user, height = 18, className = 'ui-tier' }) {
  const label = userTierText(user);
  if (!label) return null;

  return (
    <span className={className}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, verticalAlign: 'middle' }}>
      <TierIcon name={user.tier} height={height} />
      <span>{label}</span>
    </span>
  );
}
