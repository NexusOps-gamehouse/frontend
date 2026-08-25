import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import { formatPhone, isValidName, isValidPhone } from '../utils';
import './IDFinderPage.css';

export default function IDFinderPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const findEmail = async () => {
    if (!isValidName(name)) {
      alert('가입할 때 입력한 본명을 정확히 입력해 주세요.');
      return;
    }
    if (!isValidPhone(phone)) {
      alert('올바른 휴대폰 번호를 입력해 주세요.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.get('/users/find-email', {
        params: {
          name: name.trim(),
          phone,
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
        가입할 때 입력한 본명과 전화번호를 입력하면
        이메일을 확인할 수 있습니다.
      </p>

      <input
        className="inp"
        type="text"
        placeholder="본명"
        aria-label="본명"
        autoComplete="name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setEmail('');
        }}
      />

      <input
        className="inp"
        type="tel"
        placeholder="전화번호"
        aria-label="전화번호"
        autoComplete="tel"
        inputMode="numeric"
        maxLength={13}
        value={phone}
        onChange={(e) => {
          setPhone(formatPhone(e.target.value));
          setEmail('');
        }}
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
