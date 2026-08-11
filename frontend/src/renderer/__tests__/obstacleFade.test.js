import { describe, expect, it } from 'vitest';
import { obstacleFadeLevel } from '../obstacleFade.js';

// Mirrored rather than imported: the test pins the shape of the ramp, not the tuning.
const FADE_SHARE = 0.1;

describe('obstacleFadeLevel', () => {
  it('starts invisible the instant an obstacle appears', () => {
    // The render phase is exactly -1 on the first frame, so a fade that already
    // returned 1 there would pop the obstacle in rather than announce it.
    expect(obstacleFadeLevel(-1, FADE_SHARE)).toBe(0);
  });

  it('ramps up over the materialising window', () => {
    // What the player reads as the warning. The window belongs to the engine, so the
    // ramp has to follow the phase alone and ignore the fade share entirely.
    const early = obstacleFadeLevel(-0.75, FADE_SHARE);
    const later = obstacleFadeLevel(-0.25, FADE_SHARE);

    expect(early).toBeCloseTo(0.25, 6);
    expect(later).toBeCloseTo(0.75, 6);
    expect(later).toBeGreaterThan(early);
  });

  it('is fully solid as soon as the obstacle stops materialising', () => {
    // The two phases have to meet at full opacity, or the obstacle would flicker on the
    // step it becomes solid — which is the step it starts costing a life.
    expect(obstacleFadeLevel(1, FADE_SHARE)).toBe(1);
    expect(obstacleFadeLevel(0.5, FADE_SHARE)).toBe(1);
  });

  it('ramps back down over the last slice of the lifetime', () => {
    const fading = obstacleFadeLevel(FADE_SHARE * 0.5, FADE_SHARE);

    expect(fading).toBeCloseTo(0.5, 6);
    expect(obstacleFadeLevel(FADE_SHARE, FADE_SHARE)).toBeCloseTo(1, 6);
  });

  it('is invisible once the obstacle has expired', () => {
    expect(obstacleFadeLevel(0, FADE_SHARE)).toBe(0);
  });

  it('never reports more than fully solid, whatever it is handed', () => {
    // The engine promises a value in [-1, 1] without 0, but an opacity above 1 would
    // throw off every colour built from it rather than simply looking wrong.
    expect(obstacleFadeLevel(4, FADE_SHARE)).toBe(1);
    expect(obstacleFadeLevel(-4, FADE_SHARE)).toBe(0);
  });

  it('draws solid throughout when there is no closing fade configured', () => {
    expect(obstacleFadeLevel(1, 0)).toBe(1);
    expect(obstacleFadeLevel(0.5, 0)).toBe(1);
  });

  it('still fades a materialising obstacle in without a closing fade', () => {
    // The two ends are independent now: the appearing ramp is the engine's window and
    // must survive a fade share of zero.
    expect(obstacleFadeLevel(-0.5, 0)).toBeCloseTo(0.5, 6);
  });

  it('treats missing numbers as nothing to draw', () => {
    expect(obstacleFadeLevel(undefined, FADE_SHARE)).toBe(0);
    expect(obstacleFadeLevel(Number.NaN, FADE_SHARE)).toBe(0);
  });
});
