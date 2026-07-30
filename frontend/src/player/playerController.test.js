import { describe, expect, it } from 'vitest';
import { PlayerController } from './playerController.js';
import {
  PLAYER_ACCELERATION,
  PLAYER_DASH_SPEED,
  PLAYER_DASH_SPEED_DECAY,
  PLAYER_MAX_DELTA_SECONDS,
  PLAYER_MAX_SPEED,
  PLAYER_VISUAL_RADIUS,
} from '../gameConfig.js';

// Unlike the other frontend tests, this one imports the tuning constants instead
// of mirroring them. PlayerController reads them directly from gameConfig.js
// rather than taking them as arguments, so a local copy could silently disagree
// with the module under test.

const STEP_SECONDS = 1 / 60;
// Big enough that nothing in these tests reaches an edge unless it means to.
const OPEN_WORLD = { width: 10_000, height: 10_000 };

function makePlayerAtCentre() {
  const player = new PlayerController();
  player.reset(OPEN_WORLD.width / 2, OPEN_WORLD.height / 2);

  return player;
}

function speedOf(player) {
  return Math.hypot(player.velocity.x, player.velocity.y);
}

function step(player, direction, { dash = false, bounds = OPEN_WORLD } = {}) {
  return player.update({ direction, dash }, STEP_SECONDS, bounds);
}

const STILL = { x: 0, y: 0 };
const RIGHT = { x: 1, y: 0 };

describe('PlayerController.reset', () => {
  it('places the player and clears the velocity', () => {
    const player = new PlayerController();
    step(player, RIGHT);

    player.reset(120, 340);

    expect(player.position).toEqual({ x: 120, y: 340 });
    expect(player.velocity).toEqual({ x: 0, y: 0 });
  });

  it('clears a dash that was still in flight', () => {
    // beginRound() resets the player, so a dash from the previous round must not
    // carry its raised speed limit into the first steps of the new one.
    const player = makePlayerAtCentre();
    step(player, RIGHT, { dash: true });

    player.reset(500, 500);
    step(player, RIGHT);

    expect(speedOf(player)).toBeLessThanOrEqual(PLAYER_MAX_SPEED);
  });
});

describe('PlayerController.update — movement', () => {
  it('stays put when no direction is held', () => {
    const player = makePlayerAtCentre();

    const position = step(player, STILL);

    expect(position).toEqual({ x: OPEN_WORLD.width / 2, y: OPEN_WORLD.height / 2 });
  });

  it('accelerates in the held direction', () => {
    const player = makePlayerAtCentre();

    step(player, RIGHT);

    expect(player.velocity.x).toBeCloseTo(PLAYER_ACCELERATION * STEP_SECONDS, 6);
    expect(player.velocity.y).toBe(0);
  });

  it('never exceeds the top speed however long a direction is held', () => {
    const player = makePlayerAtCentre();

    for (let i = 0; i < 600; i += 1) {
      step(player, RIGHT);
    }

    expect(speedOf(player)).toBeCloseTo(PLAYER_MAX_SPEED, 6);
  });

  it('comes to a complete stop rather than drifting at a tiny speed', () => {
    // moveTowardZero snaps to exactly zero once the remaining speed is below one
    // step of deceleration. Subtracting blindly would leave a sub-pixel velocity
    // that never quite reaches zero and keeps the player sliding.
    const player = makePlayerAtCentre();
    for (let i = 0; i < 60; i += 1) {
      step(player, RIGHT);
    }

    for (let i = 0; i < 60; i += 1) {
      step(player, STILL);
    }

    expect(player.velocity).toEqual({ x: 0, y: 0 });
  });

  it('brakes the same way in both directions', () => {
    // moveTowardZero has to add towards zero for a negative velocity and subtract
    // for a positive one. Getting the sign wrong on one side would accelerate the
    // player instead of stopping them, and only in one of the four directions.
    const player = makePlayerAtCentre();
    for (let i = 0; i < 60; i += 1) {
      step(player, { x: -1, y: -1 });
    }
    const speedBeforeBraking = speedOf(player);

    step(player, STILL);

    expect(speedOf(player)).toBeLessThan(speedBeforeBraking);
    expect(player.velocity.x).toBeLessThan(0);
    expect(player.velocity.y).toBeLessThan(0);
  });

  it('moves the position by the velocity it just integrated', () => {
    const player = makePlayerAtCentre();
    const startX = player.position.x;

    step(player, RIGHT);

    expect(player.position.x).toBeCloseTo(startX + player.velocity.x * STEP_SECONDS, 6);
  });

  it('returns a copy of the position, not the live object', () => {
    // index.js passes this straight into the engine's collision test. Handing out
    // the internal object would let a caller move the player by mutating it.
    const player = makePlayerAtCentre();

    const position = step(player, RIGHT);
    position.x = -1;

    expect(player.position.x).not.toBe(-1);
  });
});

