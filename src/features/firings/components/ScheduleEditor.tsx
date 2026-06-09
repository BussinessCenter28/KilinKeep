// Optional firing schedule editor: a list of ramp segments (rate / temp / hold).
// Presentational — controlled by the parent form. No data access here.
import type { FiringSegment } from '@/lib/types';
import { Button } from '@/components/ui';

interface Props {
  segments: FiringSegment[];
  onChange: (segments: FiringSegment[]) => void;
}

type Field = keyof FiringSegment;

function parseNum(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function ScheduleEditor({ segments, onChange }: Props) {
  function updateField(index: number, field: Field, raw: string) {
    const next = segments.map((seg, i) => (i === index ? { ...seg, [field]: parseNum(raw) } : seg));
    onChange(next);
  }

  function addSegment() {
    onChange([...segments, { rate: null, temp: null, hold: null }]);
  }

  function removeSegment(index: number) {
    onChange(segments.filter((_, i) => i !== index));
  }

  return (
    <div className="field">
      <span>Schedule (optional)</span>
      {segments.length === 0 ? (
        <p className="muted small">No ramp segments. Add one to record the schedule.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Rate</th>
              <th>Temp</th>
              <th>Hold</th>
              <th aria-label="actions" />
            </tr>
          </thead>
          <tbody>
            {segments.map((seg, i) => (
              <tr key={i}>
                <td>
                  <input
                    type="number"
                    inputMode="decimal"
                    aria-label={`Segment ${i + 1} rate`}
                    value={seg.rate ?? ''}
                    onChange={(e) => updateField(i, 'rate', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    inputMode="decimal"
                    aria-label={`Segment ${i + 1} temp`}
                    value={seg.temp ?? ''}
                    onChange={(e) => updateField(i, 'temp', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    inputMode="decimal"
                    aria-label={`Segment ${i + 1} hold`}
                    value={seg.hold ?? ''}
                    onChange={(e) => updateField(i, 'hold', e.target.value)}
                  />
                </td>
                <td>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeSegment(i)}>
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="row">
        <Button type="button" variant="ghost" size="sm" onClick={addSegment}>
          + Add segment
        </Button>
      </div>
    </div>
  );
}
