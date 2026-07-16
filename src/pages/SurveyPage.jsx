import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Chips, { MultiChips } from '../components/Chips';
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
  const [error, setError] = useState('');

  const next = () => {
    if (!game || !playStyle || !position) {
      setError('게임, 성향, 포지션을 선택해주세요.');
      return;
    }
    Object.assign(signupStore, {
      gender, ageRange, game, playStyle, position, mic, tier,
      playTimes, gameModes, riotNickname,
    });
    navigate('/signup/confirm');
  };

  return (
    <div className="page">
      <div className="center">
        <p className="h2">몇 가지만 알려주세요 <span className="meta">2 / 3</span></p>

        <p className="q">성별</p>
        <Chips options={['남', '여', '비공개']} value={gender} onChange={setGender} />

        <p className="q">나이대 (모호하게)</p>
        <Chips options={['10대', '20대', '30대 이상', '비공개']} value={ageRange} onChange={setAgeRange} />

        <p className="q">하는 게임</p>
        <Chips options={GAMES} value={game} onChange={setGame} />

        <p className="q">주로 하는 게임 모드 (복수 선택)</p>
        <MultiChips options={GAME_MODES} values={gameModes} onChange={setGameModes} />

        <p className="q">게임 성향</p>
        <Chips options={['빡겜', '즐겜']} value={playStyle} onChange={setPlayStyle} />

        <p className="q">주 포지션</p>
        <Chips options={POSITIONS} value={position} onChange={setPosition} />

        <p className="q">주로 플레이하는 시간대 (복수 선택)</p>
        <MultiChips options={PLAY_TIMES} values={playTimes} onChange={setPlayTimes} />

        <p className="q">마이크 여부</p>
        <div className="row">
          <button type="button" className={`chip ${mic ? 'on' : ''}`} onClick={() => setMic(true)}>마이크 O</button>
          <button type="button" className={`chip ${!mic ? 'on' : ''}`} onClick={() => setMic(false)}>마이크 X</button>
        </div>

        <p className="q">티어 (선택)</p>
        <Chips options={TIERS} value={tier} onChange={setTier} />

        <p className="q">롤 인게임 닉네임 (선택)</p>
        <input className="inp" type="text" placeholder="예: Hide on bush#KR1"
               value={riotNickname} onChange={(e) => setRiotNickname(e.target.value)} />

        {error && <p className="error-msg">{error}</p>}
        <button className="btn" style={{ marginTop: 8 }} onClick={next}>다음 → 프로필 확인</button>
      </div>
    </div>
  );
}
