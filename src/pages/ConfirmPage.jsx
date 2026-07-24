import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { signupStore, resetSignupStore } from '../signupStore';
import StepIndicator from '../components/StepIndicator';
import TierBadge from '../components/TierBadge';
import { formatRiotId } from '../api/riot';

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
      form.append('name', s.name);       // 백엔드 필드명 확정되면 여기만 수정
      form.append('phone', s.phone);
      form.append('gender', s.gender);
      form.append('ageRange', s.ageRange);
      form.append('game', s.game);
      form.append('playStyle', s.playStyle);
      form.append('position', s.position);
      form.append('mic', s.mic);
      form.append('tier', s.tier);
      form.append('playTimes', s.playTimes.join(','));
      form.append('playDays', s.playDays.join(','));

      // 라이엇 계정은 이름/태그로 나눠 보낸다.
      // 티어·숙련도 저장은 백엔드가 signup 트랜잭션 안에서 직접 조회해 처리해야 한다.
      // (프론트가 보낸 값을 그대로 믿고 저장하면 위조가 가능하다)
      if (s.riotGameName) {
        form.append('gameName', s.riotGameName);
        form.append('tagLine', s.riotTagLine);
      }
      form.append('gameModes', s.gameModes.join(','));
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
        <StepIndicator current={3} total={3} />
        <div className="card">
          <div className="flex" style={{ marginBottom: 12 }}>
            <div className="av lg">
              {s.imagePreview ? <img src={s.imagePreview} alt="프로필" /> : (s.nickname?.[0] || '?')}
            </div>
            <div>
              <div className="name">{s.nickname}</div>
              <div className="meta" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>{[s.game, s.position].filter(Boolean).join(' · ')}</span>
                <TierBadge user={{ tier: s.tier }} height={20} />
              </div>
            </div>
          </div>
          <div className="row" style={{ marginBottom: 0 }}>
            {tags.map((t) => <span key={t} className="tag">{t}</span>)}
          </div>
          {(s.playTimes.length > 0 || s.playDays.length > 0 || s.gameModes.length > 0) && (
            <div className="meta" style={{ marginTop: 10 }}>
              {s.gameModes.length > 0 && <div>주 모드: {s.gameModes.join(', ')}</div>}
              {s.playDays.length > 0 && <div>주 요일: {s.playDays.join(', ')}</div>}
              {s.playTimes.length > 0 && <div>주 시간대: {s.playTimes.join(', ')}</div>}
              {s.name && <div>이름: {s.name}</div>}
              {s.phone && <div>연락처: {s.phone}</div>}
              {s.riotGameName && <div>롤 계정: {formatRiotId(s.riotGameName, s.riotTagLine)}</div>}
            </div>
          )}
        </div>
        {error && <p className="error-msg">{error}</p>}
        <div className="flex" style={{ marginTop: 16 }}>
          <button className="btn2 signup-lift" style={{ flex: 1, height: 48, borderRadius: 'var(--radius-md)' }} onClick={() => navigate('/signup/survey')}>이전</button>
          <button className="ui-btn-primary" style={{ flex: 1, height: 48, fontSize: 13, fontWeight: 600 }}
                  onClick={submit} disabled={loading}>
            {loading ? '생성 중...' : '계정생성'}
          </button>
        </div>
      </div>
    </div>
  );
}
