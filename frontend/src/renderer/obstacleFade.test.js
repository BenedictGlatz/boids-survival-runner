import { describe, expect, it } from 'vitest';
import { obstacleFadeLevel } from './obstacleFade.js';

// Mirrored rather than imported: the test pins the shape of the ramp, not the tuning.
const FADE_SHARE = 0.1;

describe('obstacleFadeLevel', () => {
  it('starts invisible the instant an obstacle appears', () => {
    // The life fraction is exactly 1 on the first frame, so a fade that already
    // returned 1 there would pop the obstacle in rather than announce it.
    expect(obstacleFadeLevel(1, FADE_SHARE)).toBe(0);
  });

  it('is fully solid once the fade-in has finished', () => {
    // toBeCloseTo exactly on the boundary: 1 - 0.1 is not representable, so the
    // division lands a few bits under 1. Anywhere past it the result is exact.
    expect(obstacleFadeLevel(1 - FADE_SHARE, FADE_SHARE)).toBeCloseTo(1, 6);
    expect(obstacleFadeLevel(0.5, FADE_SHARE)).toBe(1);
  });

  it('ramps up over the first slice of the lifetime', () => {
    const early = obstacleFadeLevel(1 - FADE_SHARE * 0.25, FADE_SHARE);
    const later = obstacleFadeLevel(1 - FADE_SHARE * 0.75, FADE_SHARE);

    expect(early).toBeGreaterThan(0);
    expect(later).toBeGreaterThan(early);
    expect(later).toBeLessThan(1);
  });

  it('ramps back down over the last slice', () => {
    const fading = obstacleFadeLevel(FADE_SHARE * 0.5, FADE_SHARE);

    expect(fading).toBeCloseTo(0.5, 6);
    expect(obstacleFadeLevel(FADE_SHARE, FADE_SHARE)).toBeCloseTo(1, 6);
  });

  it('is invisible once the obstacle has expired', () => {
    expect(obstacleFadeLevel(0, FADE_SHARE)).toBe(0);
    expect(obstacleFadeLevel(-0.5, FADE_SHARE)).toBe(0);
  });

  it('never reports more than fully solid, whatever it is handed', () => {
    // The engine promises a value in (0, 1], but an opacity above 1 would throw off
    // every colour built from it rather than simply looking wrong.
    expect(obstacleFadeLevel(4, FADE_SHARE)).toBeLessThanOrEqual(1);
  });

  it('draws solid throughout when there is no fade configured', () => {
    expect(obstacleFadeLevel(1, 0)).toBe(1);
    expect(obstacleFadeLevel(0.5, 0)).toBe(1);
  });

  it('survives a fade share so long the two ramps overlap', () => {
    // With a fade share above one half the obstacle is always fading at one end or
    // the other. It should stay in range rather than exceeding 1 in the middle.
    for (let life = 0; life <= 1; life += 0.05) {
      const level = obstacleFadeLevel(life, 0.9);

      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(1);
    }
  });

  it('treats missing numbers as nothing to draw', () => {
    expect(obstacleFadeLevel(undefined, FADE_SHARE)).toBe(0);
    expect(obstacleFadeLevel(Number.NaN, FADE_SHARE)).toBe(0);
  });
});
