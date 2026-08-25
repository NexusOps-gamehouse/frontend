/**
 * 1~5점 리커트 척도 한 줄.
 *
 * 칩(Chips)을 쓰지 않는 이유: 칩은 "고르는 항목"이고 이건 "정도"다. 크기가
 * 같은 버튼 다섯 개를 늘어놓으면 사용자가 순서를 세어 읽어야 한다. 양 끝을
 * 크게, 가운데를 작게 두면 어느 쪽으로 기울었는지가 위치만으로 읽힌다.
 *
 * 라디오 그룹으로 만든 이유는 접근성이다. 버튼 다섯 개는 스크린리더에게
 * "버튼 다섯 개"지만 라디오 그룹은 "5개 중 3번째 선택됨"으로 읽힌다.
 */
export default function LikertScale({ name, value, onChange, low, high }) {
  return (
    <div className="likert" role="radiogroup" aria-label={`${low} ↔ ${high}`}>
      <span className="likert-end low">{low}</span>

      <div className="likert-dots">
        {[1, 2, 3, 4, 5].map((score) => (
          <label key={score} className={`likert-dot s${score} ${value === score ? 'on' : ''}`}>
            <input
              type="radio"
              name={name}
              value={score}
              checked={value === score}
              onChange={() => onChange(score)}
            />
            <span className="likert-mark" aria-hidden="true" />
            <span className="sr-only">{score}점</span>
          </label>
        ))}
      </div>

      <span className="likert-end high">{high}</span>
    </div>
  );
}
