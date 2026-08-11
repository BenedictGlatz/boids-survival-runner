import { describe, expect, it } from 'vitest';
import { dashAimAlpha, dashGlowLevel, dashPulseScale } from '../dashPulse.js';

/**
 * Samples a whole charge-up the way the renderer sees it: the engine reports a
 * phase between 0 (exclusive) and 1 (exclusive) while a boid charges.
 */
function sampleChargeUp(sampleCount, read) {
  const samples = [];

  for (let index = 1; index <= sampleCount; index += 1) {
    samples.push(read(index / (sampleCount + 1)));
  }

  return samples;
}

/** Counts how often a series crosses the middle of its range, upwards. */
function countRisingCrossings(samples, threshold) {
  let crossings = 0;

  for (let index = 1; index < samples.length; index += 1) {
    if (samples[index - 1] <= threshold && samples[index] > threshold) {
      crossings += 1;
    }
  }

  return crossings;
}

describe('dashPulseScale', () => {
  it('leaves a boid at its normal size when there is nothing to draw', () => {
    // Phase 0 is by far the most common case: idle boids and boids on cooldown.
    expect(dashPulseScale(0)).toBe(1);
  });

  it('never shrinks a boid below its normal size while charging', () => {
    // A boid smaller than usual would read as further away, not as a threat.
    for (const scale of sampleChargeUp(200, dashPulseScale)) {
      expect(scale).toBeGreaterThanOrEqual(1);
    }
  });

  it('keeps the growth within a readable range while charging', () => {
    for (const scale of sampleChargeUp(200, dashPulseScale)) {
      expect(scale).toBeLessThanOrEqual(2);
    }
  });

  it('draws a dashing boid larger than an idle one', () => {
    expect(dashPulseScale(-1)).toBeGreaterThan(1);
    expect(dashPulseScale(-0.1)).toBeGreaterThan(1);
  });
});

describe('dashGlowLevel', () => {
  it('leaves a boid at its normal colour when there is nothing to draw', () => {
    expect(dashGlowLevel(0)).toBe(0);
  });

  it('stays inside the 0 to 1 range the colour table is indexed with', () => {
    // A value outside this range would index past the precomputed shades.
    for (const level of sampleChargeUp(200, dashGlowLevel)) {
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(1);
    }
  });

  it('keeps a dashing boid at full brightness for the whole dash', () => {
    expect(dashGlowLevel(-1)).toBe(1);
    expect(dashGlowLevel(-0.5)).toBe(1);
  });

  it('pulses faster towards the end of the charge-up than at its start', () => {
    // This is the part of the warning that tells the player *when* the lunge
    // comes, not just that one is coming, so it is worth pinning down.
    const samples = sampleChargeUp(400, dashGlowLevel);
    const firstHalf = samples.slice(0, samples.length / 2);
    const secondHalf = samples.slice(samples.length / 2);

    expect(countRisingCrossings(secondHalf, 0.25)).toBeGreaterThan(
      countRisingCrossings(firstHalf, 0.25),
    );
  });

  it('reaches its brightest peaks near the launch rather than at the start', () => {
    const samples = sampleChargeUp(400, dashGlowLevel);
    const firstHalfPeak = Math.max(...samples.slice(0, samples.length / 2));
    const secondHalfPeak = Math.max(...samples.slice(samples.length / 2));

    expect(secondHalfPeak).toBeGreaterThan(firstHalfPeak);
  });
});

describe('dashAimAlpha', () => {
  it('draws no line at all for a boid that is not charging', () => {
    // The engine leaves those out of the aim buffer entirely, so this is the second lock on
    // the same rule: a dash that has launched must not keep announcing itself.
    expect(dashAimAlpha(0)).toBe(0);
    expect(dashAimAlpha(-1)).toBe(0);
    expect(dashAimAlpha(-0.2)).toBe(0);
  });

  it('is already clearly visible the moment the charge-up begins', () => {
    // The warning lasts 0.57 to 0.73 s. A line that faded up from nothing would spend a
    // third of that being invisible, which is a third of the time the player has to react.
    expect(dashAimAlpha(0.001)).toBeGreaterThan(0.2);
  });

  it('reaches full strength at the launch', () => {
    expect(dashAimAlpha(1)).toBeCloseTo(1, 5);
  });

  it('strengthens monotonically across the charge-up', () => {
    // Steadily rather than in pulses: the boid's own glow is what beats, and the line is
    // what says where. Two things beating at once would be one thing too many.
    let previous = -1;

    for (const alpha of sampleChargeUp(200, dashAimAlpha)) {
      expect(alpha).toBeGreaterThan(previous);
      previous = alpha;
    }
  });

  it('stays inside the 0 to 1 range the colour table is indexed with', () => {
    for (const alpha of sampleChargeUp(200, dashAimAlpha)) {
      expect(alpha).toBeGreaterThanOrEqual(0);
      expect(alpha).toBeLessThanOrEqual(1);
    }
  });

  it('clamps a progress the engine promised not to send', () => {
    expect(dashAimAlpha(4)).toBeCloseTo(1, 5);
    expect(dashAimAlpha(Number.NaN)).toBe(0);
  });
});
