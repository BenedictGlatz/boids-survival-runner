import { describe, expect, it } from 'vitest';

// A marker's time on the ground, on both levels: the arithmetic on its own, and then the same
// rules driven through a real `PowerupField` — because "an obstacle grew over a marker" is only
// visible across two consecutive steps, and a single call can never show it. That is the same
// lesson the player-in-an-obstacle bug taught (see the journal entry of 2026-07-30): a state you
// cannot get out of needs two calls to be seen at all.

import { OBSTACLE_STRIDE, PLAYER_STARTING_LIVES, SIMULATION_STEP_MS } from '../../gameConfig.js';
import { PICKUP_RADIUS } from '../../renderer/powerupMarkerLayer.js';
import { MIN_OBSTACLE_CLEARANCE } from '../markerClearance.js';
import {
  hasLeftTheArena,
  isCoveredByAnObstacle,
  MARKER_LIFETIME_MS,
  markerRemaining,
  markerScale,
  newMarker,
} from '../markerLifetime.js';
import { PowerupField, SPAWN_INTERVAL_MS } from '../powerups.js';

const WORLD = 2400;
/** A fixed RNG of 0.5 places every marker dead centre: 2400 * (0.1 + 0.5 * 0.8). */
const CENTRE = WORLD * 0.5;
/** A corner the player can stand in without being anywhere near a marker. */
const FAR_AWAY = 40;

/** A circular obstacle in the engine's flat layout — a capsule whose spine has no length. */
function frameWithCircle(x, y, radius) {
  const obstacles = new Float32Array(OBSTACLE_STRIDE);
  obstacles[0] = x;
  obstacles[1] = y;
  obstacles[2] = x;
  obstacles[3] = y;
  obstacles[4] = radius;

  return { obstacles, obstacleCount: 1 };
}

/**
 * A field on a simulation clock, kept small on purpose — `powerups.test.js` has the full harness
 * and `mend.test.js` has its own for the same reason: what a driver needs differs per topic, and
 * one shared one grows a parameter per caller.
 */
class Driver {
  constructor() {
    this.nowMs = 0;
    this.field = new PowerupField(() => 0.5);
    this.field.reset(WORLD, WORLD, PLAYER_STARTING_LIVES);
  }

  step(x = FAR_AWAY, y = FAR_AWAY, frame) {
    this.nowMs += SIMULATION_STEP_MS;

    return this.field.step(this.nowMs, x, y, frame, PLAYER_STARTING_LIVES);
  }

  idle(ms, x = FAR_AWAY, y = FAR_AWAY, frame) {
    const steps = Math.round(ms / SIMULATION_STEP_MS);

    for (let step = 0; step < steps; step += 1) {
      this.step(x, y, frame);
    }
  }

  markers() {
    return this.field.snapshot(this.nowMs).powerupMarkers;
  }
}

describe('markerScale', () => {
  it('scales a fresh marker in rather than popping it into existence', () => {
    const marker = newMarker('aegis', 100, 100, 0);

    expect(markerScale(marker, 0)).toBe(0);
    expect(markerScale(marker, 200)).toBeGreaterThan(0);
    expect(markerScale(marker, 200)).toBeLessThan(1);
  });

  it('holds at full for the rest of an untroubled life', () => {
    const marker = newMarker('aegis', 100, 100, 0);

    expect(markerScale(marker, 1000)).toBe(1);
    expect(markerScale(marker, MARKER_LIFETIME_MS - 1)).toBe(1);
  });

  it('scales back out again once a hazard has taken the spot', () => {
    const marker = newMarker('aegis', 100, 100, 0);
    marker.retiringSinceMs = 5000;

    expect(markerScale(marker, 5000)).toBe(1);
    const midway = markerScale(marker, 5150);
    expect(midway).toBeLessThan(1);
    expect(midway).toBeGreaterThan(0);
    expect(markerScale(marker, 5600)).toBeLessThanOrEqual(0);
  });

  it('never scales in past a retirement that has already started', () => {
    // Both animations can be running at once — a hazard can grow over a marker before it has
    // finished arriving — and the smaller of the two has to win, or a marker would grow while
    // leaving.
    const marker = newMarker('aegis', 100, 100, 0);
    marker.retiringSinceMs = 100;

    expect(markerScale(marker, 300)).toBeLessThan(1);
  });
});

describe('markerRemaining', () => {
  it('drains from a full circle to nothing across the lifetime', () => {
    const marker = newMarker('aegis', 100, 100, 0);

    expect(markerRemaining(marker, 0)).toBe(1);
    expect(markerRemaining(marker, MARKER_LIFETIME_MS / 4)).toBeCloseTo(0.75, 10);
    expect(markerRemaining(marker, MARKER_LIFETIME_MS)).toBe(0);
  });

  it('never reports a negative remainder', () => {
    const marker = newMarker('aegis', 100, 100, 0);

    expect(markerRemaining(marker, MARKER_LIFETIME_MS * 3)).toBe(0);
  });

  it('keeps telling the truth about the lifetime while the marker is being retired', () => {
    // The ring deliberately does not jump when a hazard cuts the marker short: the leaving is
    // carried by the scale. A countdown that jumps has stopped being a countdown.
    const marker = newMarker('aegis', 100, 100, 0);
    const beforeRetiring = markerRemaining(marker, 5000);
    marker.retiringSinceMs = 5000;

    expect(markerRemaining(marker, 5000)).toBe(beforeRetiring);
  });
});

