import { describe, expect, it } from 'vitest';

import { MAX_TRAILS, TRAIL_SAMPLES } from '../dashTrail.js';
import { DashTrails } from '../dashTrailHistory.js';

/** Writes `count` samples one step apart along +x, so no jump check ever trips. */
function sampleLine(trails, count, strength = 1) {
  for (let step = 0; step < count; step += 1) {
    trails.advance(1 / 60);
    trails.samplePlayer(step * 10, 0, 1, 0, strength);
    trails.settle();
  }
}

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
