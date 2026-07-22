import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { signupStore } from '../signupStore';
import StepIndicator from '../components/StepIndicator';

function EyeIcon({ off }) {
  const common = {
    width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  return off ? (
    <svg {...common} aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg {...common} aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(signupStore.email);
  const [password, setPassword] = useState(signupStore.password);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [nickname, setNickname] = useState(signupStore.nickname);
  const [preview, setPreview] = useState(signupStore.imagePreview);
  // null: 미인증 | 'ok': 인증 가능 | 'dup': 중복
  const [emailCheck, setEmailCheck] = useState(null);
  const [nicknameCheck, setNicknameCheck] = useState(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const verifyEmail = async () => {
    if (!email) return;
    if (!emailValid) { setEmailCheck('invalid'); return; }
    const { data } = await api.get('/auth/check-email', { params: { email } });
    setEmailCheck(data.available ? 'ok' : 'dup');
  };

  const checkNickname = async () => {
    if (!nickname) return;
    const { data } = await api.get('/auth/check-nickname', { params: { nickname } });
    setNicknameCheck(data.available ? 'ok' : 'dup');
  };

  const onImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    signupStore.imageFile = file;
    const url = URL.createObjectURL(file);
    signupStore.imagePreview = url;
    setPreview(url);
  };

  const removeImage = () => {
    if (signupStore.imagePreview) URL.revokeObjectURL(signupStore.imagePreview);
    signupStore.imageFile = null;
    signupStore.imagePreview = '';
    setPreview('');
  };

  // 인증/중복확인 결과 메시지 (공용화)
  const renderCheck = (status, okMsg, dupMsg) => {
    if (status === 'ok') return <p className="check-msg ok" role="status">{okMsg}</p>;
    if (status === 'dup') return <p className="check-msg dup" role="alert">{dupMsg}</p>;
    return null;
  };

  // 실시간 검증 상태
  const passwordValid = password.length >= 4;
  const passwordMatch = passwordConfirm.length > 0 && password === passwordConfirm;
  const canSubmit =
    emailCheck === 'ok' && nicknameCheck === 'ok' && passwordValid && passwordMatch;

  const next = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    Object.assign(signupStore, { email, password, nickname });
    navigate('/signup/survey');
  };

  return (
    <div className="page">
      <div className="center">
        <p className="h2">회원가입 <span className="meta">1 / 3</span></p>
        <StepIndicator current={1} total={3} />

        <form onSubmit={next}>
          {/* 이메일 + 중복확인 */}
          <div className="field">
            <div className="field-row">
              <input id="signup-email" className="inp" type="email" placeholder="이메일"
                     aria-label="이메일"
                     value={email}
                     onChange={(e) => { setEmail(e.target.value); setEmailCheck(null); }}
                     required />
              <button className="btn2 sm" type="button" onClick={verifyEmail}
                      disabled={!email || emailCheck === 'ok'}
                      aria-label="이메일 중복확인">
                {emailCheck === 'ok' ? '확인 완료 ✓' : '이메일 중복확인'}
              </button>
            </div>
            {emailCheck === 'invalid'
              ? <p className="check-msg dup" role="alert">올바른 이메일 형식이 아닙니다.</p>
              : renderCheck(emailCheck, '사용 가능한 이메일입니다.', '이미 사용 중인 이메일입니다.')}
          </div>

          {/* 비밀번호 */}
          <div className="field">
            <div className="inp-wrap">
              <input id="signup-password" className="inp" type={showPw ? 'text' : 'password'}
                     placeholder="비밀번호" aria-label="비밀번호"
                     value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" className="inp-toggle" onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 표시'}>
                <EyeIcon off={showPw} />
              </button>
            </div>
            {password.length > 0 && !passwordValid
              ? <p className="check-msg dup" role="alert">비밀번호는 4자 이상이어야 합니다.</p>
              : <p className="field-hint">비밀번호는 4자 이상 입력해주세요.</p>}
          </div>

          {/* 비밀번호 확인 */}
          <div className="field">
            <input id="signup-password-confirm" className="inp" type={showPw ? 'text' : 'password'}
                   placeholder="비밀번호 확인" aria-label="비밀번호 확인"
                   value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required />
            {passwordConfirm.length > 0 && (
              passwordMatch
                ? <p className="check-msg ok" role="status">비밀번호가 일치합니다.</p>
                : <p className="check-msg dup" role="alert">비밀번호가 일치하지 않습니다.</p>
            )}
          </div>

          {/* 닉네임 + 중복확인 */}
          <div className="field">
            <div className="field-row">
              <input id="signup-nickname" className="inp" type="text" placeholder="닉네임"
                     aria-label="닉네임"
                     value={nickname}
                     onChange={(e) => { setNickname(e.target.value); setNicknameCheck(null); }}
                     required />
              <button className="btn2 sm" type="button" onClick={checkNickname}
                      disabled={!nickname || nicknameCheck === 'ok'}
                      aria-label="닉네임 중복확인">
                {nicknameCheck === 'ok' ? '확인 완료 ✓' : '중복확인'}
              </button>
            </div>
            {renderCheck(nicknameCheck, '사용 가능합니다.', '이미 사용 중입니다.')}
          </div>

          {/* 프로필 이미지 */}
          {preview ? (
            <div className="upload-filled">
              <div className="av lg">
                <img src={preview} alt="프로필 미리보기" />
              </div>
              <div className="upload-info">
                <p className="name">프로필 이미지 선택됨</p>
                <p className="meta">JPG · PNG, 5MB 이하</p>
              </div>
              <div className="upload-actions">
                <label className="ui-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  변경
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onImage} />
                </label>
                <button type="button" className="textlink" onClick={removeImage}>삭제</button>
              </div>
            </div>
          ) : (
            <label className="dropzone">
              <div className="av lg" aria-hidden="true">{nickname?.[0] || '📷'}</div>
              <p>클릭하여 프로필 이미지를 업로드하세요</p>
              <p className="meta">JPG · PNG, 5MB 이하 (선택)</p>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onImage} />
            </label>
          )}

          <button className="ui-btn-primary" type="submit" disabled={!canSubmit}
                  style={{ width: '100%', marginTop: 8 }}>
            다음 → 설문
          </button>
        </form>
      </div>
    </div>
  );
}
