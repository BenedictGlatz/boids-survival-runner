import { describe, expect, it } from 'vitest';

import {
  PLAYER_ACCELERATION,
  PLAYER_DASH_SPEED,
  PLAYER_MAX_SPEED,
  PLAYER_TURN_DECELERATION,
} from '../gameConfig.js';
import { PlayerController } from './playerController.js';

// What a direction change costs. Split off `playerController.test.js` at the 400-line limit, the
// same way `playerObstacleBlock.test.js` was, and along a real seam: everything here is about the
// velocity the player is trying to get *rid* of, which is the half `_steer` exists for.
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

describe('PlayerController.update — turning', () => {
  it('brakes the sideways momentum of a ninety-degree turn instead of drifting through it', () => {
    const player = makePlayerAtCentre();
    runUpToSpeed(player, RIGHT);

    // The whole velocity is now sideways to the new input, so nothing but the turn brake acts on
    // it. `PLAYER_MAX_SPEED / PLAYER_TURN_DECELERATION` seconds is what that should take.
    const stepsToClear = Math.ceil(PLAYER_MAX_SPEED / PLAYER_TURN_DECELERATION / STEP_SECONDS);

    for (let held = 0; held < stepsToClear; held += 1) {
      step(player, DOWN);
    }

    expect(player.velocity.x).toBe(0);
  });

  it('brakes that momentum rather than switching it off', () => {
    // One step must not be enough. A turn that completes inside a single step is not grip, it is
    // a teleport, and the player would lose all sense of carrying weight.
    const player = makePlayerAtCentre();
    runUpToSpeed(player, RIGHT);

    step(player, DOWN);

    expect(player.velocity.x).toBeGreaterThan(0);
    expect(player.velocity.x).toBeLessThan(PLAYER_MAX_SPEED);
  });

  it('reverses faster than acceleration alone ever could', () => {
    // This is the assertion the whole change exists for. Without a separate brake the only thing
    // working against the old velocity is the acceleration, so a reversal costs
    // `2 * PLAYER_MAX_SPEED / PLAYER_ACCELERATION` seconds — twice the run-up from a standstill.
    const player = makePlayerAtCentre();
    runUpToSpeed(player, RIGHT);

    const accelerationOnlySeconds = (2 * PLAYER_MAX_SPEED) / PLAYER_ACCELERATION;
    let steps = 0;

    while (player.velocity.x > -PLAYER_MAX_SPEED * 0.99) {
      step(player, LEFT);
      steps += 1;

      // A guard, so a regression fails as this assertion rather than as a hung test.
      expect(steps).toBeLessThan(600);
    }

    expect(steps * STEP_SECONDS).toBeLessThan(accelerationOnlySeconds);
  });

  it('does not overshoot the top speed while turning', () => {
    // The braked sideways part and the freshly built forward part are added together, so the
    // radial clamp still has to be the last word on how fast the player can be.
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
    // `inputManager` normalises the direction, and `_steer` projects onto it — the projection is
    // only exact for a unit vector, so a diagonal drifting off the top speed would mean it is not.
    const player = makePlayerAtCentre();

    expect(runUpToSpeed(player, DOWN_RIGHT)).toBeCloseTo(PLAYER_MAX_SPEED, 4);
  });

  it('lets a dash be steered out of, which is the one side effect of all this', () => {
    // Deliberate rather than tolerated: the sideways brake acts on a dash's surplus too, so
    // turning mid-lunge spends it. Dashing and holding the *same* direction is untouched, which
    // is what keeps the dash distance in `playerController.test.js` where it was.
    const player = makePlayerAtCentre();
    step(player, RIGHT, { dash: true });
    expect(player.velocity.x).toBeGreaterThan(PLAYER_MAX_SPEED);

    const stepsToClear = Math.ceil(PLAYER_DASH_SPEED / PLAYER_TURN_DECELERATION / STEP_SECONDS);
    for (let held = 0; held < stepsToClear; held += 1) {
      step(player, DOWN);
    }

    expect(player.velocity.x).toBe(0);
  });
});
