import { describe, expect, it } from 'vitest';

// Everything Mend, on both of its levels: `MendState` on its own, and the rules it imposes on
// the field around it — the spawn order that skips it, the marker that cannot be picked up, and
// the fact that it produces no buff. Split off `powerups.test.js` when that file ran up against
// the 400-line limit, the same way `playerObstacleBlock.test.js` was split off
// `playerController.test.js`. The harness below is that file's `Driver` minus what Mend does not
// need; duplicating a few lines of setup is the price of the split and the cheaper half of it.

import { PLAYER_STARTING_LIVES, SIMULATION_STEP_MS } from '../../gameConfig.js';
import { MEND_ARC_SECONDS } from '../../renderer/mendPulse.js';
import { INERT_FADE_MS, MEND_SEGMENTS, MendState } from '../mend.js';
import { PowerupField, SPAWN_INTERVAL_MS } from '../powerups.js';

const MAX_LIVES = PLAYER_STARTING_LIVES;
const WORLD = 2400;
/** A corner the player can stand in without being anywhere near a marker. */
const FAR_AWAY = 40;

/** Steps the state the way `PowerupField.step` does, at one life count for a while. */
function observeFor(mend, ms, lives) {
  const steps = Math.round(ms / SIMULATION_STEP_MS);

  for (let step = 0; step < steps; step += 1) {
    mend.observeLives(lives);
  }
}

/**
 * Drives a whole field on a simulation clock the way `index.js` does, and owns the life count
 * the way `roundData` does — which is the point: the field only ever *reads* it, so a test can
 * hold it outside and nothing in `powerups/` can disagree.
 */
class Driver {
  constructor() {
    // A fixed RNG of 0.5 puts every marker dead centre, so a spawn is always in the same place.
    this.field = new PowerupField(() => 0.5);
    this.reset();
  }

  reset() {
    this.nowMs = 0;
    this.lives = MAX_LIVES;
    this.field.reset(WORLD, WORLD, MAX_LIVES);
  }

  absorbHit() {
    return this.field.absorbHit(this.nowMs);
  }

  hurt(segments = 1) {
    this.lives -= segments;
  }

  heal() {
    this.lives = Math.min(MAX_LIVES, this.lives + MEND_SEGMENTS);
  }

  step(x = FAR_AWAY, y = FAR_AWAY) {
    this.nowMs += SIMULATION_STEP_MS;

    return this.field.step(this.nowMs, x, y, undefined, this.lives);
  }

  idle(ms) {
    const steps = Math.round(ms / SIMULATION_STEP_MS);

    for (let step = 0; step < steps; step += 1) {
      this.step();
    }
  }

  snapshot() {
    return this.field.snapshot(this.nowMs);
  }

  markers() {
    return this.snapshot().powerupMarkers;
  }
}

/**
 * Drives the field up to the point where a Mend marker is lying in the arena.
 *
 * Two intervals are needed, and that is the spawn order doing its job rather than an accident:
 * Mend sits between the other two, so it can only ever be the *second* thing offered.
 */
function driverWithAMendMarker() {
  const driver = new Driver();
  driver.hurt();
  driver.idle(SPAWN_INTERVAL_MS + 100);

  // Take the first offering away, or the second has no room to appear.
  const first = driver.markers()[0];
  driver.step(first.x, first.y);
  driver.idle(SPAWN_INTERVAL_MS + 100);

  return driver;
}

describe('canMend', () => {
  it('has nothing to give at full lives', () => {
    const mend = new MendState(MAX_LIVES);

    expect(mend.canMend()).toBe(false);
  });

  it('has something to give as soon as one segment is missing', () => {
    const mend = new MendState(MAX_LIVES);
    mend.observeLives(MAX_LIVES - MEND_SEGMENTS);

    expect(mend.canMend()).toBe(true);
  });

  it('reads a caller that tracks no lives at all as full', () => {
    // The reading that offers nothing, rather than the one that offers a heal nobody asked for.
    const mend = new MendState(MAX_LIVES);
    mend.observeLives(undefined);

    expect(mend.canMend()).toBe(false);
  });
});

describe('the drain to slate', () => {
  it('opens inert, because a round opens at full lives', () => {
    expect(new MendState(MAX_LIVES).inertAmount()).toBe(1);
  });

  it('comes fully live within the fade once a life is missing', () => {
    const mend = new MendState(MAX_LIVES);
    observeFor(mend, INERT_FADE_MS, MAX_LIVES - 1);

    expect(mend.inertAmount()).toBe(0);
  });

  it('walks rather than switches, so it is halfway at half the fade', () => {
    const mend = new MendState(MAX_LIVES);
    observeFor(mend, INERT_FADE_MS / 2, MAX_LIVES - 1);

    // A marker that changes state between two frames reads as a different marker.
    expect(mend.inertAmount()).toBeGreaterThan(0);
    expect(mend.inertAmount()).toBeLessThan(1);
  });

  it('goes back the same way when the lives fill up again', () => {
    const mend = new MendState(MAX_LIVES);
    observeFor(mend, INERT_FADE_MS, MAX_LIVES - 1);

    observeFor(mend, INERT_FADE_MS / 2, MAX_LIVES);
    expect(mend.inertAmount()).toBeGreaterThan(0);
    expect(mend.inertAmount()).toBeLessThan(1);

    observeFor(mend, INERT_FADE_MS, MAX_LIVES);
    expect(mend.inertAmount()).toBe(1);
  });

  it('never leaves the range it is drawn from, however long it is stepped', () => {
    const mend = new MendState(MAX_LIVES);

    observeFor(mend, INERT_FADE_MS * 4, MAX_LIVES - 1);
    expect(mend.inertAmount()).toBe(0);

    observeFor(mend, INERT_FADE_MS * 4, MAX_LIVES);
    expect(mend.inertAmount()).toBe(1);
  });
});

