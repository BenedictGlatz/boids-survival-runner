import { describe, expect, it } from 'vitest';

import { chooseScale } from './frameGraphScale.js';

// Stand-in for the real ladder: short enough to reason about every case.
const LADDER_MS = Object.freeze([0.5, 1, 2, 4, 8]);

describe('chooseScale', () => {
  it('picks the lowest rung that still contains the peak', () => {
    expect(chooseScale(1.4, LADDER_MS)).toBe(2);
  });

  it('keeps a peak that sits exactly on a rung on that rung', () => {
    // Otherwise the busiest sample would be drawn one pixel above the plot and
    // marked as clamped, which is exactly the case it must not report.
    expect(chooseScale(2, LADDER_MS)).toBe(2);
  });

  it('uses the lowest rung for an empty history', () => {
    expect(chooseScale(0, LADDER_MS)).toBe(0.5);
  });

  it('falls back to the highest rung when the peak exceeds the ladder', () => {
    // The caller clamps and marks those samples rather than rescaling the whole
    // window around one spike.
    expect(chooseScale(120, LADDER_MS)).toBe(8);
  });
});
