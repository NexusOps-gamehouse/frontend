import TierIcon from './icons/TierIcon';
import { userTierText, displayTier } from '../api/riot';

/**
 * 티어를 엠블럼 + 글자로 표시한다. 티어가 없으면 아무것도 그리지 않는다.
 * user는 UserDto 또는 { tier, rank }를 가진 객체.
 * '언랭'은 엠블럼이 없어 글자만 나온다.
 *
 * 엠블럼과 글자는 반드시 같은 출처에서 뽑는다. 예전에는 글자만 userTierText 로
 * 계산하고 엠블럼은 user.tier 를 직접 읽어서, 라이엇 연동 계정에서
 * '아이언 엠블럼 + 챌린저 글자'처럼 어긋날 수 있었다.
 */
export default function TierBadge({ user, height = 18, className = 'ui-tier' }) {
  const label = userTierText(user);
  if (!label) return null;

  const { tier, verified } = displayTier(user);

  return (
    <span className={className}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, verticalAlign: 'middle' }}>
      <TierIcon name={tier} height={height} />
      <span>{label}</span>
      {verified && <VerifiedMark size={Math.round(height * 0.72)} />}
    </span>
  );
}

/**
 * 라이엇 계정으로 확인된 티어임을 나타내는 체크.
 *
 * 설문에서 고른 값과 라이엇에서 확인된 값이 화면상 똑같이 보이면,
 * 상대의 티어를 믿어도 되는지 알 수 없다. 듀오 매칭에서는 티어가
 * 상대를 고르는 기준이라 이 구분이 실질적인 의미를 갖는다.
 *
 * <title> 을 넣으면 마우스를 올렸을 때 설명이 뜨고, 스크린 리더도 이것을
 * 읽는다. role="img" 이 있어야 svg 내부 도형이 따로 읽히지 않는다.
 */
function VerifiedMark({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" role="img"
         style={{ color: 'var(--verified)', flexShrink: 0 }}>
      <title>라이엇 계정으로 확인된 티어</title>
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path d="M4.9 8.2l2.1 2.1 4.2-4.4" fill="none" stroke="#fff"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
