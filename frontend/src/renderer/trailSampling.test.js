import { describe, expect, it } from 'vitest';

import { PLAYER_DASH_SPEED, PLAYER_MAX_SPEED } from '../gameConfig.js';
import { DashTrails } from './dashTrailHistory.js';
import { sampleDashTrails } from './trailSampling.js';

const PLAYER_POSITION = { x: 400, y: 300 };

/**
 * A frame with `count` boids, all sitting on a line and all idle unless `dashing` names their
 * index. Only the four buffers the sampler reads are built.
 */
function makeFrame(count, dashing = {}) {
  const positions = new Float32Array(count * 2);
  const velocities = new Float32Array(count * 2);
  const dashPhases = new Float32Array(count);
  const tiers = new Uint32Array(count);

  for (let index = 0; index < count; index += 1) {
    positions[index * 2] = 100 + index * 50;
    positions[index * 2 + 1] = 100;
    velocities[index * 2] = 200;
    tiers[index] = index;
    dashPhases[index] = dashing[index] ?? 0;
  }

  return { positions, velocities, dashPhases, tiers };
}

/** How many slots hold a trail, whoever they belong to. */
function occupiedSlots(trails) {
  let occupied = 0;

  for (let slot = 0; slot < 12; slot += 1) {
    if (trails.count(slot) > 0) occupied += 1;
  }

  return occupied;
}

describe('sampleDashTrails', () => {
  it('leaves the history untouched while nobody moves fast enough', () => {
    const trails = new DashTrails();

    // Below 0.6 × top speed the strength ramp is flat zero, which is where the ribbon of a
    // dash that has bled off ends. Nothing is sampled, so no slot is even claimed.
    sampleDashTrails(trails, makeFrame(4), PLAYER_POSITION, {
      deltaSeconds: 1 / 60,
      playerSpeed: PLAYER_MAX_SPEED * 0.5,
      playerVelocityX: PLAYER_MAX_SPEED * 0.5,
      playerVelocityY: 0,
    });

    expect(occupiedSlots(trails)).toBe(0);
  });

  it('draws no more than a wisp at ordinary running speed', () => {
    const trails = new DashTrails();

    // The ramp starts below top speed on purpose, so a dash fades out instead of popping off
    // at a hard threshold. The price is a faint ribbon while simply running, and this is what
    // holds it to faint: a fifth of full strength, so a fifth of the width and the opacity.
    sampleDashTrails(trails, makeFrame(4), PLAYER_POSITION, {
      deltaSeconds: 1 / 60,
      playerSpeed: PLAYER_MAX_SPEED,
      playerVelocityX: PLAYER_MAX_SPEED,
      playerVelocityY: 0,
    });

    const strength = trails.samples[trails.offsetOf(0, 0) + 4];
    expect(strength).toBeGreaterThan(0);
    expect(strength).toBeLessThan(0.25);
  });

  it('turns the wisp into a real ribbon while Overdrive runs', () => {
    const trails = new DashTrails();

    // Overdrive has no effect of its own on the player: it lowers the trail's threshold, so
    // the streak runs during ordinary movement instead of only during a dash. Same speed as
    // the wisp case above, several times the strength.
    sampleDashTrails(trails, makeFrame(4), PLAYER_POSITION, {
      deltaSeconds: 1 / 60,
      playerSpeed: PLAYER_MAX_SPEED,
      playerVelocityX: PLAYER_MAX_SPEED,
      playerVelocityY: 0,
      powerupBuffs: { overdrive: 0.8 },
    });

    expect(trails.samples[trails.offsetOf(0, 0) + 4]).toBeGreaterThan(0.25);
  });

  it('leaves the threshold alone for a buff that is not Overdrive', () => {
    const trails = new DashTrails();

    sampleDashTrails(trails, makeFrame(4), PLAYER_POSITION, {
      deltaSeconds: 1 / 60,
      playerSpeed: PLAYER_MAX_SPEED,
      playerVelocityX: PLAYER_MAX_SPEED,
      playerVelocityY: 0,
      powerupBuffs: { aegis: 0.8 },
    });

    expect(trails.samples[trails.offsetOf(0, 0) + 4]).toBeLessThan(0.25);
  });

  it('opens one trail for a dashing player', () => {
    const trails = new DashTrails();

    sampleDashTrails(trails, makeFrame(4), PLAYER_POSITION, {
      deltaSeconds: 1 / 60,
      playerSpeed: PLAYER_DASH_SPEED,
      playerVelocityX: PLAYER_DASH_SPEED,
      playerVelocityY: 0,
    });

    expect(occupiedSlots(trails)).toBe(1);
    expect(trails.tier(0)).toBe(-1);
    expect(trails.samples[trails.offsetOf(0, 0)]).toBe(PLAYER_POSITION.x);
  });

  it('opens one trail per dashing boid and keeps their tiers', () => {
    const trails = new DashTrails();

    // Two boids mid-dash. A negative phase is the engine's way of saying "dashing".
    sampleDashTrails(trails, makeFrame(6, { 1: -0.9, 4: -0.4 }), PLAYER_POSITION, {
      deltaSeconds: 1 / 60,
      playerSpeed: 0,
      playerVelocityX: 0,
      playerVelocityY: 0,
    });

    expect(occupiedSlots(trails)).toBe(2);
    expect(trails.tier(0)).toBe(1);
    expect(trails.tier(1)).toBe(4);
  });

  it('ignores a boid that is only charging, so the pulse is the whole warning', () => {
    const trails = new DashTrails();

    // A positive phase is charge-up: it belongs to the growing, brightening arrow, and a
    // ribbon there would give away the lunge before it happens.
    sampleDashTrails(trails, makeFrame(6, { 2: 0.7 }), PLAYER_POSITION, {
      deltaSeconds: 1 / 60,
      playerSpeed: 0,
      playerVelocityX: 0,
      playerVelocityY: 0,
    });

    expect(occupiedSlots(trails)).toBe(0);
  });

  it('grows a boid trail across frames and retracts it when the dash ends', () => {
    const trails = new DashTrails();
    const dashing = makeFrame(3, { 0: -0.8 });

    for (let frame = 0; frame < 4; frame += 1) {
      dashing.positions[0] = 100 + frame * 20;
      sampleDashTrails(trails, dashing, PLAYER_POSITION, { deltaSeconds: 1 / 60 });
    }
    expect(trails.count(0)).toBe(4);

    // The dash is over: nobody writes to the trail, so `settle` pulls its tail in.
    sampleDashTrails(trails, makeFrame(3), PLAYER_POSITION, { deltaSeconds: 1 / 60 });
    expect(trails.count(0)).toBe(3);
  });

  it('survives a frame without the buffers it reads', () => {
    const trails = new DashTrails();

    // The very first frame after a state change can be empty, and the renderer draws it.
    sampleDashTrails(trails, {}, PLAYER_POSITION, { deltaSeconds: 1 / 60 });
    sampleDashTrails(trails, undefined, PLAYER_POSITION, { deltaSeconds: 1 / 60 });
    sampleDashTrails(trails, makeFrame(2), null, { deltaSeconds: 1 / 60 });

    expect(occupiedSlots(trails)).toBe(0);
  });
});
