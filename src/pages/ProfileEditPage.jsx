import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Chips, { MultiChips } from '../components/Chips';
import { GAMES, GAME_MODES, POSITIONS, TIERS, PLAY_TIMES } from '../constants';
import { csv } from '../utils';

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [gender, setGender] = useState(user?.gender || '비공개');
  const [ageRange, setAgeRange] = useState(user?.ageRange || '비공개');
  const [game, setGame] = useState(user?.game || '');
  const [playStyle, setPlayStyle] = useState(user?.playStyle || '');
  const [position, setPosition] = useState(user?.position || '');
  const [mic, setMic] = useState(user?.mic ?? true);
  const [tier, setTier] = useState(user?.tier || '');
  const [playTimes, setPlayTimes] = useState(csv(user?.playTimes));
  const [gameModes, setGameModes] = useState(csv(user?.gameModes));
  const [riotNickname, setRiotNickname] = useState(user?.riotNickname || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.put('/users/me', {
        nickname, gender, ageRange, game, playStyle, position, mic, tier,
        playTimes: playTimes.join(','),
        gameModes: gameModes.join(','),
        riotNickname,
      });
      updateUser(data);
      navigate('/mypage');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="center">
        <p className="h2">프로필 수정</p>

        <p className="q">닉네임</p>
        <input className="inp" value={nickname} onChange={(e) => setNickname(e.target.value)} />

        <p className="q">성별</p>
        <Chips options={['남', '여', '비공개']} value={gender} onChange={setGender} />

        <p className="q">나이대</p>
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

        <p className="q">티어</p>
        <Chips options={TIERS} value={tier} onChange={setTier} />

        <p className="q">롤 인게임 닉네임</p>
        <input className="inp" placeholder="예: Hide on bush#KR1"
               value={riotNickname} onChange={(e) => setRiotNickname(e.target.value)} />

        {error && <p className="error-msg">{error}</p>}
        <div className="flex" style={{ marginTop: 12 }}>
          <button className="btn2" style={{ flex: 1 }} onClick={() => navigate('/mypage')}>취소</button>
          <button className="btn" style={{ flex: 2 }} onClick={save} disabled={loading}>
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
