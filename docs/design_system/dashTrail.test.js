import { describe, expect, it } from 'vitest';

import {
  boidTrailStrength,
  coreAlpha,
  coreHalfWidth,
  DashTrails,
  launchRingAlpha,
  launchRingRadius,
  LAUNCH_RING_SECONDS,
  MAX_TRAILS,
  ribbonAlpha,
  ribbonHalfWidth,
  TRAIL_SAMPLES,
  trailStrength,
} from './dashTrail.js';

const MAX_SPEED = 360;
const DASH_SPEED = 1100;

/** Writes `count` samples one step apart along +x, so no jump check ever trips. */
function sampleLine(trails, count, strength = 1) {
  for (let step = 0; step < count; step += 1) {
    trails.advance(1 / 60);
    trails.samplePlayer(step * 10, 0, 1, 0, strength);
    trails.settle();
  }
}

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

describe('DashTrails', () => {
  it('ignores a sample with no strength, so an idle object owns no slot', () => {
    const trails = new DashTrails();
    trails.advance(1 / 60);
    trails.samplePlayer(10, 10, 1, 0, 0);
    trails.settle();
    expect(trails.count(0)).toBe(0);
  });

  it('keeps samples oldest-first', () => {
    const trails = new DashTrails();
    sampleLine(trails, 4);
    const count = trails.count(0);
    expect(count).toBe(4);
    expect(trails.samples[trails.offsetOf(0, 0)]).toBe(0);
    expect(trails.samples[trails.offsetOf(0, count - 1)]).toBe(30);
  });

  it('drops the oldest sample once the ring is full', () => {
    const trails = new DashTrails();
    sampleLine(trails, TRAIL_SAMPLES + 5);
    expect(trails.count(0)).toBe(TRAIL_SAMPLES);
    expect(trails.samples[trails.offsetOf(0, 0)]).toBe(5 * 10);
  });

  it('retracts a trail nobody wrote to, one sample per frame', () => {
    const trails = new DashTrails();
    sampleLine(trails, 6);

    trails.advance(1 / 60);
    trails.settle();
    expect(trails.count(0)).toBe(5);

    for (let frame = 0; frame < 5; frame += 1) {
      trails.advance(1 / 60);
      trails.settle();
    }
    expect(trails.count(0)).toBe(0);
  });

  it('starts a fresh trail when the object jumps — a wrap or a reassigned index', () => {
    const trails = new DashTrails();
    sampleLine(trails, 6);

    trails.advance(1 / 60);
    trails.samplePlayer(1900, 0, -1, 0, 1);
    trails.settle();

    expect(trails.count(0)).toBe(1);
    expect(trails.samples[trails.offsetOf(0, 0)]).toBe(1900);
  });

  it("opens the launch ring on a trail's first sample and closes it when it is done", () => {
    const trails = new DashTrails();
    trails.advance(1 / 60);
    trails.samplePlayer(100, 50, 1, 0, 1);
    trails.settle();

    expect(trails.ringAge(0)).toBe(0);
    expect(trails.ringX(0)).toBe(100);
    expect(trails.ringY(0)).toBe(50);

    // In steps of a tenth of a second: `advance` clamps a single delta, so a stalled tab
    // cannot age the ring out in one jump.
    for (let frame = 0; frame < 5; frame += 1) {
      trails.advance(0.1);
    }
    expect(trails.ringAge(0)).toBe(-1);
  });

  it('gives every dashing boid its own slot and keeps their tiers apart', () => {
    const trails = new DashTrails();
    trails.advance(1 / 60);
    trails.sampleBoid(3, 2, 10, 10, 1, 0, 1);
    trails.sampleBoid(7, 4, 90, 90, 0, 1, 1);
    trails.settle();

    expect(trails.count(0)).toBe(1);
    expect(trails.count(1)).toBe(1);
    expect(trails.tier(0)).toBe(2);
    expect(trails.tier(1)).toBe(4);
  });

  it('reuses the same slot for the same boid across frames', () => {
    const trails = new DashTrails();
    for (let frame = 0; frame < 3; frame += 1) {
      trails.advance(1 / 60);
      trails.sampleBoid(5, 1, frame * 12, 0, 1, 0, 1);
      trails.settle();
    }
    expect(trails.count(0)).toBe(3);
    expect(trails.count(1)).toBe(0);
  });

  it('frees a slot again once its trail has fully retracted', () => {
    const trails = new DashTrails();
    trails.advance(1 / 60);
    trails.sampleBoid(5, 1, 0, 0, 1, 0, 1);
    trails.settle();

    trails.advance(1 / 60);
    trails.settle();

    trails.advance(1 / 60);
    trails.sampleBoid(9, 3, 500, 500, 1, 0, 1);
    trails.settle();

    expect(trails.count(0)).toBe(1);
    expect(trails.tier(0)).toBe(3);
  });

  it('drops trails beyond its capacity instead of growing mid-frame', () => {
    const trails = new DashTrails();
    trails.advance(1 / 60);
    for (let boidIndex = 0; boidIndex < MAX_TRAILS + 4; boidIndex += 1) {
      trails.sampleBoid(boidIndex, 0, boidIndex * 40, 0, 1, 0, 1);
    }
    trails.settle();

    let occupied = 0;
    for (let slot = 0; slot < MAX_TRAILS; slot += 1) {
      if (trails.count(slot) > 0) occupied += 1;
    }
    expect(occupied).toBe(MAX_TRAILS);
  });

  it('forgets everything on reset, the way a new round needs', () => {
    const trails = new DashTrails();
    sampleLine(trails, 8);
    trails.reset();
    expect(trails.count(0)).toBe(0);
    expect(trails.ringAge(0)).toBe(-1);
  });
});
