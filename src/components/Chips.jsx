export default function Chips({ options, value, onChange, renderIcon }) {
  // 선택된 칩을 다시 누르면 해제
  const handle = (opt) => onChange(value === opt ? '' : opt);
  return (
    <div className="row">
      {options.map((opt) => {
        const icon = renderIcon?.(opt) ?? null;
        return (
          <button key={opt} type="button"
                  aria-pressed={value === opt}
                  className={`chip ${icon ? 'has-icon' : ''} ${value === opt ? 'on' : ''}`}
                  onClick={() => handle(opt)}>
            {icon}
            <span>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * 다중 선택 칩 — values는 배열
 * exclusive에 넘긴 값(예: '상관없음')은 나머지와 함께 선택되지 않는다.
 */
export function MultiChips({ options, values, onChange, renderIcon, exclusive }) {
  const toggle = (opt) => {
    const on = values.includes(opt);

    if (exclusive && opt === exclusive) {
      onChange(on ? [] : [exclusive]);
      return;
    }

    const base = exclusive ? values.filter((v) => v !== exclusive) : values;
    onChange(on ? base.filter((v) => v !== opt) : [...base, opt]);
  };

  return (
    <div className="row">
      {options.map((opt) => {
        const icon = renderIcon?.(opt) ?? null;
        return (
          <button key={opt} type="button"
                  aria-pressed={values.includes(opt)}
                  className={`chip ${icon ? 'has-icon' : ''} ${values.includes(opt) ? 'on' : ''}`}
                  onClick={() => toggle(opt)}>
            {icon}
            <span>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}
