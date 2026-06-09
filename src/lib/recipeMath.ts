// Pure batch-scaling math for the recipe calculator. NO I/O — fully unit tested.
// Correctness matters: a wrong number wastes real materials (see docs/testing.md).

export interface IngredientAmount {
  material: string;
  percent: number;
}

export interface ScaledIngredient extends IngredientAmount {
  /** grams for the requested batch weight */
  grams: number;
}

/** Round to `dp` decimal places (banker-free, half-up). */
export function roundTo(value: number, dp = 1): number {
  if (!Number.isFinite(value)) return 0;
  const f = 10 ** dp;
  return Math.round((value + Number.EPSILON) * f) / f;
}

/** Sum of ingredient percentages. */
export function percentTotal(ingredients: IngredientAmount[]): number {
  return roundTo(
    ingredients.reduce((sum, i) => sum + (Number.isFinite(i.percent) ? i.percent : 0), 0),
    3,
  );
}

/**
 * Is the percent total within tolerance of 100? Glaze recipes are written to ~100;
 * the UI warns (not blocks) when they drift. Default tolerance ±1.
 */
export function isPercentTotalOk(total: number, tolerance = 1): boolean {
  return Math.abs(total - 100) <= tolerance;
}

/**
 * Scale a recipe to a target dry batch weight (grams). Amounts are normalized by the
 * ACTUAL percent total so the scaled grams always sum to `batchWeight` — even if the
 * recipe doesn't total exactly 100. Returns zeros for an empty/zero recipe rather
 * than dividing by zero.
 */
export function scaleToBatch(
  ingredients: IngredientAmount[],
  batchWeight: number,
  dp = 1,
): ScaledIngredient[] {
  const total = percentTotal(ingredients);
  if (total <= 0 || batchWeight <= 0) {
    return ingredients.map((i) => ({ ...i, grams: 0 }));
  }
  return ingredients.map((i) => ({
    ...i,
    grams: roundTo((i.percent / total) * batchWeight, dp),
  }));
}

/**
 * Optional firing cost from energy use: kWh × price per kWh.
 * Returns 0 for non-positive / non-finite inputs.
 */
export function firingCostFromKwh(kwh: number, pricePerKwh: number, dp = 2): number {
  if (!Number.isFinite(kwh) || !Number.isFinite(pricePerKwh) || kwh <= 0 || pricePerKwh <= 0) {
    return 0;
  }
  return roundTo(kwh * pricePerKwh, dp);
}