describe('the moment', () => {
  it('reports nothing before a heal ever happened', () => {
    expect(new MendState(MAX_LIVES).arcAge(0)).toBeUndefined();
  });

  it('reports the age in seconds while the arc runs', () => {
    const mend = new MendState(MAX_LIVES);
    mend.markGranted(5000);

    expect(mend.arcAge(5000)).toBe(0);
    expect(mend.arcAge(5200)).toBeCloseTo(0.2, 5);
  });

  it('stops reporting once the arc is over, because an event has nothing left to show', () => {
    const mend = new MendState(MAX_LIVES);
    mend.markGranted(5000);

    expect(mend.arcAge(5000 + MEND_ARC_SECONDS * 1000 + 1)).toBeUndefined();
  });
});

describe('reset', () => {
  it('leaves no moment and no colour from the previous round behind', () => {
    const mend = new MendState(MAX_LIVES);
    observeFor(mend, INERT_FADE_MS, MAX_LIVES - 1);
    mend.markGranted(5000);

    mend.reset(MAX_LIVES);

    expect(mend.arcAge(5000)).toBeUndefined();
    expect(mend.canMend()).toBe(false);
    expect(mend.inertAmount()).toBe(1);
  });

  it('takes a new maximum, so it can never disagree with the segments drawn', () => {
    const mend = new MendState(MAX_LIVES);
    mend.reset(5);

    mend.observeLives(MAX_LIVES);
    expect(mend.canMend()).toBe(true);
  });
});

describe('mend in the field', () => {
  it('is passed over at full lives rather than spawned dead', () => {
    const driver = new Driver();

    // Four intervals at full lives: with Mend skipped every time, only the other two can
    // appear, however often the order comes round to it.
    for (let interval = 0; interval < 4; interval += 1) {
      driver.idle(SPAWN_INTERVAL_MS + 100);
      const marker = driver.markers()[0];

      if (marker !== undefined) {
        expect(marker.kind).not.toBe('mend');
        driver.step(marker.x, marker.y);
      }
    }
  });

  it('is offered once a life is missing', () => {
    expect(driverWithAMendMarker().markers()[0].kind).toBe('mend');
  });

  it('gives one segment back and never a second one in a row', () => {
    const driver = driverWithAMendMarker();
    const mend = driver.markers()[0];

    expect(driver.step(mend.x, mend.y)).toBe('mend');
    driver.heal();
    expect(driver.lives).toBe(PLAYER_STARTING_LIVES);

    // Back at full lives, so the next offering cannot be another Mend — two hits in a row must
    // not become free.
    driver.idle(SPAWN_INTERVAL_MS + 100);
    expect(driver.markers()[0].kind).not.toBe('mend');
  });

  it('holds no buff, because it is an event and not a state', () => {
    const driver = driverWithAMendMarker();
    const mend = driver.markers()[0];
    driver.step(mend.x, mend.y);

    // No HUD row, no remaining-time arc, and nothing that could absorb or accelerate anything.
    expect(driver.snapshot().powerupBuffs.mend).toBeUndefined();
    expect(driver.field.isActive('mend')).toBe(false);
    expect(driver.field.speedMultiplier()).toBe(1);
    expect(driver.absorbHit()).toBe(false);
  });

  it('draws its arc once and then has nothing left to show', () => {
    const driver = driverWithAMendMarker();
    const mend = driver.markers()[0];
    driver.step(mend.x, mend.y);

    expect(driver.snapshot().mendArcAge).toBeGreaterThanOrEqual(0);

    driver.idle(600);
    expect(driver.snapshot().mendArcAge).toBeUndefined();
  });

  it('goes inert instead of vanishing when the lives fill up under it', () => {
    const driver = driverWithAMendMarker();
    const mend = driver.markers()[0];
    driver.heal();
    driver.idle(INERT_FADE_MS + 100);

    // Still lying there, but grey and not to be had: a marker that disappears in front of the
    // player feels stolen, one that goes grey explains itself.
    expect(driver.markers()[0].inert).toBe(1);
    expect(driver.step(mend.x, mend.y)).toBeNull();
    expect(driver.markers()).toHaveLength(1);
  });

  it('comes back on the same path when a life is lost again', () => {
    const driver = driverWithAMendMarker();
    const mend = driver.markers()[0];
    driver.heal();
    driver.idle(INERT_FADE_MS + 100);

    driver.hurt();
    driver.idle(INERT_FADE_MS + 100);

    expect(driver.markers()[0].inert).toBe(0);
    expect(driver.step(mend.x, mend.y)).toBe('mend');
  });

  it('is the only marker kind that is ever anything but fully live', () => {
    const driver = new Driver();
    driver.idle(SPAWN_INTERVAL_MS + 100);

    expect(driver.markers()[0].inert).toBe(0);
  });

  it('leaves no arc behind for the next round', () => {
    const driver = driverWithAMendMarker();
    const mend = driver.markers()[0];
    driver.step(mend.x, mend.y);

    driver.reset();

    expect(driver.snapshot().mendArcAge).toBeUndefined();
  });
});
