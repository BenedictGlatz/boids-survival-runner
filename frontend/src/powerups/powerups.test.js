import { describe, expect, it } from 'vitest';

import {
  OBSTACLE_STRIDE,
  PLAYER_DASH_SPEED,
  PLAYER_MAX_SPEED,
  SIMULATION_STEP_MS,
} from '../gameConfig.js';
import {
  AEGIS_DURATION_MS,
  COLLECT_RADIUS,
  distanceToSegment,
  MARKER_LIFETIME_MS,
  MAX_MARKERS,
  MIN_OBSTACLE_CLEARANCE,
  MIN_SPAWN_DISTANCE,
  OVERDRIVE_FACTOR,
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
    this.field.reset(WORLD, WORLD);
  }

  step(x = FAR_AWAY, y = FAR_AWAY, frame) {
    this.nowMs += SIMULATION_STEP_MS;

    return this.field.step(this.nowMs, x, y, frame);
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

  absorbHit() {
    return this.field.absorbHit(this.nowMs);
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

describe('distanceToSegment', () => {
  it('measures the perpendicular when the foot lies on the segment', () => {
    expect(distanceToSegment(50, 30, 0, 0, 100, 0)).toBe(30);
  });

  it('measures against the nearer end when the foot lies beyond it', () => {
    expect(distanceToSegment(-40, 0, 0, 0, 100, 0)).toBe(40);
    expect(distanceToSegment(140, 0, 0, 0, 100, 0)).toBe(40);
  });

  it('falls back to the point distance for a segment of no length', () => {
    expect(distanceToSegment(3, 4, 0, 0, 0, 0)).toBe(5);
  });
});

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
    expect(driver.markers()[0].spawnScale).toBeLessThan(1);

    driver.idle(600);
    expect(driver.markers()[0].spawnScale).toBe(1);
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

describe('aegis', () => {
  it('absorbs exactly one hit and is spent afterwards', () => {
    const driver = new Driver();
    driver.grant('aegis');

    expect(driver.absorbHit()).toBe(true);
    expect(driver.absorbHit()).toBe(false);
    expect(driver.field.isActive('aegis')).toBe(false);
  });

  it('absorbs nothing when it is not running', () => {
    expect(new Driver().absorbHit()).toBe(false);
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
