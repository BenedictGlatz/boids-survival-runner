import { describe, expect, it } from 'vitest';

import {
  healFlashAlpha,
  mendArcAlpha,
  mendArcSweep,
  MEND_ARC_SECONDS,
  mendProgress,
  towardInert,
} from '../mendPulse.js';
import { MEND_COLOR } from '../powerupMarkerLayer.js';

describe('mendProgress', () => {
  it('runs from nothing to everything across the moment', () => {
    expect(mendProgress(0)).toBe(0);
    expect(mendProgress(MEND_ARC_SECONDS / 2)).toBeCloseTo(0.5, 5);
    expect(mendProgress(MEND_ARC_SECONDS)).toBe(1);
  });

  it('clamps at both ends rather than running past them', () => {
    expect(mendProgress(-1)).toBe(0);
    expect(mendProgress(MEND_ARC_SECONDS * 3)).toBe(1);
  });
});

describe('mendArcAlpha', () => {
  it('is brightest while the arc is still growing', () => {
    expect(mendArcAlpha(0)).toBeGreaterThan(mendArcAlpha(MEND_ARC_SECONDS / 2));
  });

  it('is gone by the end, so nothing is left drawn on the player', () => {
    expect(mendArcAlpha(MEND_ARC_SECONDS)).toBe(0);
  });

  it('stays inside a legal opacity throughout', () => {
    for (let age = 0; age <= MEND_ARC_SECONDS; age += MEND_ARC_SECONDS / 10) {
      expect(mendArcAlpha(age)).toBeGreaterThanOrEqual(0);
      expect(mendArcAlpha(age)).toBeLessThanOrEqual(1);
    }
  });
});

describe('mendArcSweep', () => {
  it('fills exactly one full turn over the moment', () => {
    expect(mendArcSweep(0)).toBe(0);
    expect(mendArcSweep(MEND_ARC_SECONDS)).toBeCloseTo(Math.PI * 2, 5);
  });

  it('never sweeps a second turn, however late it is asked', () => {
    expect(mendArcSweep(MEND_ARC_SECONDS * 5)).toBeCloseTo(Math.PI * 2, 5);
  });
});

describe('healFlashAlpha', () => {
  it('is fully white on the step the segment arrives', () => {
    expect(healFlashAlpha(0)).toBe(1);
  });

  it('settles into the plain green rather than lingering', () => {
    expect(healFlashAlpha(MEND_ARC_SECONDS)).toBe(0);
  });

  it('spends the bright part early, so it flashes rather than pulses', () => {
    // Squared, so half way through the moment less than half the white is left.
    expect(healFlashAlpha(MEND_ARC_SECONDS / 2)).toBeLessThan(0.5);
  });
});

describe('towardInert', () => {
  it('returns the colour untouched while the marker is live', () => {
    expect(towardInert(MEND_COLOR, 0)).toBe('rgb(34, 197, 94)');
  });

  it('lands exactly on the design system slate when fully inert', () => {
    expect(towardInert(MEND_COLOR, 1)).toBe('rgb(148, 163, 184)');
  });

  it('blends in between, so the drain reads as one marker changing', () => {
    const half = towardInert(MEND_COLOR, 0.5);

    expect(half).not.toBe(towardInert(MEND_COLOR, 0));
    expect(half).not.toBe(towardInert(MEND_COLOR, 1));
  });

  it('clamps instead of extrapolating past either end', () => {
    expect(towardInert(MEND_COLOR, -2)).toBe(towardInert(MEND_COLOR, 0));
    expect(towardInert(MEND_COLOR, 7)).toBe(towardInert(MEND_COLOR, 1));
  });

  it('hands back the same string for the same quantised amount', () => {
    // The cache is the reason this function exists in this shape: an inert marker is redrawn
    // every frame, and a colour string per frame is what this renderer avoids.
    expect(towardInert(MEND_COLOR, 0.5)).toBe(towardInert(MEND_COLOR, 0.51));
  });
});
