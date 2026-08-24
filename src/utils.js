import { formatRiotId } from './api/riot';
export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  return `${Math.floor(hour / 24)}일 전`;
}

/**
 * timeAgo 의 초 단위 버전. "1초 전" 처럼 방금 일어난 일을 보여줄 때 쓴다.
 *
 * timeAgo 는 1분 미만을 전부 '방금 전'으로 뭉갠다. 알림 목록에서는 그게 맞지만,
 * 버튼을 누른 직후 반응을 보여줘야 하는 자리에서는 초가 보여야 한다.
 * (라이엇 전적 갱신처럼 "내가 방금 눌렀다"가 확인돼야 하는 곳)
 */
export function timeAgoSec(iso, now = Date.now()) {
  if (!iso) return '';
  const sec = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
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
  if (u.age) tags.push(`#${u.age}세`);
  if (u.playDuration) tags.push(`#${u.playDuration}`);
  return tags;
}

export function profileMeta(u) {
  if (!u) return '';
  // tier에는 설문 한글값('다이아몬드')과 라이엇 enum('DIAMOND')이 둘 다 들어올 수 있다
  // 티어는 <TierBadge />가 엠블럼과 함께 따로 표시한다
  return [u.game, u.position].filter(Boolean).join(' · ');
}

/** UserDto → 'Hide on bush#KR1' (미연동이면 '') */
export function riotIdOf(u) {
  return formatRiotId(u?.gameName, u?.tagLine);
}

/** 입력 중 자동 하이픈. 01012345678 → 010-1234-5678 */
export function formatPhone(v) {
  const d = (v ?? '').replace(/\D/g, '').slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;  // 011-123-4567
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export const isValidPhone = (v) => /^01[016789]-\d{3,4}-\d{4}$/.test(v ?? '');

/** 이름: 한글/영문/공백만, 2~20자 */
export const isValidName = (v) => /^[가-힣a-zA-Z][가-힣a-zA-Z\s]{1,19}$/.test((v ?? '').trim());
