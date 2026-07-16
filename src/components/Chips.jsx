export default function Chips({ options, value, onChange }) {
  return (
    <div className="row">
      {options.map((opt) => (
        <button key={opt} type="button"
                className={`chip ${value === opt ? 'on' : ''}`}
                onClick={() => onChange(opt)}>
          {opt}
        </button>
      ))}
    </div>
  );
}

/** 다중 선택 칩 — values는 배열 */
export function MultiChips({ options, values, onChange }) {
  const toggle = (opt) => {
    onChange(values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt]);
  };
  return (
    <div className="row">
      {options.map((opt) => (
        <button key={opt} type="button"
                className={`chip ${values.includes(opt) ? 'on' : ''}`}
                onClick={() => toggle(opt)}>
          {opt}
        </button>
      ))}
    </div>
  );
}
