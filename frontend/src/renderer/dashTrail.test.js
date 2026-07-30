import { describe, expect, it } from 'vitest';

import {
  boidTrailStrength,
  coreAlpha,
  coreHalfWidth,
  launchRingAlpha,
  launchRingRadius,
  LAUNCH_RING_SECONDS,
  ribbonAlpha,
  ribbonHalfWidth,
  trailStrength,
} from './dashTrail.js';

const MAX_SPEED = 360;
const DASH_SPEED = 1100;

describe('trailStrength', () => {
  it('is zero at a standstill and at normal top speed', () => {
    expect(trailStrength(0, MAX_SPEED, DASH_SPEED)).toBe(0);
    expect(trailStrength(MAX_SPEED * 0.6, MAX_SPEED, DASH_SPEED)).toBe(0);
  });

  it('is full at dash speed', () => {
    expect(trailStrength(DASH_SPEED, MAX_SPEED, DASH_SPEED)).toBe(1);
  });

  it('never leaves 0..1, however absurd the speed', () => {
    expect(trailStrength(DASH_SPEED * 4, MAX_SPEED, DASH_SPEED)).toBe(1);
    expect(trailStrength(-500, MAX_SPEED, DASH_SPEED)).toBe(0);
  });

  it('grows with speed', () => {
    const slow = trailStrength(600, MAX_SPEED, DASH_SPEED);
    const fast = trailStrength(900, MAX_SPEED, DASH_SPEED);
    expect(fast).toBeGreaterThan(slow);
  });

  it('is zero when a dash is no faster than normal movement', () => {
    expect(trailStrength(900, DASH_SPEED, DASH_SPEED)).toBe(0);
  });
});

describe('boidTrailStrength', () => {
  it('is zero while idle and while charging', () => {
    expect(boidTrailStrength(0)).toBe(0);
    expect(boidTrailStrength(0.5)).toBe(0);
    expect(boidTrailStrength(0.99)).toBe(0);
  });

  it('is strongest at the launch and weakest at the end of the dash', () => {
    expect(boidTrailStrength(-1)).toBe(1);
    expect(boidTrailStrength(-0.05)).toBeLessThan(boidTrailStrength(-0.9));
  });

  it('stays inside 0..1', () => {
    for (const phase of [-1, -0.75, -0.5, -0.25, -0.01]) {
      const strength = boidTrailStrength(phase);
      expect(strength).toBeGreaterThan(0);
      expect(strength).toBeLessThanOrEqual(1);
    }
  });
});

describe('ribbon shape', () => {
  it('runs to a point at the tail and is widest at the object', () => {
    expect(ribbonHalfWidth(15, 0, 1)).toBe(0);
    expect(ribbonHalfWidth(15, 1, 1)).toBe(15);
    expect(ribbonHalfWidth(15, 0.5, 1)).toBeLessThan(15);
  });

  it('scales with strength, so a weak dash draws a thin band', () => {
    expect(ribbonHalfWidth(15, 1, 0.4)).toBeCloseTo(6);
  });

  it('fades out toward the tail and never becomes opaque', () => {
    expect(ribbonAlpha(0, 1)).toBe(0);
    expect(ribbonAlpha(1, 1)).toBeLessThan(1);
    expect(ribbonAlpha(1, 1)).toBeGreaterThan(ribbonAlpha(0.5, 1));
  });

  it('keeps the core inside the band at every age', () => {
    for (const age of [0.2, 0.4, 0.6, 0.8, 1]) {
      expect(coreHalfWidth(15, age, 1)).toBeLessThan(ribbonHalfWidth(15, age, 1));
    }
  });

  it('falls off faster than the band, so the core stays a short streak', () => {
    const bandRatio = ribbonHalfWidth(15, 0.5, 1) / ribbonHalfWidth(15, 1, 1);
    const coreRatio = coreHalfWidth(15, 0.5, 1) / coreHalfWidth(15, 1, 1);
    expect(coreRatio).toBeLessThan(bandRatio);
    expect(coreAlpha(0.5, 1)).toBeLessThan(ribbonAlpha(0.5, 1));
  });
});

describe('launch ring', () => {
  it('expands and fades over its lifetime', () => {
    expect(launchRingRadius(0)).toBeLessThan(launchRingRadius(LAUNCH_RING_SECONDS));
    expect(launchRingAlpha(0)).toBeGreaterThan(0);
    expect(launchRingAlpha(LAUNCH_RING_SECONDS)).toBe(0);
  });

  it('clamps past its lifetime instead of growing forever', () => {
    expect(launchRingRadius(10)).toBe(launchRingRadius(LAUNCH_RING_SECONDS));
    expect(launchRingAlpha(10)).toBe(0);
  });
});
