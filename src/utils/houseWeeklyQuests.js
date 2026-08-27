const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const HOUSE_QUEST_TYPES = {
  WINS: 'WINS',
  GROUP_GAMES: 'GROUP_GAMES',
  ACTIVE_DAYS: 'ACTIVE_DAYS',
  SCHEDULE_PARTICIPATION: 'SCHEDULE_PARTICIPATION',
};

export const HOUSE_WEEKLY_QUESTS = [
  {
    type: HOUSE_QUEST_TYPES.WINS,
    name: '공동 승리',
    description: 'House 멤버들이 이번 주에 함께 7승을 달성해요.',
    target: 7,
    rewardXp: 200,
  },
  {
    type: HOUSE_QUEST_TYPES.GROUP_GAMES,
    name: '함께 플레이',
    description: 'House 멤버 2명 이상이 함께 참여한 게임을 5회 완료해요.',
    target: 5,
    rewardXp: 150,
  },
  {
    type: HOUSE_QUEST_TYPES.ACTIVE_DAYS,
    name: '활동 일수',
    description: '서로 다른 3일에 House 멤버들과 함께 게임해요.',
    target: 3,
    rewardXp: 150,
  },
  {
    type: HOUSE_QUEST_TYPES.SCHEDULE_PARTICIPATION,
    name: 'House 일정 참여',
    description: 'House 게임 일정에 참여하고 플레이를 완료하세요.',
    target: 3,
  },
];

const dateValue = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const formatShiftedDate = (timestamp) => {
  const shifted = new Date(timestamp + KST_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function getKstDateId(value = Date.now()) {
  return formatShiftedDate(dateValue(value).getTime());
}

export function getKstWeek(value = Date.now()) {
  const now = dateValue(value);
  const shifted = new Date(now.getTime() + KST_OFFSET_MS);
  const daysFromMonday = (shifted.getUTCDay() + 6) % 7;
  const mondayAsUtc = Date.UTC(
    shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() - daysFromMonday,
  );
  const startTimestamp = mondayAsUtc - KST_OFFSET_MS;
  const endTimestamp = startTimestamp + (7 * DAY_MS) - 1;
  return {
    weekId: formatShiftedDate(startTimestamp),
    startAt: new Date(startTimestamp).toISOString(),
    endAt: new Date(endTimestamp).toISOString(),
    startDate: formatShiftedDate(startTimestamp),
    endDate: formatShiftedDate(endTimestamp),
  };
}

const safeCount = (value) => Number.isSafeInteger(value) && value >= 0 ? value : 0;

const emptyWeekState = () => ({
  progress: { WINS: 0, GROUP_GAMES: 0, ACTIVE_DAYS: [], SCHEDULE_PARTICIPATION: 0 },
  rewarded: { WINS: false, GROUP_GAMES: false, ACTIVE_DAYS: false, SCHEDULE_PARTICIPATION: false },
});

export function normalizeWeeklyQuestHistory(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([weekId, state]) => {
    const week = getKstWeek(`${weekId}T00:00:00+09:00`);
    if (week.weekId !== weekId || !state || typeof state !== 'object') return [];
    const activeDays = [...new Set(Array.isArray(state.progress?.ACTIVE_DAYS)
      ? state.progress.ACTIVE_DAYS.filter((date) => (
        typeof date === 'string' && date >= week.startDate && date <= week.endDate
      )) : [])].sort();
    return [[weekId, {
      progress: {
        WINS: safeCount(state.progress?.WINS),
        GROUP_GAMES: safeCount(state.progress?.GROUP_GAMES),
        ACTIVE_DAYS: activeDays,
        SCHEDULE_PARTICIPATION: safeCount(state.progress?.SCHEDULE_PARTICIPATION),
      },
      rewarded: {
        WINS: state.rewarded?.WINS === true,
        GROUP_GAMES: state.rewarded?.GROUP_GAMES === true,
        ACTIVE_DAYS: state.rewarded?.ACTIVE_DAYS === true,
        SCHEDULE_PARTICIPATION: state.rewarded?.SCHEDULE_PARTICIPATION === true,
      },
    }]];
  }));
}

export function ensureWeeklyQuestState(history, value = Date.now()) {
  const week = getKstWeek(value);
  if (!history[week.weekId]) history[week.weekId] = emptyWeekState();
  return { week, state: history[week.weekId] };
}

export function weeklyQuestView(state, week) {
  const quests = HOUSE_WEEKLY_QUESTS.map((quest) => {
    const rawProgress = quest.type === HOUSE_QUEST_TYPES.ACTIVE_DAYS
      ? state.progress.ACTIVE_DAYS.length : state.progress[quest.type] ?? 0;
    const progress = Math.min(quest.target, Math.max(0, rawProgress));
    return {
      ...quest,
      progress,
      completed: progress >= quest.target,
      rewarded: state.rewarded[quest.type] === true,
    };
  });
  return {
    ...week,
    quests,
    allCompleted: quests.every((quest) => quest.completed),
  };
}

export function isDateInKstWeek(dateId, week) {
  return typeof dateId === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateId)
    && dateId >= week.startDate && dateId <= week.endDate;
}
