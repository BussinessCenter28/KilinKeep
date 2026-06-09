// Editable rows of {material, percent}. Parent owns the array; this renders rows with
// add/remove and a live percent total that warns (not blocks) when it drifts off 100.
import { TextField } from '@/components/Field';
import { Button, InfoBanner } from '@/components/ui';
import { percentTotal, isPercentTotalOk } from '@/lib/recipeMath';

export interface IngredientRow {
  material: string;
  percent: string;
}

interface Props {
  rows: IngredientRow[];
  onChange: (next: IngredientRow[]) => void;
}

export function emptyRow(): IngredientRow {
  return { material: '', percent: '' };
}

export function IngredientEditor({ rows, onChange }: Props) {
  function update(index: number, patch: Partial<IngredientRow>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function remove(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...rows, emptyRow()]);
  }

  const amounts = rows.map((r) => ({
    material: r.material,
    percent: Number.parseFloat(r.percent) || 0,
  }));
  const total = percentTotal(amounts);
  const ok = isPercentTotalOk(total);

  return (
    <div className="field-group">
      {rows.map((row, i) => (
        <div className="row wrap" key={i}>
          <TextField
            label="Material"
            value={row.material}
            onChange={(e) => update(i, { material: e.target.value })}
            placeholder="e.g. Custer Feldspar"
          />
          <TextField
            label="Percent"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={row.percent}
            onChange={(e) => update(i, { percent: e.target.value })}
            placeholder="0"
          />
          <Button variant="ghost" size="sm" type="button" onClick={() => remove(i)} aria-label="Remove ingredient">
            Remove
          </Button>
        </div>
      ))}

      <div className="spread">
        <Button variant="ghost" size="sm" type="button" onClick={add}>
          + Add ingredient
        </Button>
        <span className={`small ${ok ? 'muted' : ''}`.trim()}>Total: {total}%</span>
      </div>

      {!ok ? (
        <InfoBanner>Percent total is {total}% — recipes usually sum to ~100%.</InfoBanner>
      ) : null}
    </div>
  );
}
