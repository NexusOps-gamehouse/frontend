/** 회원가입 3단계 진행 표시 바 */
export default function StepIndicator({ current, total }) {
  return (
    <div className="steps" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`step-dot ${i < current ? 'is-active' : ''}`} />
      ))}
    </div>
  );
}
