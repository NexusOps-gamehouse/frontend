import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Chips, { MultiChips } from '../components/Chips';
import StepIndicator from '../components/StepIndicator';
import { GAMES, GAME_MODES, POSITIONS, TIERS, PLAY_TIMES } from '../constants';
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
  const [gameModes, setGameModes] = useState(signupStore.gameModes);
  const [riotNickname, setRiotNickname] = useState(signupStore.riotNickname);

  const canSubmit =
    gender && ageRange && game && playStyle && position && mic !== null &&
    gameModes.length > 0 && playTimes.length > 0;

  // 현재 선택값을 임시 저장 (이전/다음 이동 시 유지)
  const persist = () => Object.assign(signupStore, {
    gender, ageRange, game, playStyle, position, mic, tier,
    playTimes, gameModes, riotNickname,
  });

  const prev = () => { persist(); navigate('/signup'); };

  const next = () => {
    if (!canSubmit) return;
    persist();
    navigate('/signup/confirm');
  };

  return (
    <div className="page">
      <div className="center">
        <p className="h2">몇 가지만 알려주세요 <span className="meta">2 / 3</span></p>
        <StepIndicator current={2} total={3} />

        <p className="q">성별 <span className="req">*</span></p>
        <Chips options={['남', '여', '비공개']} value={gender} onChange={setGender} />

        <p className="q">나이대 <span className="req">*</span></p>
        <Chips options={['10대', '20대', '30대 이상', '비공개']} value={ageRange} onChange={setAgeRange} />

        <p className="q">하는 게임 <span className="req">*</span></p>
        <Chips options={GAMES} value={game} onChange={setGame} />

        <p className="q">주로 하는 게임 모드 (복수 선택) <span className="req">*</span></p>
        <MultiChips options={GAME_MODES} values={gameModes} onChange={setGameModes} />

        <p className="q">게임 성향 <span className="req">*</span></p>
        <Chips options={['빡겜', '즐겜']} value={playStyle} onChange={setPlayStyle} />

        <p className="q">주 포지션 <span className="req">*</span></p>
        <Chips options={POSITIONS} value={position} onChange={setPosition} />

        <p className="q">주로 플레이하는 시간대 (복수 선택) <span className="req">*</span></p>
        <MultiChips options={PLAY_TIMES} values={playTimes} onChange={setPlayTimes} />

        <p className="q">마이크 여부 <span className="req">*</span></p>
        <Chips options={['마이크 O', '마이크 X']}
               value={mic === null ? '' : mic ? '마이크 O' : '마이크 X'}
               onChange={(v) => setMic(v === '' ? null : v === '마이크 O')} />

        <p className="q">티어 (선택)</p>
        <Chips options={TIERS} value={tier} onChange={setTier} />

        <p className="q">롤 인게임 닉네임 (선택)</p>
        <input className="inp" type="text" placeholder="예: Hide on bush#KR1"
               value={riotNickname} onChange={(e) => setRiotNickname(e.target.value)} />

        <div className="flex" style={{ marginTop: 16 }}>
          <button className="btn2 signup-lift" style={{ flex: 1, height: 48, borderRadius: 'var(--radius-md)' }}
                  onClick={prev}>이전</button>
          <button className="ui-btn-primary" style={{ flex: 1, height: 48, fontSize: 13, fontWeight: 600 }}
                  onClick={next} disabled={!canSubmit}>다음 → 프로필 확인</button>
        </div>
      </div>
    </div>
  );
}
