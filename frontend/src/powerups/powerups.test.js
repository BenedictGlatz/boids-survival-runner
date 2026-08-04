import { describe, expect, it } from 'vitest';

// Everything `PowerupField` puts **in the arena**: the spawn interval, the distance rules,
// collection and the round reset. Two halves of the same class live beside this file, each with
// a harness of its own, and both were split off here when the 400-line limit was reached — the
// same way `playerObstacleBlock.test.js` was split off `playerController.test.js`:
// `mend.test.js` for Mend's rules, `powerupBuffs.test.js` for the two buffs on the player.

import { OBSTACLE_STRIDE, PLAYER_STARTING_LIVES, SIMULATION_STEP_MS } from '../gameConfig.js';
import { PICKUP_RADIUS } from '../renderer/powerupMarkerLayer.js';
import { MIN_OBSTACLE_CLEARANCE } from './markerClearance.js';
import { MARKER_LIFETIME_MS } from './markerLifetime.js';
import {
  COLLECT_RADIUS,
  MAX_MARKERS,
  MIN_SPAWN_DISTANCE,
  PowerupField,
  SPAWN_INTERVAL_MS,
} from './powerups.js';

const WORLD = 2400;
/** A fixed RNG of 0.5 places every marker dead centre: 2400 * (0.1 + 0.5 * 0.8). */
const CENTRE = WORLD * 0.5;
/** A corner the player can stand in without being anywhere near a marker. */
const FAR_AWAY = 40;

/**
 * Drives a field on a simulation clock the way `index.js` does, so no test has to carry the
 * timestamp itself. `reset` puts the clock back to zero here for the same reason
 * `beginRound()` does: every timestamp in the field is measured against it.
 */
class Driver {
  constructor(random = () => 0.5) {
    this.field = new PowerupField(random);
    this.reset();
  }

  reset() {
    this.nowMs = 0;
    // Full lives throughout, which is what keeps Mend out of every test in this file: at full
    // lives the spawn order skips it, so the two buffs are the only kinds that can turn up.
    this.lives = PLAYER_STARTING_LIVES;
    this.field.reset(WORLD, WORLD, PLAYER_STARTING_LIVES);
  }

  step(x = FAR_AWAY, y = FAR_AWAY, frame) {
    this.nowMs += SIMULATION_STEP_MS;

    return this.field.step(this.nowMs, x, y, frame, this.lives);
  }

  idle(ms, x = FAR_AWAY, y = FAR_AWAY, frame) {
    const steps = Math.round(ms / SIMULATION_STEP_MS);

    for (let step = 0; step < steps; step += 1) {
      this.step(x, y, frame);
    }
  }

  snapshot() {
    return this.field.snapshot(this.nowMs);
  }

  markers() {
    return this.snapshot().powerupMarkers;
  }

  grant(kind) {
    this.field.grant(kind, this.nowMs);
  }
}

/** One capsule obstacle in the engine's flat layout, so a spawn has something to avoid. */
function frameWithObstacle(startX, startY, endX, endY, radius) {
  const obstacles = new Float32Array(OBSTACLE_STRIDE);
  obstacles[0] = startX;
  obstacles[1] = startY;
  obstacles[2] = endX;
  obstacles[3] = endY;
  obstacles[4] = radius;

  return { obstacles, obstacleCount: 1 };
}

