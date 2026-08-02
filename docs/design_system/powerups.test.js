import { describe, expect, it } from 'vitest';

import {
  AEGIS_DURATION_MS,
  COLLECT_RADIUS,
  MARKER_LIFETIME_MS,
  MAX_MARKERS,
  MIN_SPAWN_DISTANCE,
  OVERDRIVE_FACTOR,
  PowerupField,
  SPAWN_INTERVAL_MS,
} from './powerups.js';

const STEP = 1 / 60;
const WORLD = 2400;

/** A field on a fixed RNG, so markers land in the middle of the arena every time. */
function makeField() {
  const field = new PowerupField(() => 0.5);
  field.reset(WORLD, WORLD);

  return field;
}

/** Runs the simulation for `ms` with the player parked far from the centre. */
function idle(field, ms, x = 40, y = 40) {
  const steps = Math.round(ms / 1000 / STEP);
  for (let step = 0; step < steps; step += 1) field.step(STEP, x, y);
}

describe('spawning', () => {
  it('puts nothing in the arena before the first interval', () => {
    const field = makeField();
    idle(field, SPAWN_INTERVAL_MS - 200);
    expect(field.snapshot().powerupMarkers).toHaveLength(0);
  });

  it('spawns once the interval is up', () => {
    const field = makeField();
    idle(field, SPAWN_INTERVAL_MS + 100);
    expect(field.snapshot().powerupMarkers).toHaveLength(1);
  });

  it('alternates kinds instead of drawing at random', () => {
    const field = new PowerupField(() => 0.5);
    field.reset(WORLD, WORLD);

    idle(field, SPAWN_INTERVAL_MS + 100);
    const first = field.snapshot().powerupMarkers[0].kind;

    // Take the first one away so the second has room, then wait out another interval.
    field.step(STEP, field.snapshot().powerupMarkers[0].x, field.snapshot().powerupMarkers[0].y);
    idle(field, SPAWN_INTERVAL_MS + 100);

    const second = field.snapshot().powerupMarkers[0].kind;
    expect(second).not.toBe(first);
  });

  it('never exceeds the marker cap', () => {
    const field = new PowerupField(Math.random);
    field.reset(WORLD, WORLD);
    idle(field, SPAWN_INTERVAL_MS * 8);
    expect(field.snapshot().powerupMarkers.length).toBeLessThanOrEqual(MAX_MARKERS);
  });

  it('keeps its distance from the player, so nothing is collected by standing still', () => {
    const field = new PowerupField(Math.random);
    field.reset(WORLD, WORLD);
    idle(field, SPAWN_INTERVAL_MS + 100, WORLD / 2, WORLD / 2);

    for (const marker of field.snapshot().powerupMarkers) {
      expect(Math.hypot(marker.x - WORLD / 2, marker.y - WORLD / 2)).toBeGreaterThanOrEqual(
        MIN_SPAWN_DISTANCE,
      );
    }
  });

  it('scales a fresh marker in rather than popping it into existence', () => {
    const field = makeField();
    idle(field, SPAWN_INTERVAL_MS + 20);
    expect(field.snapshot().powerupMarkers[0].spawnScale).toBeLessThan(1);

    idle(field, 600);
    expect(field.snapshot().powerupMarkers[0].spawnScale).toBe(1);
  });

  it('takes a marker back that nobody picked up', () => {
    const field = makeField();
    idle(field, SPAWN_INTERVAL_MS + 100);
    expect(field.snapshot().powerupMarkers).toHaveLength(1);

    idle(field, MARKER_LIFETIME_MS + 200);
    const kinds = field.snapshot().powerupMarkers.map((m) => m.kind);
    expect(kinds).not.toContain('aegis');
  });
});

