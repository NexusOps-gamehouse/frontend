import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import './PasswordFinderPage.css';

export default function PasswordFinderPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const resetPassword = async () => {
    if (!email.trim() || !nickname.trim()) {
      alert('이메일과 닉네임을 모두 입력해 주세요.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/users/reset-password', {
        email,
        nickname,
      });

      setTempPassword(data.tempPassword);
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const goLogin = () => {
    navigate('/login');
  };

  return (
    <main className="auth-find-page">
      <div className="auth-find-card">

        <h1>비밀번호 찾기</h1>

        <p className="auth-find-desc">
          가입한 이메일과 닉네임을 입력하면
          임시 비밀번호를 발급해 드립니다.
        </p>

        <input
          className="inp"
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="inp"
          placeholder="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && resetPassword()}
        />

        <button
          type="button"
          className="ui-btn-primary"
          onClick={resetPassword}
          disabled={loading}
        >
          {loading ? '발급 중...' : '임시 비밀번호 발급'}
        </button>

        {tempPassword && (
          <div className="auth-find-result">
            <p>임시 비밀번호</p>

            <strong>{tempPassword}</strong>

            <p
              style={{
                marginTop: '16px',
                fontSize: '14px',
                lineHeight: 1.6,
              }}
            >
              로그인 후 <strong>마이페이지에서 반드시 비밀번호를 변경</strong>
              해주세요.
            </p>

            <div className="auth-find-actions">
              <button
                type="button"
                className="ui-btn-secondary"
                onClick={goLogin}
              >
                로그인으로 이동
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}