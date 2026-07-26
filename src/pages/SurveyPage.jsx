import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Chips, { MultiChips } from '../components/Chips';
import TierIcon from '../components/icons/TierIcon';
import StepIndicator from '../components/StepIndicator';
import { ANY, GAMES, GAME_MODES, POSITIONS, TIERS, PLAY_TIMES, PLAY_DAYS } from '../constants';
import { signupStore } from '../signupStore';

export default function SurveyPage() {
  const navigate = useNavigate();

  const [gender, setGender] = useState(signupStore.gender);
  const [ageRange, setAgeRange] = useState(signupStore.ageRange);
  const [game, setGame] = useState(signupStore.game);
  const [playStyle, setPlayStyle] = useState(signupStore.playStyle);
  const [position, setPosition] = useState(signupStore.position);
  const [mic, setMic] = useState(signupStore.mic);
  const [tier, setTier] = useState(signupStore.tier);
  const [playTimes, setPlayTimes] = useState(signupStore.playTimes);
  const [playDays, setPlayDays] = useState(signupStore.playDays);
  const [gameModes, setGameModes] = useState(signupStore.gameModes);

  const canSubmit =
    gender && ageRange && game && playStyle && position && mic !== null &&
    gameModes.length > 0 && playDays.length > 0 && playTimes.length > 0;

  // 현재 선택값을 임시 저장 (이전/다음 이동 시 유지)
  const persist = () => Object.assign(signupStore, {
    gender, ageRange, game, playStyle, position, mic, tier,
    playTimes, playDays, gameModes,
  });

  const prev = () => { persist(); navigate('/signup'); };

  const next = () => {
    if (!canSubmit) return;
    persist();
    navigate('/signup/confirm');
  };

  return (
    <div className="page">
      <div className="survey">
        <p className="h2">몇 가지만 알려주세요 <span className="meta">2 / 3</span></p>
        <StepIndicator current={2} total={3} />

        <div className="survey-grid">
          <div className="qb">
            <p className="q">성별 <span className="req">*</span></p>
            <Chips options={['남', '여', '비공개']} value={gender} onChange={setGender} />
          </div>

          <div className="qb">
            <p className="q">나이대 <span className="req">*</span></p>
            <Chips options={['10대', '20대', '30대 이상', '비공개']} value={ageRange} onChange={setAgeRange} />
          </div>

          <div className="qb">
            <p className="q">하는 게임 <span className="req">*</span></p>
            <Chips options={GAMES} value={game} onChange={setGame} />
          </div>

          <div className="qb">
            <p className="q">주로 하는 게임 모드 (복수 선택) <span className="req">*</span></p>
            <MultiChips options={GAME_MODES} values={gameModes} onChange={setGameModes} />
          </div>

          <div className="qb">
            <p className="q">주 포지션 <span className="req">*</span></p>
            <Chips options={POSITIONS} value={position} onChange={setPosition} />
          </div>

          <div className="qb">
            <p className="q">게임 성향 <span className="req">*</span></p>
            <Chips options={['빡겜', '즐겜']} value={playStyle} onChange={setPlayStyle} />
          </div>

          <div className="qb">
            <p className="q">마이크 여부 <span className="req">*</span></p>
            <Chips options={['마이크 O', '마이크 X']}
                   value={mic === null ? '' : mic ? '마이크 O' : '마이크 X'}
                   onChange={(v) => setMic(v === '' ? null : v === '마이크 O')} />
          </div>

          <div className="qb">
            <p className="q">주로 플레이하는 시간대 (복수 선택) <span className="req">*</span></p>
            <MultiChips options={PLAY_TIMES} values={playTimes} onChange={setPlayTimes} />
          </div>

          <div className="qb full">
            <p className="q">주로 플레이하는 요일 (복수 선택) <span className="req">*</span></p>
            <MultiChips options={PLAY_DAYS} values={playDays} onChange={setPlayDays} exclusive={ANY} />
          </div>

          <div className="qb full">
            <p className="q">티어 (선택)</p>
            <Chips options={TIERS} value={tier} onChange={setTier}
                   renderIcon={(o) => <TierIcon name={o} />} />
          </div>
        </div>

        {/* 배치를 인라인으로 둔다 — styles.css의 .survey-actions 규칙이 없어도 가로로 유지 */}
        <div className="survey-actions"
             style={{ display: 'flex', gap: 12, maxWidth: 480, margin: '12px auto 0' }}>
          <button type="button" className="btn2 signup-lift"
                  style={{ flex: '0 0 108px', height: 48, fontSize: 14, fontWeight: 600,
                           borderRadius: 'var(--radius-md)' }}
                  onClick={prev}>이전</button>
          <button type="button" className="ui-btn-primary"
                  style={{ flex: 1, height: 48, fontSize: 14, fontWeight: 600 }}
                  onClick={next} disabled={!canSubmit}>다음 → 프로필 확인</button>
        </div>
      </div>
    </div>
  );
}
