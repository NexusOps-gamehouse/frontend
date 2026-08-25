import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Chips, { MultiChips } from '../components/Chips';
import { ANY, GAMES, GAME_MODES, POSITIONS, TIERS, PLAY_TIMES, PLAY_DAYS,
         PLAY_DURATIONS, AGE_MIN, AGE_MAX } from '../constants';
import { csv } from '../utils';
import Avatar from '../components/Avatar';
import './ProfileEditPage.css';

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || '');
  // [FR-01] 성별은 민감정보라 더 이상 보관하지 않는다. 나이대는 숫자 나이로 바뀌었다.
  const [age, setAge] = useState(user?.age ?? '');
  const [game, setGame] = useState(user?.game || '');
  const [playStyle, setPlayStyle] = useState(user?.playStyle || '');
  const [position, setPosition] = useState(user?.position || '');
  const [mic, setMic] = useState(user?.mic ?? true);
  const [tier, setTier] = useState(user?.tier || '');
  const [playTimes, setPlayTimes] = useState(csv(user?.playTimes));
  const [gameModes, setGameModes] = useState(csv(user?.gameModes));
  const [playDays, setPlayDays] = useState(csv(user?.playDays));
  const [playDuration, setPlayDuration] = useState(user?.playDuration || '');
  
  // 하단 입력란에서 사용되는 상태값이 누락되어 있어 추가했습니다.
  const [riotNickname, setRiotNickname] = useState(user?.riotNickname || '');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.put('/users/me', {
        nickname, game, playStyle, position, mic, tier,
        age: age === '' ? null : Number(age),
        playTimes: playTimes.join(','),
        playDays: playDays.join(','),
        playDuration,
        gameModes: gameModes.join(','),
        riotNickname, // 저장 페이로드에도 추가
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
    <main className="profile-edit-page">
      <div className="profile-edit-shell">
        <header className="profile-edit-header">
          <p className="profile-edit-eyebrow">MY GAME HOUSE</p>
          <h1>프로필 수정</h1>
          <p>함께 게임할 파티원에게 나를 소개해 보세요.</p>
        </header>

        <section className="profile-edit-card profile-edit-identity" aria-label="기본 프로필">
          <div className="profile-edit-avatar"><Avatar user={{ ...user, nickname }} size="lg" /></div>
          <div>
            <strong>{nickname || '닉네임을 입력해 주세요'}</strong>
            <p>프로필 정보는 모집글과 파티원에게 표시됩니다.</p>
          </div>
        </section>

        {/* 01. 기본 정보 섹션 */}
        <section className="profile-edit-card">
          <div className="profile-edit-section-title">
            <span>01</span>
            <div>
              <h2>기본 정보</h2>
              <p>나를 알아볼 수 있는 정보를 설정해 주세요.</p>
            </div>
          </div>
          <label className="profile-edit-field">닉네임
            <input className="inp" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </label>
          <label className="profile-edit-field">나이
            <input className="inp age-inp" type="number" inputMode="numeric"
                   min={AGE_MIN} max={AGE_MAX} placeholder="예: 24"
                   value={age} onChange={(e) => setAge(e.target.value)} />
          </label>
        </section>

        {/* 02. 게임 스타일 섹션 */}
        <section className="profile-edit-card">
          <div className="profile-edit-section-title">
            <span>02</span>
            <div>
              <h2>게임 스타일</h2>
              <p>나와 잘 맞는 파티를 더 쉽게 찾을 수 있어요.</p>
            </div>
          </div>
          
          <div className="profile-edit-choice">
            <p>하는 게임</p>
            <Chips options={GAMES} value={game} onChange={setGame} />
          </div>
          <div className="profile-edit-choice">
            <p>주로 하는 게임 모드 <em>복수 선택</em></p>
            <MultiChips options={GAME_MODES} values={gameModes} onChange={setGameModes} />
          </div>
          
          <div className="profile-edit-grid">
            <div className="profile-edit-choice">
              <p>게임 성향</p>
              <Chips options={['빡겜', '즐겜']} value={playStyle} onChange={setPlayStyle} />
            </div>
            <div className="profile-edit-choice">
              <p>주 포지션</p>
              <Chips options={POSITIONS} value={position} onChange={setPosition} />
            </div>
          </div>
          
          <div className="profile-edit-choice">
            <p>주로 플레이하는 시간대 <em>복수 선택</em></p>
            <MultiChips options={PLAY_TIMES} values={playTimes} onChange={setPlayTimes} />
          </div>

          <div className="profile-edit-choice">
            <p>주로 플레이하는 요일 <em>복수 선택</em></p>
            <MultiChips options={PLAY_DAYS} values={playDays} onChange={setPlayDays} exclusive={ANY} />
          </div>

          <div className="profile-edit-choice">
            <p>한 번 플레이할 때 선호하는 분량</p>
            <Chips options={PLAY_DURATIONS} value={playDuration} onChange={setPlayDuration} />
          </div>
          
          <div className="profile-edit-grid">
            <div className="profile-edit-choice">
              <p>마이크 여부</p>
              <div className="row">
                <button type="button" className={`chip ${mic ? 'on' : ''}`} onClick={() => setMic(true)}>마이크 O</button>
                <button type="button" className={`chip ${!mic ? 'on' : ''}`} onClick={() => setMic(false)}>마이크 X</button>
              </div>
            </div>
            <div className="profile-edit-choice">
              <p>티어</p>
              <Chips options={TIERS} value={tier} onChange={setTier} />
            </div>
          </div>

          {/* 질문자님이 추가하려던 안내 문구를 새 UI에 맞춰 통합 */}
          <div className="profile-edit-choice" style={{ marginTop: '16px' }}>
            <p>롤 계정</p>
            <p className="field-hint" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              게임 계정 연동은 마이페이지에서 할 수 있어요.
            </p>
          </div>

          <label className="profile-edit-field">롤 인게임 닉네임
            <input className="inp" placeholder="예: Hide on bush#KR1" value={riotNickname} onChange={(e) => setRiotNickname(e.target.value)} />
          </label>
        </section>

        {error && <p className="profile-edit-error" role="alert">{error}</p>}
        
        <footer className="profile-edit-actions">
          <button type="button" className="ui-btn-secondary" onClick={() => navigate('/mypage')}>취소</button>
          <button type="button" className="ui-btn-primary" onClick={save} disabled={loading}>
            {loading ? '저장 중…' : '변경 사항 저장'}
          </button>
        </footer>
      </div>
    </main>            
  );
}