// Clickable 1-5 star rating. Presentational; parent owns the value. Clicking the
// current value clears it back to null (lets the user un-rate).
interface Props {
  value: number | null;
  onChange: (value: number | null) => void;
  label?: string;
}

const STARS = [1, 2, 3, 4, 5];

export function RatingInput({ value, onChange, label = 'Rating' }: Props) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="row" role="radiogroup" aria-label={label}>
        {STARS.map((n) => {
          const filled = value != null && n <= value;
          return (
            <button
              key={n}
              type="button"
              className="btn btn-ghost btn-sm"
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              aria-pressed={filled}
              onClick={() => onChange(value === n ? null : n)}
            >
              <span className="stars">{filled ? '★' : '☆'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
