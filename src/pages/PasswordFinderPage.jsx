import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import { formatPhone, isValidPhone } from '../utils';
import './PasswordFinderPage.css';

export default function PasswordFinderPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [changed, setChanged] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetPassword = async () => {
    if (!email.trim() || !name.trim() || !phone.trim() || !newPassword || !passwordConfirm) {
      alert('모든 항목을 입력해 주세요.');
      return;
    }
    if (!isValidPhone(phone)) {
      alert('올바른 휴대폰 번호가 아닙니다.');
      return;
    }
    if (newPassword.length < 4) {
      alert('비밀번호는 4자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== passwordConfirm) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/users/reset-password', {
        email,
        name,
        phone,
        newPassword,
        newPasswordConfirm: passwordConfirm,
      });

      setChanged(true);
      alert(data.message || '비밀번호가 변경되었습니다.');
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
          가입한 이메일과 이름, 전화번호를 확인한 뒤
          새로운 비밀번호로 변경합니다.
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
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="inp"
          type="tel"
          placeholder="전화번호"
          autoComplete="tel"
          inputMode="numeric"
          maxLength={13}
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
        />

        <input
          className="inp"
          type="password"
          placeholder="새 비밀번호 (4자 이상)"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); setChanged(false); }}
        />

        <input
          className="inp"
          type="password"
          placeholder="새 비밀번호 확인"
          value={passwordConfirm}
          onChange={(e) => { setPasswordConfirm(e.target.value); setChanged(false); }}
          onKeyDown={(e) => e.key === 'Enter' && resetPassword()}
        />

        <button
          type="button"
          className="ui-btn-primary"
          onClick={resetPassword}
          disabled={loading}
        >
          {loading ? '변경 중...' : '비밀번호 변경'}
        </button>

        {changed && (
          <div className="auth-find-result">
            <strong>비밀번호가 변경되었습니다.</strong>

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
