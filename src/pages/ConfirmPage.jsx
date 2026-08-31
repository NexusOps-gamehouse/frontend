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
      let profileImageKey = null;

      // 이미지가 있으면 Presigned URL을 받아 S3에 직접 업로드
      if (s.imageFile) {
        const { data: presigned } = await api.post(
            '/auth/profile-image/presigned-url',
            { contentType: s.imageFile.type }
        );

        const uploadResponse = await fetch(presigned.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': s.imageFile.type,
          },
          body: s.imageFile,
        });

        if (!uploadResponse.ok) {
          throw new Error('프로필 이미지 업로드에 실패했습니다.');
        }

        profileImageKey = presigned.objectKey;
      }

      const payload = {
        email: s.email,
        password: s.password,
        nickname: s.nickname,
        name: s.name,
        phone: s.phone,

        // [FR-01] 프로필 정보 5개.
        // gender / position / game / gameModes / playStyle / tier 는 더 이상 가입에서 받지 않는다.
        mic: s.mic,
        age: s.age !== '' ? Number(s.age) : null,
        playTimes: s.playTimes.join(','),
        playDays: s.playDays.join(','),
        playDuration: s.playDuration,

        // 성향 설문 12문항. 기존 백엔드 형식에 맞춰 콤마 문자열로 보낸다.
        surveyAnswers: surveyDone ? s.surveyAnswers.join(',') : null,

        // 라이엇 계정은 이름/태그로 나눠 보낸다.
        gameName: s.riotGameName || null,
        tagLine: s.riotTagLine || null,

        // S3에 업로드된 프로필 이미지의 Object Key
        profileImageKey,
      };

      const { data } = await api.post('/auth/signup', payload);
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
