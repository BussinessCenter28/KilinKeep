import { describe, it, expect } from 'vitest';
import {
  roundTo,
  percentTotal,
  isPercentTotalOk,
  scaleToBatch,
  firingCostFromKwh,
} from './recipeMath';

describe('roundTo', () => {
  it('rounds to the given decimal places', () => {
    expect(roundTo(1.2345, 2)).toBe(1.23);
    expect(roundTo(1.235, 2)).toBe(1.24);
    expect(roundTo(10, 1)).toBe(10);
  });
  it('handles non-finite input', () => {
    expect(roundTo(NaN)).toBe(0);
    expect(roundTo(Infinity)).toBe(0);
  });
});

describe('percentTotal', () => {
  it('sums percentages', () => {
    expect(percentTotal([{ material: 'a', percent: 40 }, { material: 'b', percent: 60 }])).toBe(100);
  });
  it('ignores non-finite percents', () => {
    expect(percentTotal([{ material: 'a', percent: NaN }, { material: 'b', percent: 50 }])).toBe(50);
  });
  it('is empty-safe', () => {
    expect(percentTotal([])).toBe(0);
  });
});

describe('isPercentTotalOk', () => {
  it('accepts within tolerance', () => {
    expect(isPercentTotalOk(100)).toBe(true);
    expect(isPercentTotalOk(99.5)).toBe(true);
    expect(isPercentTotalOk(101)).toBe(true);
  });
  it('rejects outside tolerance', () => {
    expect(isPercentTotalOk(98)).toBe(false);
    expect(isPercentTotalOk(105)).toBe(false);
  });
});

describe('scaleToBatch', () => {
  it('scales a clean 100% recipe', () => {
    const out = scaleToBatch(
      [{ material: 'Feldspar', percent: 40 }, { material: 'Silica', percent: 60 }],
      1000,
    );
    expect(out.map((i) => i.grams)).toEqual([400, 600]);
  });

  it('normalizes when the total is not 100 so grams sum to the batch weight', () => {
    const out = scaleToBatch(
      [{ material: 'A', percent: 49 }, { material: 'B', percent: 49 }], // total 98
      1000,
      3,
    );
    const sum = out.reduce((s, i) => s + i.grams, 0);
    expect(roundTo(sum, 1)).toBe(1000);
  });

  it('returns zeros for an empty recipe', () => {
    expect(scaleToBatch([], 1000)).toEqual([]);
  });

  it('returns zero grams for non-positive batch weight', () => {
    const out = scaleToBatch([{ material: 'A', percent: 100 }], 0);
    expect(out[0]?.grams).toBe(0);
  });

  it('does not divide by zero on a zero-total recipe', () => {
    const out = scaleToBatch([{ material: 'A', percent: 0 }], 1000);
    expect(out[0]?.grams).toBe(0);
  });
});

describe('firingCostFromKwh', () => {
  it('multiplies kwh by price', () => {
    expect(firingCostFromKwh(30, 0.15)).toBe(4.5);
  });
  it('guards bad input', () => {
    expect(firingCostFromKwh(-1, 0.15)).toBe(0);
    expect(firingCostFromKwh(30, 0)).toBe(0);
    expect(firingCostFromKwh(NaN, 0.15)).toBe(0);
  });
});
