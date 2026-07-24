import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/client';

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

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>비밀번호 찾기</h1>

        {!tempPassword ? (
          <>
            <input
              className="inp"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="inp"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />

            <button
              className="ui-btn-primary"
              onClick={resetPassword}
              disabled={loading}
            >
              {loading ? '발급 중...' : '임시 비밀번호 발급'}
            </button>
          </>
        ) : (
          <>
            <h3>임시 비밀번호</h3>

            <h2>{tempPassword}</h2>

            <p>
              로그인 후 마이페이지에서 반드시 비밀번호를 변경해 주세요.
            </p>

            <button
              className="ui-btn-primary"
              onClick={() => navigate('/login')}
            >
              로그인하기
            </button>
          </>
        )}
      </div>
    </main>
  );
}