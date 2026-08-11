import { describe, expect, it } from 'vitest';

// The two buffs a `PowerupField` runs **on the player**: Aegis' charge and the window it
// leaves behind, Overdrive's speed factor, and the two of them at once. Split off
// `powerups.test.js` when the 400-line limit was reached, the same way `mend.test.js` was —
// what stayed there is everything about markers in the arena, spawning and collecting.
//
// The harness is its own, and smaller than the one over there for the same reason: nothing in
// this file looks at a marker, so all it needs is a simulation clock.

import {
  PLAYER_DASH_SPEED,
  PLAYER_MAX_SPEED,
  PLAYER_STARTING_LIVES,
  SIMULATION_STEP_MS,
} from '../../gameConfig.js';
import {
  AEGIS_ABSORB_INVULNERABILITY_MS,
  AEGIS_DURATION_MS,
  OVERDRIVE_FACTOR,
  PowerupField,
} from '../powerups.js';

const WORLD = 2400;
/** A corner the player stands in, so a marker that does spawn is never collected by accident. */
const FAR_AWAY = 40;

/**
 * Drives a field on a simulation clock the way `index.js` does. `reset` puts the clock back to
 * zero for the same reason `beginRound()` does: every timestamp in the field is measured
 * against it, including the window a broken shield leaves behind.
 */
class Driver {
  constructor() {
    this.field = new PowerupField(() => 0.5);
    this.reset();
  }

  reset() {
    this.nowMs = 0;
    this.field.reset(WORLD, WORLD, PLAYER_STARTING_LIVES);
  }

  /** Advances the clock by `ms`, in whole simulation steps, exactly as the loop would. */
  idle(ms) {
    const steps = Math.round(ms / SIMULATION_STEP_MS);

    for (let step = 0; step < steps; step += 1) {
      this.nowMs += SIMULATION_STEP_MS;
      this.field.step(this.nowMs, FAR_AWAY, FAR_AWAY, undefined, PLAYER_STARTING_LIVES);
    }
  }

  snapshot() {
    return this.field.snapshot(this.nowMs);
  }

  grant(kind) {
    this.field.grant(kind, this.nowMs);
  }

  absorbHit() {
    return this.field.absorbHit(this.nowMs);
  }

  isInvulnerable() {
    return this.field.isInvulnerable(this.nowMs);
  }
}

describe('aegis', () => {
  it('is spent by the first hit but keeps covering the player for its window', () => {
    const driver = new Driver();
    driver.grant('aegis');

    expect(driver.absorbHit()).toBe(true);
    expect(driver.field.isActive('aegis')).toBe(false);

    // The charge is gone, so this one is on the window the break left behind — which is the
    // whole point: a dash through a swarm lands several hits inside a few steps.
    expect(driver.absorbHit()).toBe(true);
    expect(driver.isInvulnerable()).toBe(true);
  });

  it('stops absorbing once the window has elapsed', () => {
    const driver = new Driver();
    driver.grant('aegis');
    driver.absorbHit();

    driver.idle(AEGIS_ABSORB_INVULNERABILITY_MS - 200);
    expect(driver.absorbHit()).toBe(true);

    driver.idle(400);
    expect(driver.isInvulnerable()).toBe(false);
    expect(driver.absorbHit()).toBe(false);
  });

  it('keeps a shield picked up during the window, because there was nothing to eat', () => {
    const driver = new Driver();
    driver.grant('aegis');
    driver.absorbHit();

    driver.grant('aegis');
    expect(driver.absorbHit()).toBe(true);
    expect(driver.field.isActive('aegis')).toBe(true);
  });

  it('absorbs nothing when it is not running', () => {
    expect(new Driver().absorbHit()).toBe(false);
  });

  it('claims no invulnerability before a hit has broken it', () => {
    const driver = new Driver();
    driver.grant('aegis');

    expect(driver.isInvulnerable()).toBe(false);
  });

  it('forgets a running window on a round reset, where the clock goes back to zero', () => {
    const driver = new Driver();
    driver.grant('aegis');
    driver.absorbHit();

    driver.reset();
    expect(driver.isInvulnerable()).toBe(false);
  });

  it('shows the shatter briefly and then stops', () => {
    const driver = new Driver();
    driver.grant('aegis');
    driver.absorbHit();

    expect(driver.snapshot().aegisShatterAge).toBeGreaterThanOrEqual(0);

    driver.idle(500);
    expect(driver.snapshot().aegisShatterAge).toBeUndefined();
  });

  it('runs out on its own when no hit ever comes', () => {
    const driver = new Driver();
    driver.grant('aegis');

    driver.idle(AEGIS_DURATION_MS - 300);
    expect(driver.field.isActive('aegis')).toBe(true);

    driver.idle(600);
    expect(driver.field.isActive('aegis')).toBe(false);
  });

  it('drains its arc from full to empty', () => {
    const driver = new Driver();
    driver.grant('aegis');
    expect(driver.snapshot().powerupBuffs.aegis).toBeCloseTo(1, 1);

    driver.idle(AEGIS_DURATION_MS / 2);
    expect(driver.snapshot().powerupBuffs.aegis).toBeCloseTo(0.5, 1);
  });
});

describe('overdrive', () => {
  it('is the only thing that touches the speed multiplier', () => {
    const driver = new Driver();
    expect(driver.field.speedMultiplier()).toBe(1);

    driver.grant('overdrive');
    expect(driver.field.speedMultiplier()).toBe(OVERDRIVE_FACTOR);
  });

  it('stays below dash speed, so it opens no new tunnelling window', () => {
    expect(PLAYER_MAX_SPEED * OVERDRIVE_FACTOR).toBeLessThan(PLAYER_DASH_SPEED);
  });

  it('gives the speed back when it expires', () => {
    const driver = new Driver();
    driver.grant('overdrive');

    driver.idle(7000);
    expect(driver.field.speedMultiplier()).toBe(1);
  });

  it('does not absorb hits — that is the other one', () => {
    const driver = new Driver();
    driver.grant('overdrive');

    expect(driver.absorbHit()).toBe(false);
  });
});

describe('both at once', () => {
  it('runs them independently, each with its own arc', () => {
    const driver = new Driver();
    driver.grant('aegis');
    driver.grant('overdrive');

    const buffs = driver.snapshot().powerupBuffs;
    expect(buffs.aegis).toBeGreaterThan(0);
    expect(buffs.overdrive).toBeGreaterThan(0);

    driver.absorbHit();
    expect(driver.snapshot().powerupBuffs.aegis).toBeUndefined();
    expect(driver.field.speedMultiplier()).toBe(OVERDRIVE_FACTOR);
  });

  it('restarts a buff at full duration instead of stacking it', () => {
    const driver = new Driver();
    driver.grant('overdrive');
    driver.idle(3000);
    driver.grant('overdrive');

    expect(driver.snapshot().powerupBuffs.overdrive).toBeCloseTo(1, 1);
  });
});
