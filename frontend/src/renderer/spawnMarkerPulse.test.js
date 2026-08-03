import { describe, expect, it } from 'vitest';
import {
  spawnMarkerFlicker,
  spawnMarkerIntensity,
  spawnMarkerRingScale,
} from './spawnMarkerPulse.js';
import {
  SPAWN_MARKER_MINIMUM_INTENSITY,
  SPAWN_MARKER_PULSE_DEPTH,
  SPAWN_MARKER_PULSE_HZ,
  SPAWN_MARKER_RING_END_SCALE,
  SPAWN_MARKER_RING_START_SCALE,
} from '../gameConfig.js';

// The two numbers a spawn marker is drawn from, and the flicker on top of them. Worth
// asserting on rather than leaving to the eye, because both ends of both ramps carry a
// meaning: the intensity's floor is what makes a freshly announced wave visible at all,
// and the ring's end scale is what makes it land on the spawn point instead of near it.

describe('spawnMarkerIntensity', () => {
  it('starts at the floor rather than at nothing', () => {
    // A marker that faded up from zero would be invisible for the first half of exactly
    // the window it exists to fill.
    expect(spawnMarkerIntensity(0)).toBe(SPAWN_MARKER_MINIMUM_INTENSITY);
  });

  it('reaches full strength as the boids arrive', () => {
    expect(spawnMarkerIntensity(1)).toBeCloseTo(1, 5);
  });

  it('brightens monotonically across the warning', () => {
    let previous = -1;

    for (let step = 0; step <= 20; step += 1) {
      const intensity = spawnMarkerIntensity(step / 20);

      expect(intensity).toBeGreaterThan(previous);
      previous = intensity;
    }
  });

  it('clamps a progress the engine promised not to send', () => {
    // The engine's contract is [0, 1). Honouring it here anyway keeps a future buffer
    // change from drawing a glow at a negative opacity, which paints nothing at all.
    expect(spawnMarkerIntensity(-3)).toBe(SPAWN_MARKER_MINIMUM_INTENSITY);
    expect(spawnMarkerIntensity(4)).toBeCloseTo(1, 5);
    expect(spawnMarkerIntensity(Number.NaN)).toBe(SPAWN_MARKER_MINIMUM_INTENSITY);
  });
});

describe('spawnMarkerRingScale', () => {
  it('opens wide and closes onto the spawn point', () => {
    expect(spawnMarkerRingScale(0)).toBe(SPAWN_MARKER_RING_START_SCALE);
    expect(spawnMarkerRingScale(1)).toBeCloseTo(SPAWN_MARKER_RING_END_SCALE, 5);
  });

  it('shrinks rather than grows, unlike the obstacle spawn ring', () => {
    // The direction is the statement: an obstacle is already where it will be, a marker
    // points at somewhere still empty. A sign error here would say the opposite.
    let previous = Number.POSITIVE_INFINITY;

    for (let step = 0; step <= 20; step += 1) {
      const scale = spawnMarkerRingScale(step / 20);

      expect(scale).toBeLessThan(previous);
      previous = scale;
    }
  });

  it('never closes inside the glow it belongs to', () => {
    for (let step = 0; step <= 20; step += 1) {
      expect(spawnMarkerRingScale(step / 20)).toBeGreaterThanOrEqual(SPAWN_MARKER_RING_END_SCALE);
    }
  });
});

describe('spawnMarkerFlicker', () => {
  it('is at full brightness at the start of a beat', () => {
    expect(spawnMarkerFlicker(0)).toBeCloseTo(1, 5);
  });

  it('dips to exactly the configured depth at the trough', () => {
    // Half a beat in, where the cosine is at -1.
    const halfBeat = 0.5 / SPAWN_MARKER_PULSE_HZ;

    expect(spawnMarkerFlicker(halfBeat)).toBeCloseTo(1 - SPAWN_MARKER_PULSE_DEPTH, 5);
  });

  it('never blinks out entirely', () => {
    // A marker that reached zero would read as gone rather than as pulsing, which is the
    // opposite of what a warning should do.
    for (let step = 0; step <= 200; step += 1) {
      const flicker = spawnMarkerFlicker(step / 40);

      expect(flicker).toBeGreaterThanOrEqual(1 - SPAWN_MARKER_PULSE_DEPTH - 1e-6);
      expect(flicker).toBeLessThanOrEqual(1);
    }
  });

  it('repeats once per beat', () => {
    const beat = 1 / SPAWN_MARKER_PULSE_HZ;

    expect(spawnMarkerFlicker(0.13)).toBeCloseTo(spawnMarkerFlicker(0.13 + beat), 5);
  });
});