describe('PlayerController.update — the dash', () => {
  it('leaves the player far above top speed in the step it starts', () => {
    // The impulse has to survive the speed clamp in its own step. The limit decays
    // by one step's worth immediately, so the speed lands just under the dash speed.
    const player = makePlayerAtCentre();

    step(player, RIGHT, { dash: true });

    const expected = PLAYER_DASH_SPEED - PLAYER_DASH_SPEED_DECAY * STEP_SECONDS;
    expect(speedOf(player)).toBeCloseTo(expected, 4);
    expect(speedOf(player)).toBeGreaterThan(PLAYER_MAX_SPEED);
  });

  it('dashes along the held direction', () => {
    const player = makePlayerAtCentre();

    step(player, { x: 0, y: -1 }, { dash: true });

    expect(player.velocity.x).toBe(0);
    expect(player.velocity.y).toBeLessThan(-PLAYER_MAX_SPEED);
  });

  it('does nothing when no direction is held', () => {
    // Dashing on the spot has no meaningful direction. The controller ignores it so
    // the caller can keep the cooldown for a press the player actually spends.
    const player = makePlayerAtCentre();

    step(player, STILL, { dash: true });

    expect(player.velocity).toEqual({ x: 0, y: 0 });
    expect(player.position).toEqual({ x: OPEN_WORLD.width / 2, y: OPEN_WORLD.height / 2 });
  });

  it('bleeds the extra speed off over the following steps', () => {
    const player = makePlayerAtCentre();
    step(player, RIGHT, { dash: true });
    const speedRightAfterTheDash = speedOf(player);

    step(player, RIGHT);

    expect(speedOf(player)).toBeLessThan(speedRightAfterTheDash);
  });

  it('carries the player the surplus distance the ramp promises', () => {
    // This is the assertion that pins the dash *distance* rather than its speed.
    // The surplus over plain top-speed movement is the area under the decaying
    // ramp, so it is written out from the constants instead of as a fixed number:
    // retuning the dash moves both sides together, but a change that breaks the
    // relationship between the two constants and the travelled distance fails.
    const player = makePlayerAtCentre();
    const startX = player.position.x;

    // Long enough for the raised limit to reach PLAYER_MAX_SPEED again.
    const rampSteps = Math.ceil(
      (PLAYER_DASH_SPEED - PLAYER_MAX_SPEED) / (PLAYER_DASH_SPEED_DECAY * STEP_SECONDS),
    );
    step(player, RIGHT, { dash: true });
    for (let i = 1; i < rampSteps; i += 1) {
      step(player, RIGHT);
    }

    const travelled = player.position.x - startX;
    const atTopSpeed = PLAYER_MAX_SPEED * rampSteps * STEP_SECONDS;
    const surplus = (PLAYER_DASH_SPEED - PLAYER_MAX_SPEED) ** 2 / (2 * PLAYER_DASH_SPEED_DECAY);

    // Stepping in 1/60 s slices sums the ramp as a staircase, which always falls a
    // little short of the continuous integral — so this brackets the surplus rather
    // than pretending to match it exactly.
    expect(travelled - atTopSpeed).toBeGreaterThan(surplus * 0.9);
    expect(travelled - atTopSpeed).toBeLessThan(surplus * 1.05);
  });

  it('settles back at the normal top speed', () => {
    const player = makePlayerAtCentre();
    step(player, RIGHT, { dash: true });

    // The limit falls by PLAYER_DASH_SPEED_DECAY per second, so this is far more
    // steps than the ramp needs.
    for (let i = 0; i < 120; i += 1) {
      step(player, RIGHT);
    }

    expect(speedOf(player)).toBeCloseTo(PLAYER_MAX_SPEED, 6);
  });

  it('covers noticeably more ground than a normal step', () => {
    const dashing = makePlayerAtCentre();
    const walking = makePlayerAtCentre();

    step(dashing, RIGHT, { dash: true });
    step(walking, RIGHT);

    expect(dashing.position.x - walking.position.x).toBeGreaterThan(0);
  });
});

