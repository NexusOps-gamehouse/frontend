import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { signupStore, resetSignupStore } from '../signupStore';
import StepIndicator from '../components/StepIndicator';
import { isSurveyComplete } from '../components/PlayStyleQuestions';
import { SIGNUP_FLOW, SIGNUP_STEP_TOTAL } from '../constants';
import { formatRiotId } from '../api/riot';

export default function ConfirmPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const s = signupStore;

  const surveyDone = isSurveyComplete(s.surveyAnswers);

  const tags = [
    s.mic ? '#마이크O' : '#마이크X',
    s.age && `#${s.age}세`,
    s.playDuration && `#${s.playDuration}`,
  ].filter(Boolean);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('email', s.email);
      form.append('password', s.password);
      form.append('nickname', s.nickname);
      form.append('name', s.name);
      form.append('phone', s.phone);

      // [FR-01] 프로필 정보 5개.
      // gender / position / game / gameModes / playStyle / tier 는 더 이상 가입에서 받지 않는다.
      form.append('mic', s.mic);
      if (s.age !== '') form.append('age', Number(s.age));
      form.append('playTimes', s.playTimes.join(','));
      form.append('playDays', s.playDays.join(','));
      form.append('playDuration', s.playDuration);

      // 성향 설문 12문항. 콤마 문자열로 보낸다.
      //
      // 가입 요청 안에 같이 실어 보내는 이유: 별도 API 로 나누면 계정은 생겼는데
      // 설문만 실패한 사용자가 생긴다. 그 계정은 매칭 점수를 낼 수 없는 상태로
      // 서비스에 남고, 다시 채우게 만들 화면도 없다. 한 트랜잭션에서 끝낸다.
      if (surveyDone) form.append('surveyAnswers', s.surveyAnswers.join(','));

      // 라이엇 계정은 이름/태그로 나눠 보낸다.
      // 티어·숙련도 저장은 백엔드가 signup 트랜잭션 안에서 직접 조회해 처리해야 한다.
      // (프론트가 보낸 값을 그대로 믿고 저장하면 위조가 가능하다)
      if (s.riotGameName) {
        form.append('gameName', s.riotGameName);
        form.append('tagLine', s.riotTagLine);
      }
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

  const backTo = SIGNUP_FLOW === 'single' ? '/signup/survey' : '/signup/playstyle';

  return (
    <div className="page">
      <div className="center">
        <p className="h2">
          이대로 만들까요? <span className="meta">{SIGNUP_STEP_TOTAL} / {SIGNUP_STEP_TOTAL}</span>
        </p>
        <StepIndicator current={SIGNUP_STEP_TOTAL} total={SIGNUP_STEP_TOTAL} />
        <div className="card">
          <div className="flex" style={{ marginBottom: 12 }}>
            <div className="av lg">
              {s.imagePreview ? <img src={s.imagePreview} alt="프로필" /> : (s.nickname?.[0] || '?')}
            </div>
            <div>
              <div className="name">{s.nickname}</div>
              <div className="meta">{s.age ? `${s.age}세` : ''}</div>
            </div>
          </div>
          <div className="row" style={{ marginBottom: 0 }}>
            {tags.map((t) => <span key={t} className="tag">{t}</span>)}
          </div>
          <div className="meta" style={{ marginTop: 10 }}>
            {s.playDays.length > 0 && <div>주 요일: {s.playDays.join(', ')}</div>}
            {s.playTimes.length > 0 && <div>주 시간대: {s.playTimes.join(', ')}</div>}
            {s.playDuration && <div>1회 플레이 분량: {s.playDuration}</div>}
            <div>플레이 성향 설문: {surveyDone ? '12문항 응답 완료' : '미응답'}</div>
            {s.name && <div>이름: {s.name}</div>}
            {s.phone && <div>연락처: {s.phone}</div>}
            {s.riotGameName && <div>롤 계정: {formatRiotId(s.riotGameName, s.riotTagLine)}</div>}
          </div>
        </div>
        {error && <p className="error-msg">{error}</p>}
        <div className="flex" style={{ marginTop: 16 }}>
          <button className="btn2 signup-lift" style={{ flex: 1, height: 48, borderRadius: 'var(--radius-md)' }}
                  onClick={() => navigate(backTo)}>이전</button>
          <button className="ui-btn-primary" style={{ flex: 1, height: 48, fontSize: 13, fontWeight: 600 }}
                  onClick={submit} disabled={loading}>
            {loading ? '생성 중...' : '계정생성'}
          </button>
        </div>
      </div>
    </div>
  );
}
