import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Chips, { MultiChips } from '../components/Chips';
import StepIndicator from '../components/StepIndicator';
import PlayStyleQuestions, { isSurveyComplete } from '../components/PlayStyleQuestions';
import {
  ANY, PLAY_TIMES, PLAY_DAYS, PLAY_DURATIONS,
  AGE_MIN, AGE_MAX, SIGNUP_FLOW, SIGNUP_STEP_TOTAL,
} from '../constants';
import { signupStore } from '../signupStore';

/**
 * 회원가입 2단계 — 프로필 정보 5개.
 *
 * [FR-01] 성별은 민감정보라 받지 않고, 주 포지션은 사람이 아니라 파티에
 * 붙는 값이라 매칭/파티 생성 화면으로 옮겼다. (같은 사람이 파티마다 다른
 * 포지션을 서므로 프로필에 하나로 박아두면 매칭이 틀린다)
 *
 * SIGNUP_FLOW === 'single' 이면 성향 12문항도 이 화면에서 같이 받는다.
 */
export default function SurveyPage() {
  const navigate = useNavigate();
  const withSurvey = SIGNUP_FLOW === 'single';

  const [mic, setMic] = useState(signupStore.mic);
  const [age, setAge] = useState(signupStore.age);
  const [playTimes, setPlayTimes] = useState(signupStore.playTimes);
  const [playDays, setPlayDays] = useState(signupStore.playDays);
  const [playDuration, setPlayDuration] = useState(signupStore.playDuration);
  const [answers, setAnswers] = useState(signupStore.surveyAnswers);

  const ageNum = Number(age);
  const ageValid = age !== '' && Number.isInteger(ageNum) && ageNum >= AGE_MIN && ageNum <= AGE_MAX;

  const profileDone =
    mic !== null && ageValid && playDuration &&
    playTimes.length > 0 && playDays.length > 0;

  const canSubmit = profileDone && (!withSurvey || isSurveyComplete(answers));

  const setAnswer = (index, score) =>
    setAnswers((prev) => prev.map((v, i) => (i === index ? score : v)));

  // 현재 선택값을 임시 저장 (이전/다음 이동 시 유지)
  const persist = () => Object.assign(signupStore, {
    mic, age, playTimes, playDays, playDuration, surveyAnswers: answers,
  });

  const prev = () => { persist(); navigate('/signup'); };

  const next = () => {
    if (!canSubmit) return;
    persist();
    navigate(withSurvey ? '/signup/confirm' : '/signup/playstyle');
  };

  return (
    <div className="page">
      <div className="survey">
        <p className="h2">
          몇 가지만 알려주세요 <span className="meta">2 / {SIGNUP_STEP_TOTAL}</span>
        </p>
        <StepIndicator current={2} total={SIGNUP_STEP_TOTAL} />

        <div className="survey-grid">
          <div className="qb">
            <p className="q">나이 <span className="req">*</span></p>
            <div className="row">
              <input
                className="inp age-inp"
                type="number"
                inputMode="numeric"
                min={AGE_MIN}
                max={AGE_MAX}
                placeholder="예: 24"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
              <span className="meta" style={{ alignSelf: 'center' }}>세</span>
            </div>
            {age !== '' && !ageValid &&
              <p className="field-hint" style={{ color: 'var(--danger)' }}>
                {AGE_MIN}~{AGE_MAX} 사이 숫자로 입력해 주세요.
              </p>}
          </div>

          <div className="qb">
            <p className="q">마이크 여부 <span className="req">*</span></p>
            <Chips options={['마이크 O', '마이크 X']}
                   value={mic === null ? '' : mic ? '마이크 O' : '마이크 X'}
                   onChange={(v) => setMic(v === '' ? null : v === '마이크 O')} />
          </div>

          <div className="qb">
            <p className="q">주로 플레이하는 시간대 (복수 선택) <span className="req">*</span></p>
            <MultiChips options={PLAY_TIMES} values={playTimes} onChange={setPlayTimes} />
          </div>

          <div className="qb">
            <p className="q">한 번 플레이할 때 선호하는 분량 <span className="req">*</span></p>
            <Chips options={PLAY_DURATIONS} value={playDuration} onChange={setPlayDuration} />
          </div>

          <div className="qb full">
            <p className="q">주로 플레이하는 요일 (복수 선택) <span className="req">*</span></p>
            <MultiChips options={PLAY_DAYS} values={playDays} onChange={setPlayDays} exclusive={ANY} />
          </div>
        </div>

        {withSurvey && (
          <>
            <p className="h2" style={{ marginTop: 28 }}>플레이 성향</p>
            <p className="meta" style={{ marginBottom: 12 }}>
              정답은 없어요. 평소 모습에 가까운 쪽을 골라주세요.
            </p>
            <PlayStyleQuestions answers={answers} onChange={setAnswer} />
          </>
        )}

        {/* 배치를 인라인으로 둔다 — styles.css의 .survey-actions 규칙이 없어도 가로로 유지 */}
        <div className="survey-actions"
             style={{ display: 'flex', gap: 12, maxWidth: 480, margin: '12px auto 0' }}>
          <button type="button" className="btn2 signup-lift"
                  style={{ flex: '0 0 108px', height: 48, fontSize: 14, fontWeight: 600,
                           borderRadius: 'var(--radius-md)' }}
                  onClick={prev}>이전</button>
          <button type="button" className="ui-btn-primary"
                  style={{ flex: 1, height: 48, fontSize: 14, fontWeight: 600 }}
                  onClick={next} disabled={!canSubmit}>
            {withSurvey ? '다음 → 프로필 확인' : '다음 → 플레이 성향'}
          </button>
        </div>
      </div>
    </div>
  );
}
