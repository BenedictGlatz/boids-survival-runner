import { describe, expect, it } from 'vitest';

import { chooseScale, resolveScale } from './frameGraphScale.js';

/** Mirrors the sentinel the menu sends for the dynamic axis. */
const DYNAMIC = 'dynamic';

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

describe('resolveScale', () => {
  it('follows the peak up the ladder when the axis is dynamic', () => {
    expect(resolveScale(DYNAMIC, 1.4, LADDER_MS)).toBe(2);
  });

  it('uses the fixed top instead of the ladder', () => {
    // 33 is not a rung at all: a fixed axis is a value in its own right, not the
    // nearest ladder entry to it.
    expect(resolveScale(33, 1.4, LADDER_MS)).toBe(33);
  });

  it('keeps a fixed top even when the peak runs past it', () => {
    // This is the point of pinning the axis: the spike gets clamped and marked,
    // and the rest of the history keeps the height it had before.
    expect(resolveScale(33, 120, LADDER_MS)).toBe(33);
  });

  it('keeps a fixed top even when every sample is far below it', () => {
    // The curves collapsing towards the baseline is the cost the developer
    // accepted by pinning the axis, not something to quietly correct.
    expect(resolveScale(100, 0.4, LADDER_MS)).toBe(100);
  });
});
