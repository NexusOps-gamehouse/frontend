import LikertScale from './LikertScale';
import { SURVEY_AREAS, SURVEY_QUESTIONS } from '../constants';

/**
 * 성향 설문 12문항 묶음. 영역(6개)별로 접어 보여준다.
 *
 * 화면을 나눠 쓰는 두 곳(4단계 분리안의 전용 페이지 / 3단계 통합안의 2단계
 * 화면)이 같은 문항을 그린다. 컴포넌트로 빼두지 않으면 문구 하나 고칠 때
 * 두 군데를 고쳐야 하고, 한쪽만 고치면 사용자마다 다른 문항에 답한 데이터가
 * 같은 컬럼에 섞인다.
 *
 * answers 는 길이 12 배열(미응답 null), onChange(index, score) 로 올려준다.
 */
export default function PlayStyleQuestions({ answers, onChange }) {
  return (
    <div className="ps-survey">
      {SURVEY_AREAS.map((area) => {
        const questions = SURVEY_QUESTIONS.filter((q) => q.area === area.key);
        return (
          <section key={area.key} className="ps-area">
            <h3 className="ps-area-title">
              <span aria-hidden="true">{area.emoji}</span> {area.label}
            </h3>

            {questions.map((q) => (
              <div key={q.no} className="ps-q">
                <p className="ps-q-text">
                  <span className="ps-q-no">{q.no}</span>
                  {q.text}
                  {q.areaLabel && <span className="ps-q-tag">{q.areaLabel}</span>}
                </p>
                <LikertScale
                  name={`q${q.no}`}
                  value={answers[q.no - 1]}
                  onChange={(score) => onChange(q.no - 1, score)}
                  low={q.low}
                  high={q.high}
                />
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

/** 12문항에 모두 답했는가. */
export function isSurveyComplete(answers) {
  return Array.isArray(answers)
      && answers.length === SURVEY_QUESTIONS.length
      && answers.every((a) => a >= 1 && a <= 5);
}