describe('spawning', () => {
  it('puts nothing in the arena before the first interval', () => {
    const driver = new Driver();
    driver.idle(SPAWN_INTERVAL_MS - 200);

    expect(driver.markers()).toHaveLength(0);
  });

  it('spawns once the interval is up', () => {
    const driver = new Driver();
    driver.idle(SPAWN_INTERVAL_MS + 100);

    expect(driver.markers()).toHaveLength(1);
  });

  it('alternates kinds instead of drawing at random', () => {
    const driver = new Driver();
    driver.idle(SPAWN_INTERVAL_MS + 100);
    const first = driver.markers()[0];

    // Take the first one away so the second has room, then wait out another interval.
    driver.step(first.x, first.y);
    driver.idle(SPAWN_INTERVAL_MS + 100);

    expect(driver.markers()[0].kind).not.toBe(first.kind);
  });

  it('never exceeds the marker cap', () => {
    const driver = new Driver(Math.random);
    driver.idle(SPAWN_INTERVAL_MS * 8);

    expect(driver.markers().length).toBeLessThanOrEqual(MAX_MARKERS);
  });

  it('keeps its distance from the player, so nothing is collected by standing still', () => {
    const driver = new Driver(Math.random);
    driver.idle(SPAWN_INTERVAL_MS + 100, CENTRE, CENTRE);

    for (const marker of driver.markers()) {
      expect(Math.hypot(marker.x - CENTRE, marker.y - CENTRE)).toBeGreaterThanOrEqual(
        MIN_SPAWN_DISTANCE,
      );
    }
  });

  it('keeps its distance from an obstacle, so no marker lands inside a hazard', () => {
    const driver = new Driver();
    // A bar straight through the only spot this RNG can place a marker in.
    const frame = frameWithObstacle(CENTRE - 300, CENTRE, CENTRE + 300, CENTRE, 20);

    driver.idle(SPAWN_INTERVAL_MS + 100, FAR_AWAY, FAR_AWAY, frame);

    expect(driver.markers()).toHaveLength(0);
  });

  it('spawns normally when the obstacle is out of the way', () => {
    const driver = new Driver();
    const frame = frameWithObstacle(FAR_AWAY, FAR_AWAY, FAR_AWAY, FAR_AWAY, 20);

    driver.idle(SPAWN_INTERVAL_MS + 100, FAR_AWAY, FAR_AWAY, frame);

    const marker = driver.markers()[0];
    expect(marker).toBeDefined();
    expect(Math.hypot(marker.x - FAR_AWAY, marker.y - FAR_AWAY) - 20).toBeGreaterThanOrEqual(
      MIN_OBSTACLE_CLEARANCE,
    );
  });

  it('retries at the next interval rather than giving up for good', () => {
    const driver = new Driver();
    const blocking = frameWithObstacle(CENTRE - 300, CENTRE, CENTRE + 300, CENTRE, 20);

    driver.idle(SPAWN_INTERVAL_MS + 100, FAR_AWAY, FAR_AWAY, blocking);
    expect(driver.markers()).toHaveLength(0);

    // The obstacle expired; the very next interval has to produce a marker again.
    driver.idle(SPAWN_INTERVAL_MS + 100);
    expect(driver.markers()).toHaveLength(1);
  });

  it('scales a fresh marker in rather than popping it into existence', () => {
    const driver = new Driver();
    driver.idle(SPAWN_INTERVAL_MS + 20);
    expect(driver.markers()[0].scale).toBeLessThan(1);

    driver.idle(600);
    expect(driver.markers()[0].scale).toBe(1);
  });

  it('reports how much of its time on the ground a marker has left', () => {
    const driver = new Driver();
    driver.idle(SPAWN_INTERVAL_MS + 100);

    // Essentially full the moment it lands, so the ring starts as a closed circle.
    const atStart = driver.markers()[0].remaining;
    expect(atStart).toBeGreaterThan(0.99);
    expect(atStart).toBeLessThanOrEqual(1);

    // And it drains with the clock: a third of the lifetime spends a third of the ring.
    driver.idle(MARKER_LIFETIME_MS / 3);
    expect(driver.markers()[0].remaining).toBeCloseTo(atStart - 1 / 3, 2);
  });

  it('takes a marker back that nobody picked up', () => {
    const driver = new Driver();
    driver.idle(SPAWN_INTERVAL_MS + 100);
    const abandoned = driver.markers()[0];

    driver.idle(MARKER_LIFETIME_MS + 200);

    expect(driver.markers()).not.toContainEqual(expect.objectContaining({ kind: abandoned.kind }));
  });
});

describe('collecting', () => {
  it('picks a marker up on contact and reports the kind', () => {
    const driver = new Driver();
    driver.idle(SPAWN_INTERVAL_MS + 100);
    const marker = driver.markers()[0];

    expect(driver.step(marker.x, marker.y)).toBe(marker.kind);
    expect(driver.field.isActive(marker.kind)).toBe(true);
    expect(driver.markers()).toHaveLength(0);
  });

  it('is more generous than the marker looks, so a graze counts', () => {
    const driver = new Driver();
    driver.idle(SPAWN_INTERVAL_MS + 100);
    const marker = driver.markers()[0];

    expect(driver.step(marker.x + COLLECT_RADIUS - 1, marker.y)).toBe(marker.kind);
  });

  it('leaves a marker alone that the player only passed near', () => {
    const driver = new Driver();
    driver.idle(SPAWN_INTERVAL_MS + 100);
    const marker = driver.markers()[0];

    expect(driver.step(marker.x + COLLECT_RADIUS + 8, marker.y)).toBeNull();
    expect(driver.markers()).toHaveLength(1);
  });

  it('leaves a collect ring behind that fades within a third of a second', () => {
    const driver = new Driver();
    driver.idle(SPAWN_INTERVAL_MS + 100);
    const marker = driver.markers()[0];
    driver.step(marker.x, marker.y);

    expect(driver.snapshot().powerupCollects).toHaveLength(1);

    driver.idle(400);
    expect(driver.snapshot().powerupCollects).toHaveLength(0);
  });
});

describe('reset', () => {
  it('leaves nothing of the previous round behind', () => {
    const driver = new Driver();
    driver.idle(SPAWN_INTERVAL_MS + 100);
    driver.grant('aegis');
    driver.grant('overdrive');

    driver.reset();

    const snapshot = driver.snapshot();
    expect(snapshot.powerupMarkers).toHaveLength(0);
    expect(snapshot.powerupBuffs).toEqual({});
    expect(snapshot.aegisShatterAge).toBeUndefined();
    expect(driver.field.speedMultiplier()).toBe(1);
  });

  it('starts the spawn interval over instead of firing immediately', () => {
    const driver = new Driver();
    driver.idle(SPAWN_INTERVAL_MS + 100);
    driver.reset();

    driver.idle(SPAWN_INTERVAL_MS - 200);
    expect(driver.markers()).toHaveLength(0);

    driver.idle(300);
    expect(driver.markers()).toHaveLength(1);
  });
});

// The one number here that is only meaningful next to a number in another module. Every other
// test in this file reads the constant it asserts on, so resizing a marker moves the tests with
// it and none of them would notice the collect radius falling behind the glyph.
describe('the marker size against the drawn one', () => {
  it('collects from further out than the marker is drawn', () => {
    // Otherwise the player has to aim inside the hexagon, and a hit that looks like one
    // stops being one — which is the whole reason these are two numbers and not one.
    expect(COLLECT_RADIUS).toBeGreaterThan(PICKUP_RADIUS);
  });
});
