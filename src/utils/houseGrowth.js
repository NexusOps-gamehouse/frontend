export const HOUSE_XP_STEP = 500;

export function normalizeHouseXp(value) {
  const xp = Number(value);
  return Number.isSafeInteger(xp) && xp >= 0 ? xp : 0;
}

export function xpRequiredForNextLevel(level) {
  const safeLevel = Number.isInteger(level) && level > 0 ? level : 1;
  return safeLevel * HOUSE_XP_STEP;
}

export function calculateHouseGrowth(value) {
  const xp = normalizeHouseXp(value);
  const completedLevels = Math.floor((Math.sqrt(1 + (8 * xp) / HOUSE_XP_STEP) - 1) / 2);
  const level = completedLevels + 1;
  const spentXp = (HOUSE_XP_STEP * completedLevels * (completedLevels + 1)) / 2;
  const currentLevelXp = xp - spentXp;
  const nextLevelXp = xpRequiredForNextLevel(level);
  const progressPercent = Math.min(100, Math.max(0, (currentLevelXp / nextLevelXp) * 100));

  return { level, xp, currentLevelXp, nextLevelXp, progressPercent };
}
