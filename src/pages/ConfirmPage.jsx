import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { signupStore, resetSignupStore } from '../signupStore';

export default function ConfirmPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const s = signupStore;

  const tags = [
    s.playStyle && `#${s.playStyle === '빡겜' ? '빡겜러' : '즐겜러'}`,
    s.mic ? '#마이크O' : '#마이크X',
    s.ageRange !== '비공개' && `#${s.ageRange}`,
  ].filter(Boolean);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('email', s.email);
      form.append('password', s.password);
      form.append('nickname', s.nickname);
      form.append('gender', s.gender);
      form.append('ageRange', s.ageRange);
      form.append('game', s.game);
      form.append('playStyle', s.playStyle);
      form.append('position', s.position);
      form.append('mic', s.mic);
      form.append('tier', s.tier);
      form.append('playTimes', s.playTimes.join(','));
      form.append('gameModes', s.gameModes.join(','));
      form.append('riotNickname', s.riotNickname);
      if (s.imageFile) form.append('image', s.imageFile);

      const { data } = await api.post('/auth/signup', form);
      login(data.token, data.user);
      resetSignupStore();
      navigate('/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="center">
        <p className="h2">이대로 만들까요? <span className="meta">3 / 3</span></p>
        <div className="card">
          <div className="flex" style={{ marginBottom: 12 }}>
            <div className="av lg">
              {s.imagePreview ? <img src={s.imagePreview} alt="프로필" /> : (s.nickname?.[0] || '?')}
            </div>
            <div>
              <div className="name">{s.nickname}</div>
              <div className="meta">{[s.game, s.position, s.tier].filter(Boolean).join(' · ')}</div>
            </div>
          </div>
          <div className="row" style={{ marginBottom: 0 }}>
            {tags.map((t) => <span key={t} className="tag">{t}</span>)}
          </div>
          {(s.playTimes.length > 0 || s.gameModes.length > 0 || s.riotNickname) && (
            <div className="meta" style={{ marginTop: 10 }}>
              {s.gameModes.length > 0 && <div>주 모드: {s.gameModes.join(', ')}</div>}
              {s.playTimes.length > 0 && <div>주 시간대: {s.playTimes.join(', ')}</div>}
              {s.riotNickname && <div>롤 닉네임: {s.riotNickname}</div>}
            </div>
          )}
        </div>
        {error && <p className="error-msg">{error}</p>}
        <div className="flex" style={{ marginTop: 16 }}>
          <button className="btn2" style={{ flex: 1 }} onClick={() => navigate('/signup/survey')}>수정</button>
          <button className="btn" style={{ flex: 1 }} onClick={submit} disabled={loading}>
            {loading ? '생성 중...' : '확인 → 계정생성 완료'}
          </button>
        </div>
      </div>
    </div>
  );
}
