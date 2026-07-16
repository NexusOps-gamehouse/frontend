import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { signupStore } from '../signupStore';

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(signupStore.email);
  const [password, setPassword] = useState(signupStore.password);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState(signupStore.nickname);
  const [preview, setPreview] = useState(signupStore.imagePreview);
  const [error, setError] = useState('');
  // null: 미인증 | 'ok': 인증 가능 | 'dup': 중복
  const [emailCheck, setEmailCheck] = useState(null);
  const [nicknameCheck, setNicknameCheck] = useState(null);

  const verifyEmail = async () => {
    if (!email) return;
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

  const checkMsg = (status) => {
    if (status === 'ok') return <p className="check-msg ok">사용 가능합니다.</p>;
    if (status === 'dup') return <p className="check-msg dup">이미 사용 중입니다.</p>;
    return null;
  };

  const emailCheckMsg = (status) => {
    if (status === 'ok') return <p className="check-msg ok">이메일 인증이 완료되었습니다.</p>;
    if (status === 'dup') return <p className="check-msg dup">이미 사용 중인 이메일입니다.</p>;
    return null;
  };

  const next = (e) => {
    e.preventDefault();
    if (emailCheck !== 'ok') { setError('이메일 인증을 완료해주세요.'); return; }
    if (nicknameCheck !== 'ok') { setError('닉네임 중복확인을 해주세요.'); return; }
    if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return; }
    if (password.length < 4) { setError('비밀번호는 4자 이상이어야 합니다.'); return; }
    Object.assign(signupStore, { email, password, nickname });
    navigate('/signup/survey');
  };

  return (
    <div className="page">
      <div className="center">
        <p className="h2">회원가입</p>
        <form onSubmit={next}>
          <div className="flex" style={{ alignItems: 'flex-start' }}>
            <input className="inp" type="email" placeholder="이메일" style={{ flex: 1 }}
                   value={email}
                   onChange={(e) => { setEmail(e.target.value); setEmailCheck(null); }}
                   required />
            <button className="btn2 sm" type="button" onClick={verifyEmail}
                    style={{ height: 38 }}>이메일 인증</button>
          </div>
          {emailCheckMsg(emailCheck)}

          <input className="inp" type="password" placeholder="비밀번호"
                 value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input className="inp" type="password" placeholder="비밀번호 확인"
                 value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required />

          <div className="flex" style={{ alignItems: 'flex-start' }}>
            <input className="inp" type="text" placeholder="닉네임" style={{ flex: 1 }}
                   value={nickname}
                   onChange={(e) => { setNickname(e.target.value); setNicknameCheck(null); }}
                   required />
            <button className="btn2 sm" type="button" onClick={checkNickname}
                    style={{ height: 38 }}>중복확인</button>
          </div>
          {checkMsg(nicknameCheck)}

          <label className="flex" style={{ margin: '6px 0 18px', cursor: 'pointer' }}>
            <div className="av lg">
              {preview ? <img src={preview} alt="프로필 미리보기" /> : (nickname?.[0] || '')}
            </div>
            <span style={{ fontSize: 13, color: '#999' }}>프로필 이미지 업로드</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onImage} />
          </label>
          {error && <p className="error-msg">{error}</p>}
          <button className="btn" type="submit">다음 → 설문</button>
        </form>
      </div>
    </div>
  );
}
