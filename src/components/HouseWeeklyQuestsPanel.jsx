import { useCallback, useEffect, useMemo, useState } from 'react';
import { getHouseWeeklyQuests, recordHouseQuestProgress } from '../api/houses';
import { HOUSE_QUEST_TYPES, getKstDateId } from '../utils/houseWeeklyQuests';

const DATE_FORMAT = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'short',
});

const formatDate = (value) => DATE_FORMAT.format(new Date(value));

const remainingTime = (endAt, now) => {
  const remaining = Math.max(0, new Date(endAt).getTime() - now);
  if (remaining === 0) return '이번 주 종료';
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}일 ${hours}시간 남음`;
  const minutes = Math.max(1, Math.ceil(remaining / 60_000));
  return `${hours}시간 ${minutes % 60}분 남음`;
};

export default function HouseWeeklyQuestsPanel({ house, user, onHouseUpdate, onNotice, onCoinReward }) {
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [working, setWorking] = useState('');
  const [activityDate, setActivityDate] = useState(getKstDateId());
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getHouseWeeklyQuests(house.id, user);
      setWeekly(data);
      if (data.houseCoinReward?.rewarded) onCoinReward?.();
      const today = getKstDateId();
      setActivityDate(today >= data.startDate && today <= data.endDate ? today : data.startDate);
    } catch (err) {
      setWeekly(null);
      setError(err.message || '주간 퀘스트를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [house.id, onCoinReward, user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (weekly && now > new Date(weekly.endAt).getTime()) load();
  }, [load, now, weekly]);

  const activityMaxDate = useMemo(() => {
    if (!weekly) return getKstDateId();
    const today = getKstDateId(now);
    return today < weekly.endDate ? today : weekly.endDate;
  }, [now, weekly]);

  const record = async (quest) => {
    if (working) return;
    setWorking(quest.type);
    setError('');
    try {
      const payload = quest.type === HOUSE_QUEST_TYPES.ACTIVE_DAYS
        ? { date: activityDate } : { amount: 1 };
      const result = await recordHouseQuestProgress(house.id, quest.type, payload, user);
      setWeekly(result.weeklyQuests);
      onHouseUpdate(result.house);
      if (result.weeklyQuests.houseCoinReward?.rewarded) onCoinReward?.();
      if (result.rewardGranted > 0) {
        onNotice(`${quest.name} 완료! House XP +${result.rewardGranted}${result.leveledUp ? ` · LV. ${result.house.level} 달성` : ''}`);
      } else if (!result.progressChanged) {
        onNotice(quest.completed ? '이미 완료한 퀘스트입니다.' : '이미 반영된 활동 날짜입니다.');
      } else {
        onNotice(`${quest.name} 진행도를 반영했습니다.`);
      }
    } catch (err) {
      setError(err.message || '퀘스트 진행도를 반영하지 못했습니다.');
    } finally {
      setWorking('');
    }
  };

  return (
    <section className="house-weekly-quests">
      <div className="house-weekly-head">
        <div>
          <span className="house-eyebrow">WEEKLY MISSION</span>
          <h2>이번 주 House Mission</h2>
          {weekly && <p>{formatDate(weekly.startAt)} ~ {formatDate(weekly.endAt)} · 한국 시간</p>}
        </div>
        {weekly && <strong>{remainingTime(weekly.endAt, now)}</strong>}
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
            <div className="house-alert success" role="status">이번 주 House Mission을 모두 완료했습니다!</div>
          )}
          <div className={`house-quest-coin-reward ${weekly.allCompleted ? 'completed' : ''}`}>
            <div>
              <strong>전체 완료 보상</strong>
              <p>{weekly.allCompleted
                ? '완료 시점의 House 멤버에게 개인 HC가 지급됩니다.'
                : '이번 주 퀘스트 3개를 모두 완료하면 멤버마다 HC를 받아요.'}</p>
            </div>
            <div>
              <strong>HC +{weekly.houseCoinReward?.amount ?? 50}</strong>
              <span>{weekly.houseCoinReward?.rewarded
                ? '지급 완료'
                : weekly.allCompleted && !weekly.houseCoinReward?.eligible
                  ? '보상 대상 아님'
                  : weekly.allCompleted ? '지급 확인 중' : `${weekly.quests.filter((quest) => !quest.completed).length}개 남음`}</span>
            </div>
          </div>
          <div className="house-quest-list">
            {weekly.quests.map((quest) => {
              const progress = Math.min(100, Math.max(0, (quest.progress / quest.target) * 100));
              return (
                <article className={`house-quest-card ${quest.completed ? 'completed' : ''}`} key={quest.type}>
                  <div className="house-quest-card-head">
                    <div><h3>{quest.name}</h3><p>{quest.description}</p></div>
                    <span className="ui-tag">{quest.completed
                      ? quest.rewarded ? '완료' : '완료 확인'
                      : `보상 +${quest.rewardXp} XP`}</span>
                  </div>
                  <div className="house-quest-progress-copy">
                    <strong>{quest.progress} / {quest.target}</strong>
                    <span>{quest.rewarded
                      ? `House XP +${quest.rewardXp} 지급 완료`
                      : `완료 보상 House XP +${quest.rewardXp}`}</span>
                  </div>
                  <div className="house-growth-track" role="progressbar" aria-label={`${quest.name} 진행률`}
                       aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress)}>
                    <div style={{ width: `${progress}%` }} />
                  </div>

                  {import.meta.env.DEV && (house.myRole ?? house.myStatus) === 'OWNER' && (
                    <div className="house-quest-dev">
                      <strong>개발 전용 진행도 테스트</strong>
                      {quest.type === HOUSE_QUEST_TYPES.ACTIVE_DAYS ? (
                        <div>
                          <input className="inp" type="date" value={activityDate}
                                 min={weekly.startDate} max={activityMaxDate} disabled={Boolean(working) || quest.rewarded}
                                 onChange={(event) => setActivityDate(event.target.value)} />
                          <button className="ui-btn-secondary ui-btn-sm" type="button"
                                  disabled={Boolean(working) || quest.rewarded} onClick={() => record(quest)}>
                            {working === quest.type ? '반영 중…' : '활동일 추가'}
                          </button>
                        </div>
                      ) : (
                        <button className="ui-btn-secondary ui-btn-sm" type="button"
                                disabled={Boolean(working) || quest.rewarded} onClick={() => record(quest)}>
                          {working === quest.type ? '반영 중…' : '+1 진행'}
                        </button>
                      )}
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
