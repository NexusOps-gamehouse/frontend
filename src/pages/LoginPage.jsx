import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
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
        <p className="h2">로그인</p>
        <form onSubmit={submit}>
          <input className="inp" type="email" placeholder="이메일"
                 value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="inp" type="password" placeholder="비밀번호"
                 value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="error-msg">{error}</p>}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <div className="flex" style={{ justifyContent: 'center', marginTop: 14 }}>
          <button className="textlink" onClick={() => navigate('/signup')}>회원가입</button>
          <button className="textlink" onClick={() => alert('준비 중인 기능입니다.')}>아이디 찾기</button>
          <button className="textlink" onClick={() => alert('준비 중인 기능입니다.')}>비밀번호 찾기</button>
        </div>
      </div>
    </div>
  );
}
