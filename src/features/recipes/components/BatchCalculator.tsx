// Scale a recipe to a target dry batch weight. Pure math via recipeMath; presentational.
import { useState } from 'react';
import { TextField } from '@/components/Field';
import { EmptyState, InfoBanner } from '@/components/ui';
import { scaleToBatch, percentTotal, isPercentTotalOk } from '@/lib/recipeMath';
import type { IngredientAmount } from '@/lib/recipeMath';

interface Props {
  ingredients: IngredientAmount[];
}

export function BatchCalculator({ ingredients }: Props) {
  const [batch, setBatch] = useState('1000');

  const weight = Number.parseFloat(batch) || 0;
  const scaled = scaleToBatch(ingredients, weight);
  const total = percentTotal(ingredients);
  const totalOk = ingredients.length === 0 || isPercentTotalOk(total);

  return (
    <div className="field-group">
      <TextField
        label="Batch weight (g)"
        type="number"
        inputMode="decimal"
        min="0"
        step="1"
        value={batch}
        onChange={(e) => setBatch(e.target.value)}
        placeholder="1000"
      />

      {!totalOk ? (
        <InfoBanner>
          Percent total is {total}% — recipes usually sum to ~100%. Grams are normalized to
          your batch weight regardless.
        </InfoBanner>
      ) : null}

      {scaled.length === 0 ? (
        <EmptyState title="No ingredients" children="Add ingredients to scale a batch." />
      ) : (
        <table className="batch-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Grams</th>
            </tr>
          </thead>
          <tbody>
            {scaled.map((s, i) => (
              <tr key={`${s.material}-${i}`}>
                <td>{s.material || '—'}</td>
                <td>{s.grams}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