describe('collecting', () => {
  it('picks a marker up on contact and reports the kind', () => {
    const field = makeField();
    idle(field, SPAWN_INTERVAL_MS + 100);
    const marker = field.snapshot().powerupMarkers[0];

    const collected = field.step(STEP, marker.x, marker.y);

    expect(collected).toBe(marker.kind);
    expect(field.isActive(marker.kind)).toBe(true);
    expect(field.snapshot().powerupMarkers).toHaveLength(0);
  });

  it('is more generous than the marker looks, so a graze counts', () => {
    const field = makeField();
    idle(field, SPAWN_INTERVAL_MS + 100);
    const marker = field.snapshot().powerupMarkers[0];

    expect(field.step(STEP, marker.x + COLLECT_RADIUS - 1, marker.y)).toBe(marker.kind);
  });

  it('leaves a marker alone that the player only passed near', () => {
    const field = makeField();
    idle(field, SPAWN_INTERVAL_MS + 100);
    const marker = field.snapshot().powerupMarkers[0];

    expect(field.step(STEP, marker.x + COLLECT_RADIUS + 8, marker.y)).toBeNull();
    expect(field.snapshot().powerupMarkers).toHaveLength(1);
  });

  it('leaves a collect ring behind that fades within a third of a second', () => {
    const field = makeField();
    idle(field, SPAWN_INTERVAL_MS + 100);
    const marker = field.snapshot().powerupMarkers[0];
    field.step(STEP, marker.x, marker.y);

    expect(field.snapshot().powerupCollects).toHaveLength(1);
    idle(field, 400);
    expect(field.snapshot().powerupCollects).toHaveLength(0);
  });
});

describe('aegis', () => {
  it('absorbs exactly one hit and is spent afterwards', () => {
    const field = makeField();
    field.grant('aegis');

    expect(field.absorbHit()).toBe(true);
    expect(field.absorbHit()).toBe(false);
    expect(field.isActive('aegis')).toBe(false);
  });

  it('absorbs nothing when it is not running', () => {
    expect(makeField().absorbHit()).toBe(false);
  });

  it('shows the shatter briefly and then stops', () => {
    const field = makeField();
    field.grant('aegis');
    field.absorbHit();

    expect(field.snapshot().aegisShatterAge).toBeGreaterThanOrEqual(0);
    idle(field, 500);
    expect(field.snapshot().aegisShatterAge).toBeUndefined();
  });

  it('runs out on its own when no hit ever comes', () => {
    const field = makeField();
    field.grant('aegis');

    idle(field, AEGIS_DURATION_MS - 300);
    expect(field.isActive('aegis')).toBe(true);

    idle(field, 600);
    expect(field.isActive('aegis')).toBe(false);
  });

  it('drains its arc from full to empty', () => {
    const field = makeField();
    field.grant('aegis');
    expect(field.snapshot().powerupBuffs.aegis).toBeCloseTo(1, 1);

    idle(field, AEGIS_DURATION_MS / 2);
    expect(field.snapshot().powerupBuffs.aegis).toBeCloseTo(0.5, 1);
  });
});

describe('overdrive', () => {
  it('is the only thing that touches the speed multiplier', () => {
    const field = makeField();
    expect(field.speedMultiplier()).toBe(1);

    field.grant('overdrive');
    expect(field.speedMultiplier()).toBe(OVERDRIVE_FACTOR);
  });

  it('stays below dash speed, so it opens no new tunnelling window', () => {
    expect(360 * OVERDRIVE_FACTOR).toBeLessThan(1100);
  });

  it('gives the speed back when it expires', () => {
    const field = makeField();
    field.grant('overdrive');
    idle(field, 7000);
    expect(field.speedMultiplier()).toBe(1);
  });

  it('does not absorb hits — that is the other one', () => {
    const field = makeField();
    field.grant('overdrive');
    expect(field.absorbHit()).toBe(false);
  });
});

describe('both at once', () => {
  it('runs them independently, each with its own arc', () => {
    const field = makeField();
    field.grant('aegis');
    field.grant('overdrive');

    const buffs = field.snapshot().powerupBuffs;
    expect(buffs.aegis).toBeGreaterThan(0);
    expect(buffs.overdrive).toBeGreaterThan(0);

    field.absorbHit();
    expect(field.snapshot().powerupBuffs.aegis).toBeUndefined();
    expect(field.speedMultiplier()).toBe(OVERDRIVE_FACTOR);
  });

  it('restarts a buff at full duration instead of stacking it', () => {
    const field = makeField();
    field.grant('overdrive');
    idle(field, 3000);
    field.grant('overdrive');

    expect(field.snapshot().powerupBuffs.overdrive).toBeCloseTo(1, 1);
  });
});

describe('reset', () => {
  it('leaves nothing of the previous round behind', () => {
    const field = makeField();
    idle(field, SPAWN_INTERVAL_MS + 100);
    field.grant('aegis');
    field.grant('overdrive');

    field.reset(WORLD, WORLD);

    const snapshot = field.snapshot();
    expect(snapshot.powerupMarkers).toHaveLength(0);
    expect(snapshot.powerupBuffs).toEqual({});
    expect(snapshot.aegisShatterAge).toBeUndefined();
    expect(field.speedMultiplier()).toBe(1);
  });
});
