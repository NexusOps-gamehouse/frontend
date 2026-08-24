import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import StepIndicator from '../components/StepIndicator';
import PlayStyleQuestions, { isSurveyComplete } from '../components/PlayStyleQuestions';
import { SIGNUP_FLOW, SIGNUP_STEP_TOTAL, SURVEY_QUESTION_COUNT } from '../constants';
import { signupStore } from '../signupStore';

/**
 * 회원가입 3단계 — 플레이 성향 설문 12문항.
 *
 * 프로필 정보와 화면을 나눈 이유: 앞 화면은 "고르는" 입력이고 여기는 "읽고
 * 판단하는" 입력이라 머릿속 모드가 다르다. 한 화면에 붙이면 스크롤이 길어져
 * 뒤쪽 문항일수록 대충 가운데를 찍는다. (그 데이터는 매칭에 쓸 수 없다)
 *
 * SIGNUP_FLOW === 'single' 이면 이 페이지는 쓰이지 않는다.
 */
export default function PlayStyleSurveyPage() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState(signupStore.surveyAnswers);

  if (SIGNUP_FLOW === 'single') return <Navigate to="/signup/survey" replace />;

  const answered = answers.filter((a) => a != null).length;
  const canSubmit = isSurveyComplete(answers);

  const setAnswer = (index, score) =>
    setAnswers((prev) => prev.map((v, i) => (i === index ? score : v)));

  const persist = () => Object.assign(signupStore, { surveyAnswers: answers });

  const prev = () => { persist(); navigate('/signup/survey'); };

  const next = () => {
    if (!canSubmit) return;
    persist();
    navigate('/signup/confirm');
  };

  return (
    <div className="page">
      <div className="survey">
        <p className="h2">
          플레이 성향을 알려주세요 <span className="meta">3 / {SIGNUP_STEP_TOTAL}</span>
        </p>
        <StepIndicator current={3} total={SIGNUP_STEP_TOTAL} />

        <p className="meta" style={{ margin: '10px 0 4px' }}>
          정답은 없어요. 평소 모습에 가까운 쪽을 골라주세요.
        </p>
        <p className="meta" style={{ marginBottom: 16 }}>
          {answered} / {SURVEY_QUESTION_COUNT} 문항 응답
        </p>

        <PlayStyleQuestions answers={answers} onChange={setAnswer} />

        <div className="survey-actions"
             style={{ display: 'flex', gap: 12, maxWidth: 480, margin: '12px auto 0' }}>
          <button type="button" className="btn2 signup-lift"
                  style={{ flex: '0 0 108px', height: 48, fontSize: 14, fontWeight: 600,
                           borderRadius: 'var(--radius-md)' }}
                  onClick={prev}>이전</button>
          <button type="button" className="ui-btn-primary"
                  style={{ flex: 1, height: 48, fontSize: 14, fontWeight: 600 }}
                  onClick={next} disabled={!canSubmit}>다음 → 프로필 확인</button>
        </div>
      </div>
    </div>
  );
}
