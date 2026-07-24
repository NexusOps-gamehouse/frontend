import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/Gamehouse-Logo.png';
import pointLogo from '../assets/Gamehouse-Pont.png';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { data } = await api.post('/auth/login', {
        email,
        password,
      });

      login(data.token, data.user);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(errMsg(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <form onSubmit={submit}>
          <img src={logo} alt="Game House" className="logo" />
          <img
            src={pointLogo}
            alt="Game House 포인트 로고"
            className="logo-point"
          />

          <h1 className="welcome-title">환영합니다!</h1>
          <p className="welcome-text">친구를 찾으러 오셨군요.</p>

          <div className="input-group">
            <Mail size={18} />
            <input
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword ? '비밀번호 숨기기' : '비밀번호 표시'
              }
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="login-btn"
            type="submit"
            disabled={submitting}
          >
            {submitting ? '로그인 중…' : '로그인'}
          </button>

          <div className="bottom-menu">
            <Link to="/signup">회원가입</Link>

            <span>|</span>

            <Link to="/find-id">아이디 찾기</Link>

            <span>|</span>

            <Link to="/find-password">비밀번호 찾기</Link>
          </div>
        </form>
      </div>
    </div>
  );
}