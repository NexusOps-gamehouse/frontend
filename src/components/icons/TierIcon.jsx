/**
 * 티어 아이콘. 라이엇 공식 엠블럼 이미지.
 *
 * 원본은 1000x1000에 여백이 제각각이라(아이언 63%, 그랜드마스터 100%)
 * 투명 여백을 잘라 176x120으로 통일해둔 상태다.
 * 원본을 새로 넣을 때는 같은 전처리를 거쳐야 크기가 맞는다.
 *
 * constants.js의 TIERS는 '언랭'과 '마스터 이상'을 쓴다.
 *   언랭        → 이미지 없음 (글자만)
 *   마스터 이상 → master.png
 * grandmaster / challenger는 설문에는 없지만, 나중에 라이엇 실제 티어를
 * 표시할 때 필요해서 남겨둔다.
 */

import iron from '../../assets/tiers/iron.png';
import bronze from '../../assets/tiers/bronze.png';
import silver from '../../assets/tiers/silver.png';
import gold from '../../assets/tiers/gold.png';
import platinum from '../../assets/tiers/platinum.png';
import emerald from '../../assets/tiers/emerald.png';
import diamond from '../../assets/tiers/diamond.png';
import master from '../../assets/tiers/master.png';
import grandmaster from '../../assets/tiers/grandmaster.png';
import challenger from '../../assets/tiers/challenger.png';

const TIER_TABLE = [
  { src: iron,        names: ['아이언', 'iron'] },
  { src: bronze,      names: ['브론즈', 'bronze'] },
  { src: silver,      names: ['실버', 'silver'] },
  { src: gold,        names: ['골드', 'gold'] },
  { src: platinum,    names: ['플래티넘', '플래티나', '플랫', 'platinum'] },
  { src: emerald,     names: ['에메랄드', 'emerald'] },
  { src: diamond,     names: ['다이아몬드', '다이아', 'diamond'] },
  { src: master,      names: ['마스터이상', '마스터', 'master'] },
  { src: grandmaster, names: ['그랜드마스터', '그마', 'grandmaster'] },
  { src: challenger,  names: ['챌린저', '챌', 'challenger'] },
];

function resolve(name) {
  const k = String(name ?? '').replace(/\s/g, '').toLowerCase();
  if (!k || k === '언랭' || k === 'unranked') return null;   // 언랭은 엠블럼이 없다
  return TIER_TABLE.find((t) => t.names.some((n) => n.toLowerCase() === k)) ?? null;
}

/** 엠블럼이 가로로 넓어서 height 기준으로 크기를 정한다. */
export default function TierIcon({ name, height = 20 }) {
  const tier = resolve(name);
  if (!tier) return null;

  return (
    <img src={tier.src} alt="" aria-hidden="true" loading="lazy"
         style={{ height, width: 'auto', display: 'block' }} />
  );
}
