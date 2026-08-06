import { describe, expect, it } from 'vitest';

import { PLAYER_ACCELERATION, PLAYER_MAX_SPEED } from '../gameConfig.js';
import { PlayerController } from './playerController.js';

// What a direction change costs. Split off `playerController.test.js` at the 400-line limit, the
// same way `playerObstacleBlock.test.js` was, and along a real seam: everything here is about the
// velocity the player is trying to get *rid* of.
//
// The answer is deliberately "nothing gets rid of it directly". Holding a direction only ever adds
// to the velocity, so the old momentum has to be spent through the acceleration itself, and the
// sideways part of a turn is not acted on at all — it only bleeds away as the radial speed cap
// redistributes what is there. That weight is the intended feel of the character, and these
// assertions exist so that a future change to the movement code has to argue with it rather than
// remove it by accident.
//
// Like its two neighbours this file imports the tuning constants instead of mirroring them —
// `PlayerController` reads them straight from `gameConfig.js`, so a local copy could quietly
// disagree with the module under test.

const STEP_SECONDS = 1 / 60;
const OPEN_WORLD = { width: 10_000, height: 10_000 };

const RIGHT = { x: 1, y: 0 };
const LEFT = { x: -1, y: 0 };
const DOWN = { x: 0, y: 1 };
/** What `inputManager.js` hands over for two keys at once: normalised, so not faster. */
const DOWN_RIGHT = { x: Math.SQRT1_2, y: Math.SQRT1_2 };

/** The run-up from a standstill, which every other duration here is measured against. */
const RUN_UP_SECONDS = PLAYER_MAX_SPEED / PLAYER_ACCELERATION;

function makePlayerAtCentre() {
  const player = new PlayerController();
  player.reset(OPEN_WORLD.width / 2, OPEN_WORLD.height / 2);

  return player;
}

function speedOf(player) {
  return Math.hypot(player.velocity.x, player.velocity.y);
}

function step(player, direction, { dash = false } = {}) {
  return player.update({ direction, dash }, STEP_SECONDS, OPEN_WORLD);
}

/** Holds one direction long enough that the speed has certainly settled. */
function runUpToSpeed(player, direction) {
  for (let held = 0; held < 240; held += 1) {
    step(player, direction);
  }

  return speedOf(player);
}

/** How long holding `direction` takes to satisfy `isDone`, in seconds. */
function secondsUntil(player, direction, isDone) {
  let steps = 0;

  while (!isDone(player)) {
    step(player, direction);
    steps += 1;

    // A guard, so a regression fails as the assertion below rather than as a hung test.
    expect(steps).toBeLessThan(600);
  }

  return steps * STEP_SECONDS;
}

describe('PlayerController.update — turning', () => {
  it('spends a full reversal through the acceleration, so it costs twice the run-up', () => {
    // Nothing brakes while a direction is held, so the only force working against the old heading
    // is the acceleration towards the new one: it has to undo `PLAYER_MAX_SPEED` before the first
    // pixel of the new direction is earned. That doubling is the whole of the weight the player
    // carries, and it is the cheapest of the two turns measured here.
    const player = makePlayerAtCentre();
    runUpToSpeed(player, RIGHT);

    const seconds = secondsUntil(player, LEFT, (p) => p.velocity.x <= -PLAYER_MAX_SPEED * 0.99);

    expect(seconds).toBeGreaterThan(RUN_UP_SECONDS);
    expect(seconds).toBeCloseTo(2 * RUN_UP_SECONDS, 1);
  });

  it('leaves the sideways momentum of a ninety-degree turn to bleed away on its own', () => {
    // The sideways part is orthogonal to the input, so the acceleration never touches it and there
    // is no separate brake either. It survives only because the radial cap keeps rescaling the
    // whole vector, which is a slow way to lose it — slower than a full reversal, and by a wide
    // enough margin that this is a statement about the model rather than about a tuning value.
    const player = makePlayerAtCentre();
    runUpToSpeed(player, RIGHT);

    const seconds = secondsUntil(
      player,
      DOWN,
      (p) => Math.abs(p.velocity.x) <= PLAYER_MAX_SPEED * 0.01,
    );

    expect(seconds).toBeGreaterThan(2 * RUN_UP_SECONDS);
  });

  it('barely dents that sideways momentum in the first step of the turn', () => {
    // A corner starts as a drift rather than as a change of heading: one step later almost the
    // whole of the old velocity is still pointing the old way.
    const player = makePlayerAtCentre();
    const beforeTheTurn = runUpToSpeed(player, RIGHT);

    step(player, DOWN);

    expect(player.velocity.x).toBeGreaterThan(beforeTheTurn * 0.95);
  });

  it('does not overshoot the top speed while turning', () => {
    // The old velocity and the freshly built one are simply added together, so the radial clamp
    // has to be the last word on how fast the player can be.
    const player = makePlayerAtCentre();
    runUpToSpeed(player, RIGHT);

    for (let held = 0; held < 30; held += 1) {
      step(player, DOWN);
      expect(speedOf(player)).toBeLessThanOrEqual(PLAYER_MAX_SPEED + 1e-9);
    }
  });

  it('turns without giving up the raised top speed of a buff', () => {
    // Overdrive raises the cap in four places, and a turn must not be a fifth that quietly drops
    // it — that would end the buff without the arc on the player saying so.
    const player = makePlayerAtCentre();
    player.setSpeedMultiplier(1.6);
    runUpToSpeed(player, RIGHT);

    expect(runUpToSpeed(player, DOWN)).toBeCloseTo(PLAYER_MAX_SPEED * 1.6, 4);
  });

  it('holds a diagonal at the same top speed as an axis', () => {
    // `inputManager` normalises the direction, so both components are built at a share of the
    // acceleration each. A diagonal drifting off the top speed would mean it is not normalised.
    const player = makePlayerAtCentre();

    expect(runUpToSpeed(player, DOWN_RIGHT)).toBeCloseTo(PLAYER_MAX_SPEED, 4);
  });

  it('carries a dash through a turn instead of letting it be steered away', () => {
    // The surplus of a dash is velocity like any other, so nothing brakes it either: turning
    // mid-lunge changes where the player ends up, not how far the lunge carries. The dash is over
    // when its raised speed limit has decayed, not when the player stops pointing along it.
    const player = makePlayerAtCentre();
    step(player, RIGHT, { dash: true });

    step(player, DOWN);

    expect(player.velocity.x).toBeGreaterThan(PLAYER_MAX_SPEED);
  });
});
