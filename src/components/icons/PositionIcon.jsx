/**
 * 포지션 아이콘. 협곡 미니맵 위에 해당 라인을 강조하는 방식.
 * 서포터는 점 두 개(듀오)로 원딜과 구분한다.
 */

const ALIAS = {
  TOP: ['탑', '탑라인', 'top'],
  JUNGLE: ['정글', '정글러', '졍글', 'jungle', 'jg'],
  MID: ['미드', '미드라이너', 'mid'],
  ADC: ['원딜', '바텀', '봇', '원거리딜러', 'adc', 'bot'],
  SUPPORT: ['서포터', '서폿', '서포트', 'support', 'sup'],
  ANY: ['상관없음', '무관', '아무거나', '올라운더', 'any', 'fill'],
};

function resolve(name) {
  const k = String(name ?? '').replace(/\s/g, '').toLowerCase();
  for (const [key, list] of Object.entries(ALIAS)) {
    if (list.some((a) => a.toLowerCase() === k)) return key;
  }
  return null;
}

const LANES = {
  top: 'M7 17 L7 7 L17 7',
  bot: 'M7 17 L17 17 L17 7',
  mid: 'M7.8 16.2 L16.2 7.8',
};

export default function PositionIcon({ name, size = 18 }) {
  const pos = resolve(name);

  // 아이콘이 없는 값은 아무것도 그리지 않는다 (칩은 글자만 표시)
  if (!pos) return null;

  const laneOn = (lane) => {
    if (pos === 'ANY') return 0.55;
    if (pos === 'TOP') return lane === 'top' ? 1 : 0.18;
    if (pos === 'MID') return lane === 'mid' ? 1 : 0.18;
    if (pos === 'ADC' || pos === 'SUPPORT') return lane === 'bot' ? 1 : 0.18;
    return 0.18; // JUNGLE
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4"
            stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.3" />

      {Object.entries(LANES).map(([lane, d]) => (
        <path key={lane} d={d} stroke="currentColor" strokeOpacity={laneOn(lane)}
              strokeWidth={laneOn(lane) === 1 ? 2 : 1.3}
              strokeLinecap="round" strokeLinejoin="round" />
      ))}

      {pos === 'JUNGLE' && (
        <>
          <circle cx="10.2" cy="9.8" r="1.7" fill="currentColor" />
          <circle cx="13.8" cy="14.2" r="1.7" fill="currentColor" />
        </>
      )}
      {pos === 'TOP' && <circle cx="7" cy="7" r="2" fill="currentColor" />}
      {pos === 'MID' && <circle cx="12" cy="12" r="2" fill="currentColor" />}
      {pos === 'ADC' && <circle cx="17" cy="17" r="2" fill="currentColor" />}
      {pos === 'SUPPORT' && (
        <>
          <circle cx="17" cy="17" r="2" fill="currentColor" />
          <circle cx="13.4" cy="17" r="1.5" fill="currentColor" fillOpacity="0.65" />
        </>
      )}
    </svg>
  );
}