describe('PlayerController.clampToBounds', () => {
  const SMALL_WORLD = { width: 400, height: 300 };

  it('keeps the player a full radius inside every edge', () => {
    const player = new PlayerController();
    player.reset(-500, 999);

    player.clampToBounds(SMALL_WORLD);

    expect(player.position.x).toBe(PLAYER_VISUAL_RADIUS);
    expect(player.position.y).toBe(SMALL_WORLD.height - PLAYER_VISUAL_RADIUS);
  });

  it('stops the velocity on the axis that hit the wall and keeps the other', () => {
    const player = new PlayerController();
    player.reset(-500, 150);
    player.velocity = { x: -200, y: 90 };

    player.clampToBounds(SMALL_WORLD);

    expect(player.velocity.x).toBe(0);
    expect(player.velocity.y).toBe(90);
  });

  it('survives a world smaller than the player', () => {
    // The canvas follows the window, so a very short window can leave less room
    // than the player's own diameter. The clamp must still produce a position
    // inside it rather than a min above its max.
    const player = new PlayerController();
    player.reset(50, 50);

    player.clampToBounds({ width: 10, height: 10 });

    expect(player.position).toEqual({ x: PLAYER_VISUAL_RADIUS, y: PLAYER_VISUAL_RADIUS });
  });

  it('ends a dash that ran into an edge', () => {
    // Observable through the other axis: the dash is fired diagonally, x hits the
    // wall and resets the raised limit, so the still-fast y component is clamped
    // back to the normal top speed on the very next step instead of over the
    // remaining dash window.
    const world = { width: 400, height: 4000 };
    const player = new PlayerController();
    player.reset(world.width - PLAYER_VISUAL_RADIUS - 1, 100);

    player.update({ direction: { x: 1, y: 1 }, dash: true }, STEP_SECONDS, world);
    expect(player.velocity.x).toBe(0);
    expect(speedOf(player)).toBeGreaterThan(PLAYER_MAX_SPEED);

    player.update({ direction: STILL, dash: false }, STEP_SECONDS, world);

    expect(speedOf(player)).toBeCloseTo(PLAYER_MAX_SPEED, 6);
  });
});

describe('PlayerController.update — delta time', () => {
  it('caps a huge delta instead of teleporting the player', () => {
    // A backgrounded tab can hand back a delta of many seconds. Integrating it
    // unclamped would move the player across the world in one step.
    const player = makePlayerAtCentre();

    player.update({ direction: RIGHT, dash: false }, 10, OPEN_WORLD);

    expect(player.velocity.x).toBeCloseTo(PLAYER_ACCELERATION * PLAYER_MAX_DELTA_SECONDS, 6);
  });

  it('treats a negative delta as no time at all', () => {
    const player = makePlayerAtCentre();

    player.update({ direction: RIGHT, dash: false }, -5, OPEN_WORLD);

    expect(player.velocity).toEqual({ x: 0, y: 0 });
    expect(player.position).toEqual({ x: OPEN_WORLD.width / 2, y: OPEN_WORLD.height / 2 });
  });
});
