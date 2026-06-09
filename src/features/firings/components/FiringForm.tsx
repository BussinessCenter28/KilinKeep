// Presentational firing form. Holds local field state, emits a FiringInput on submit.
// No services / no '@/lib/supabase' here — the parent page wires it to a mutation hook.
import { useState, type FormEvent } from 'react';
import { TextField, TextArea, SelectField } from '@/components/Field';
import { Button, ErrorBanner } from '@/components/ui';
import { FIRING_TYPES, ATMOSPHERES } from '@/lib/types';
import type { Atmosphere, FiringSegment, FiringType } from '@/lib/types';
import type { FiringInput } from '../services/firingService';
import { ScheduleEditor } from './ScheduleEditor';

interface Props {
  initial?: Partial<FiringInput>;
  submitLabel: string;
  busy?: boolean;
  error?: string | null;
  onSubmit: (input: FiringInput) => void;
}

const TYPE_OPTIONS = FIRING_TYPES.map((t) => ({ value: t, label: t }));
const ATMOSPHERE_OPTIONS = ATMOSPHERES.map((a) => ({ value: a, label: a }));

function nullIfBlank(s: string): string | null {
  const t = s.trim();
  return t === '' ? null : t;
}

export function FiringForm({ initial, submitLabel, busy, error, onSubmit }: Props) {
  const [kiln, setKiln] = useState(initial?.kiln ?? '');
  const [date, setDate] = useState(initial?.date ?? '');
  const [type, setType] = useState<FiringType>(initial?.type ?? 'bisque');
  const [targetCone, setTargetCone] = useState(initial?.target_cone ?? '');
  const [atmosphere, setAtmosphere] = useState<Atmosphere | ''>(initial?.atmosphere ?? '');
  const [cost, setCost] = useState(initial?.cost != null ? String(initial.cost) : '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [segments, setSegments] = useState<FiringSegment[]>(initial?.schedule ?? []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsedCost = cost.trim() === '' ? null : Number(cost);
    onSubmit({
      kiln: nullIfBlank(kiln),
      date: nullIfBlank(date),
      type,
      target_cone: nullIfBlank(targetCone),
      atmosphere: atmosphere === '' ? null : atmosphere,
      cost: parsedCost != null && Number.isFinite(parsedCost) ? parsedCost : null,
      notes: nullIfBlank(notes),
      schedule: segments.length > 0 ? segments : null,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {error ? <ErrorBanner message={error} /> : null}

      <TextField
        label="Kiln"
        placeholder="e.g. Skutt KM1027"
        value={kiln}
        onChange={(e) => setKiln(e.target.value)}
      />

      <TextField
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <SelectField
        label="Type"
        options={TYPE_OPTIONS}
        value={type}
        onChange={(e) => setType(e.target.value as FiringType)}
      />

      <TextField
        label="Target cone"
        placeholder="e.g. 6"
        value={targetCone}
        onChange={(e) => setTargetCone(e.target.value)}
      />

      <SelectField
        label="Atmosphere"
        placeholder="—"
        options={ATMOSPHERE_OPTIONS}
        value={atmosphere}
        onChange={(e) => setAtmosphere(e.target.value as Atmosphere | '')}
      />

      <TextField
        label="Cost"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={cost}
        onChange={(e) => setCost(e.target.value)}
      />

      <ScheduleEditor segments={segments} onChange={setSegments} />

      <TextArea
        label="Notes"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <Button type="submit" variant="primary" block disabled={busy}>
        {busy ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
