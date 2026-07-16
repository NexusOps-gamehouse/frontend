export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  return `${Math.floor(hour / 24)}일 전`;
}

/** "랭크,칼바람" → ["랭크","칼바람"] */
export const csv = (s) => (s ? s.split(',').filter(Boolean) : []);

export function profileTags(u) {
  if (!u) return [];
  const tags = [];
  if (u.playStyle) tags.push(`#${u.playStyle === '빡겜' ? '빡겜러' : '즐겜러'}`);
  tags.push(u.mic ? '#마이크O' : '#마이크X');
  if (u.ageRange && u.ageRange !== '비공개') tags.push(`#${u.ageRange}`);
  return tags;
}

export function profileMeta(u) {
  if (!u) return '';
  return [u.game, u.position, u.tier].filter(Boolean).join(' · ');
}
