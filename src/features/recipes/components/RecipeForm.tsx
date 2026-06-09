// Presentational, controlled recipe fields (name / type / cone / notes). The parent
// owns state and submission; this component renders inputs only.
import { TextField, TextArea, SelectField } from '@/components/Field';
import { RECIPE_TYPES } from '@/lib/types';
import type { RecipeType } from '@/lib/types';

export interface RecipeFormValues {
  name: string;
  type: RecipeType;
  cone: string;
  notes: string;
}

interface Props {
  value: RecipeFormValues;
  onChange: (next: RecipeFormValues) => void;
}

const TYPE_OPTIONS = RECIPE_TYPES.map((t) => ({ value: t, label: t }));

export function RecipeForm({ value, onChange }: Props) {
  return (
    <div className="field-group">
      <TextField
        label="Name"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        placeholder="e.g. Tenmoku"
        required
      />
      <SelectField
        label="Type"
        value={value.type}
        options={TYPE_OPTIONS}
        onChange={(e) => onChange({ ...value, type: e.target.value as RecipeType })}
      />
      <TextField
        label="Cone"
        value={value.cone}
        onChange={(e) => onChange({ ...value, cone: e.target.value })}
        placeholder="e.g. 6"
      />
      <TextArea
        label="Notes"
        value={value.notes}
        onChange={(e) => onChange({ ...value, notes: e.target.value })}
        rows={3}
      />
    </div>
  );
}
