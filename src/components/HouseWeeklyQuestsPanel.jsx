import { useCallback, useEffect, useRef, useState } from 'react';
import {
  claimHouseWeeklyXpReward,
  getHouseWeeklyQuests,
  recordHouseQuestProgress,
} from '../api/houses';
import { getKstDateId, HOUSE_QUEST_TYPES } from '../utils/houseWeeklyQuests';

const DATE_FORMAT = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'short',
});

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : DATE_FORMAT.format(date);
};

export default function HouseWeeklyQuestsPanel({
  house, user, useCrewApi = false, onHouseUpdate,
}) {
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [devWorking, setDevWorking] = useState('');
  const mountedRef = useRef(false);

  const load = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError('');
    try {
      const data = await getHouseWeeklyQuests(house.id, user, useCrewApi);
      if (!mountedRef.current) return;
      setWeekly(data);
    } catch (err) {
      if (!mountedRef.current) return;
      setWeekly(null);
      setError(err.message || '주간 퀘스트를 불러오지 못했습니다.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [house.id, useCrewApi, user]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  const claimXpReward = async () => {
    if (!weekly?.allCompleted || weekly.xpReward?.rewarded || claiming || useCrewApi) return;
    setClaiming(true);
    setError('');
    try {
      const result = await claimHouseWeeklyXpReward(house.id, weekly.weekId, user, useCrewApi);
      if (!mountedRef.current) return;
      setWeekly(result.weeklyQuests);
      if (result.house) onHouseUpdate?.(result.house);
    } catch (err) {
      if (mountedRef.current) setError(err.message || 'XP 보상을 받지 못했습니다.');
    } finally {
      if (mountedRef.current) setClaiming(false);
    }
  };

  const recordDevProgress = async (quest) => {
    if (devWorking || !weekly?.isMock || useCrewApi || house.myRole !== 'OWNER') return;
    const key = quest.type || quest.id;
    setDevWorking(key);
    setError('');
    try {
      const payload = quest.type === HOUSE_QUEST_TYPES.ACTIVE_DAYS
        ? { date: getKstDateId(), eventId: `dev-${key}-${Date.now()}` }
        : { amount: 1, eventId: `dev-${key}-${Date.now()}` };
      await recordHouseQuestProgress(house.id, key, payload, user);
      await load();
    } catch (err) {
      if (mountedRef.current) setError(err.message || '개발용 진행도를 기록하지 못했습니다.');
    } finally {
      if (mountedRef.current) setDevWorking('');
    }
  };


  return (
    <section className="house-weekly-quests">
      <div className="house-weekly-head">
        <div>
          <span className="house-eyebrow">WEEKLY MISSION</span>
          <h2>주간 퀘스트</h2>
          {weekly && (
            <p>
              {weekly.isMock ? '개발용 미리보기 · ' : ''}
              {weekly.weekId ? `${weekly.weekId} 주차` : '현재 주차'}
              {formatDate(weekly.startAt) && formatDate(weekly.endAt)
                ? ` · ${formatDate(weekly.startAt)} ~ ${formatDate(weekly.endAt)}` : ''}
            </p>
          )}
        </div>
        {weekly && <strong>{weekly.completedCount} / {weekly.totalCount} 완료</strong>}
      </div>

      {loading && <div className="ui-empty"><p>주간 퀘스트를 불러오는 중…</p></div>}
      {!loading && error && (
        <div className="house-notice-error" role="alert">
          <p>{error}</p>
          <button className="ui-btn-secondary ui-btn-sm" type="button" onClick={load}>다시 시도</button>
        </div>
      )}
      {!loading && !error && weekly?.quests.length === 0 && (
        <div className="ui-empty"><p>이번 주에 제공되는 퀘스트가 없습니다.</p></div>
      )}
      {!loading && !error && weekly?.quests.length > 0 && (
        <>
          {weekly.allCompleted && (
            <div className="house-alert success" role="status">이번 주 퀘스트를 모두 완료했습니다!</div>
          )}
          <div className={`house-quest-coin-reward ${weekly.allCompleted ? 'completed' : ''}`}>
            <div>
              <strong>전체 완료 보상</strong>
              <p>전체 퀘스트 완료 후 서버가 제공한 보상 상태를 표시합니다.</p>
            </div>
            <div>
              <strong>HC {weekly.reward.amount}</strong>
              <span>{weekly.reward.rewarded
                ? '지급 완료'
                : weekly.allCompleted ? '지급 확인 중' : '전체 완료 시 지급'}</span>
            </div>
          </div>
          <div className={`house-quest-coin-reward house-quest-xp-reward ${weekly.allCompleted ? 'completed' : ''}`}>
            <div>
              <strong>주간 XP 보상</strong>
              <p>네 가지 퀘스트를 모두 완료하면 한 주에 한 번 받을 수 있습니다.</p>
            </div>
            <div>
              <strong>+{weekly.xpReward.amount} XP</strong>
              {weekly.xpReward.rewarded ? (
                <span>XP 보상 수령 완료</span>
              ) : (
                <button className="ui-btn-primary ui-btn-sm" type="button"
                        disabled={!weekly.allCompleted || claiming || useCrewApi}
                        onClick={claimXpReward}>
                  {claiming ? '받는 중…' : useCrewApi ? 'Crew API 준비 중' : weekly.allCompleted ? 'XP 보상 받기' : '전체 완료 시 활성화'}
                </button>
              )}
            </div>
          </div>
          <div className="house-quest-list">
            {weekly.quests.map((quest) => {
              const progress = quest.target > 0
                ? Math.min(100, Math.max(0, (quest.current / quest.target) * 100)) : 0;
              return (
                <article className={`house-quest-card ${quest.completed ? 'completed' : ''}`} key={quest.id}>
                  <div className="house-quest-card-head">
                    <div><h3>{quest.title}</h3><p>{quest.description}</p></div>
                    <span className="ui-tag">{quest.completed
                      ? '완료' : '진행 중'}</span>
                  </div>
                  <div className="house-quest-progress-copy">
                    <strong>{quest.current} / {quest.target}</strong>
                    <span>{quest.completed ? '목표 달성' : '진행 중'}</span>
                  </div>
                  <div className="house-growth-track" role="progressbar" aria-label={`${quest.title} 진행률`}
                       aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress)}>
                    <div style={{ width: `${progress}%` }} />
                  </div>
                  {import.meta.env.DEV && weekly.isMock && !useCrewApi && house.myRole === 'OWNER' && !quest.completed && (
                    <div className="house-quest-dev">
                      <strong>DEV 진행도 도구</strong>
                      <button className="ui-btn-secondary ui-btn-sm" type="button"
                              disabled={Boolean(devWorking)} onClick={() => recordDevProgress(quest)}>
                        {devWorking === (quest.type || quest.id) ? '기록 중…' : '+1 기록'}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