describe('hasLeftTheArena', () => {
  it('is false while the marker is simply lying there', () => {
    const marker = newMarker('aegis', 100, 100, 0);

    expect(hasLeftTheArena(marker, MARKER_LIFETIME_MS - 1)).toBe(false);
  });

  it('is true the moment the lifetime runs out', () => {
    const marker = newMarker('aegis', 100, 100, 0);

    expect(hasLeftTheArena(marker, MARKER_LIFETIME_MS)).toBe(true);
  });

  it('is true once a retirement has finished, well before the lifetime would end', () => {
    const marker = newMarker('aegis', 100, 100, 0);
    marker.retiringSinceMs = 1000;

    expect(hasLeftTheArena(marker, 1200)).toBe(false);
    expect(hasLeftTheArena(marker, 1400)).toBe(true);
  });
});

describe('isCoveredByAnObstacle', () => {
  it('says nothing is covered when there are no obstacles at all', () => {
    const marker = newMarker('aegis', 100, 100, 0);

    expect(isCoveredByAnObstacle(marker, undefined)).toBe(false);
  });

  it('waits until the hazard reaches the drawn glyph', () => {
    const marker = newMarker('aegis', 500, 500, 0);
    const radius = 60;

    // A surface gap smaller than the marker is drawn: the hazard is over the glyph.
    const touching = frameWithCircle(500 + radius + PICKUP_RADIUS - 5, 500, radius);
    expect(isCoveredByAnObstacle(marker, touching)).toBe(true);

    // And one just outside it: the marker stays, however new the obstacle is.
    const clear = frameWithCircle(500 + radius + PICKUP_RADIUS + 5, 500, radius);
    expect(isCoveredByAnObstacle(marker, clear)).toBe(false);
  });

  it('is a far tighter question than the one asked when placing a marker', () => {
    // The hysteresis that makes this safe: easy to leave a marker alone, hard to throw it away.
    // Retiring at the placement distance would delete markers a comfortable run from a hazard.
    const marker = newMarker('aegis', 500, 500, 0);
    const radius = 60;
    const surfaceGap = (PICKUP_RADIUS + MIN_OBSTACLE_CLEARANCE) / 2;
    const nearby = frameWithCircle(500 + radius + surfaceGap, 500, radius);

    expect(surfaceGap).toBeLessThan(MIN_OBSTACLE_CLEARANCE);
    expect(isCoveredByAnObstacle(marker, nearby)).toBe(false);
  });
});

describe('retiring a marker inside a real field', () => {
  it('scales a marker away once an obstacle has grown over it', () => {
    const driver = new Driver();
    driver.idle(SPAWN_INTERVAL_MS + 100);
    expect(driver.markers()).toHaveLength(1);

    // A circular obstacle right on top of the marker, of the kind the engine keeps placing
    // throughout a round. The marker was legal where it landed; the hazard came afterwards.
    const covered = frameWithCircle(CENTRE, CENTRE, 60);

    // It shrinks rather than vanishing: a marker that blinks out reads as theft.
    driver.idle(150, FAR_AWAY, FAR_AWAY, covered);
    expect(driver.markers()[0].scale).toBeLessThan(1);
    expect(driver.markers()[0].scale).toBeGreaterThan(0);

    driver.idle(300, FAR_AWAY, FAR_AWAY, covered);
    expect(driver.markers()).toHaveLength(0);
  });

  it('keeps a marker an obstacle merely came near, rather than throwing it away', () => {
    const driver = new Driver();
    driver.idle(SPAWN_INTERVAL_MS + 100);

    // Closer than a marker would ever be *placed*, but not touching the glyph. Retiring at the
    // placement distance would delete a marker that is a comfortable run away and collectable.
    const radius = 40;
    const surfaceGap = (PICKUP_RADIUS + MIN_OBSTACLE_CLEARANCE) / 2;
    const nearby = frameWithCircle(CENTRE + radius + surfaceGap, CENTRE, radius);

    driver.idle(600, FAR_AWAY, FAR_AWAY, nearby);
    expect(driver.markers()).toHaveLength(1);
    expect(driver.markers()[0].scale).toBe(1);
  });

  it('does not let a marker inside a hazard be collected on the way out', () => {
    const driver = new Driver();
    driver.idle(SPAWN_INTERVAL_MS + 100);

    const covered = frameWithCircle(CENTRE, CENTRE, 60);
    driver.step(FAR_AWAY, FAR_AWAY, covered);

    // Standing on it while it leaves collects nothing: whatever reached in there did not reach it
    // fairly, and the player is being pushed out of that obstacle in the same step anyway.
    expect(driver.step(CENTRE, CENTRE, covered)).toBeNull();
  });

  it('keeps the ring honest while the marker is on its way out', () => {
    const driver = new Driver();
    driver.idle(SPAWN_INTERVAL_MS + 100);
    const beforeCovering = driver.markers()[0].remaining;

    const covered = frameWithCircle(CENTRE, CENTRE, 60);
    driver.step(FAR_AWAY, FAR_AWAY, covered);

    // Roughly where it was, not slammed to nearly zero: the countdown does not lie about the
    // lifetime just because the marker is leaving early.
    expect(driver.markers()[0].remaining).toBeCloseTo(beforeCovering, 2);
  });
});
