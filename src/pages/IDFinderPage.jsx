import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import './IDFinderPage.css';

export default function IDFinderPage() {
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const findEmail = async () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해 주세요.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.get('/users/find-email', {
        params: {
          nickname,
        },
      });

      setEmail(data.email);
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
  <main className="auth-find-page">
    <div className="auth-find-card">

      <h1>아이디 찾기</h1>

      <p className="auth-find-desc">
        가입한 닉네임을 입력하면
        이메일을 확인할 수 있습니다.
      </p>

      <input
        className="inp"
        placeholder="닉네임"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && findEmail()}
      />

      <button
        type="button"
        className="ui-btn-primary"
        onClick={findEmail}
        disabled={loading}
      >
        {loading ? '조회 중...' : '이메일 찾기'}
      </button>

      {email && (
        <div className="auth-find-result">
          <p>가입된 이메일</p>
          <strong>{email}</strong>

          <div className="auth-find-actions">
            <button
              type="button"
              className="ui-btn-secondary"
              onClick={() => navigate('/login')}
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