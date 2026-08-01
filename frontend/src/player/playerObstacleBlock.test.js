import { describe, expect, it } from 'vitest';
import { PlayerController } from './playerController.js';
import { PLAYER_MAX_SPEED, PLAYER_OBSTACLE_BOUNCE } from '../gameConfig.js';

// The second half of `playerController.test.js`, split off it for one reason only: that file
// ran up against the 400-line limit when the speed multiplier arrived. Everything here covers
// `applyObstacleBlock`, which is the one method the engine drives rather than the input.
//
// Like its sibling it imports the tuning constants instead of mirroring them, because
// PlayerController reads them from gameConfig.js directly and a local copy could disagree.

const STEP_SECONDS = 1 / 60;
const OPEN_WORLD = { width: 10_000, height: 10_000 };
const RIGHT = { x: 1, y: 0 };
const FROM_THE_LEFT = { x: -1, y: 0 };

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

describe('PlayerController.applyObstacleBlock', () => {
  it('takes the position the engine worked out', () => {
    // The engine owns the obstacle geometry, so its answer is the authority. Ignoring
    // it would leave the drawn player and the one the flock chased slowly diverging.
    const player = makePlayerAtCentre();

    player.applyObstacleBlock({ x: 123, y: 456 }, FROM_THE_LEFT);

    expect(player.position).toEqual({ x: 123, y: 456 });
  });

  it('turns the velocity running into the surface around as a knockback', () => {
    // Not merely removed: a fraction of it comes back the other way, which is what
    // makes a collision read as being pushed off rather than as stopping dead. The
    // fraction stays well under one, or a dashing player would be flung across the
    // world by the obstacle they touched.
    const player = makePlayerAtCentre();
    player.velocity = { x: 200, y: 0 };

    player.applyObstacleBlock({ x: 500, y: 500 }, FROM_THE_LEFT);

    expect(player.velocity.x).toBeCloseTo(-200 * PLAYER_OBSTACLE_BOUNCE, 6);
  });

  it('keeps the velocity running along the surface', () => {
    // This is the difference between sliding and sticking. Zeroing the whole velocity
    // would make every obstacle a wall the player has to peel away from by hand.
    const player = makePlayerAtCentre();
    player.velocity = { x: 200, y: 150 };

    player.applyObstacleBlock({ x: 500, y: 500 }, FROM_THE_LEFT);

    expect(player.velocity.y).toBeCloseTo(150, 6);
  });

  it('leaves a velocity already pointing away from the surface untouched', () => {
    // Nothing runs into the obstacle here, so subtracting the projection would
    // accelerate the player off it instead of leaving them alone.
    const player = makePlayerAtCentre();
    player.velocity = { x: -200, y: 0 };

    player.applyObstacleBlock({ x: 500, y: 500 }, FROM_THE_LEFT);

    expect(player.velocity.x).toBeCloseTo(-200, 6);
  });

  it('ends a dash that ran into an obstacle', () => {
    // Same reason the world edge ends one: the raised speed limit would otherwise let
    // ordinary movement run above the top speed for the rest of the dash window.
    const player = makePlayerAtCentre();
    step(player, RIGHT, { dash: true });

    player.applyObstacleBlock({ x: 500, y: 500 }, FROM_THE_LEFT);
    step(player, RIGHT);

    expect(speedOf(player)).toBeLessThanOrEqual(PLAYER_MAX_SPEED);
  });

  it('handles a diagonal surface', () => {
    // A bar can sit at any angle, so the normal is rarely axis-aligned. Whatever the
    // angle, the player has to end up moving away from the obstacle rather than into it.
    const player = makePlayerAtCentre();
    const diagonal = { x: -Math.SQRT1_2, y: -Math.SQRT1_2 };
    player.velocity = { x: 100, y: 100 };

    player.applyObstacleBlock({ x: 500, y: 500 }, diagonal);

    const alongTheNormal = player.velocity.x * diagonal.x + player.velocity.y * diagonal.y;
    expect(alongTheNormal).toBeGreaterThan(0);
  });

  it('drops back to the raised top speed while Overdrive runs, not to the base one', () => {
    // Otherwise a scrape along an obstacle would quietly end the buff while its arc and
    // its HUD row both still say it is running.
    const player = makePlayerAtCentre();
    player.setSpeedMultiplier(2);
    player.velocity = { x: 200, y: 0 };

    player.applyObstacleBlock({ x: 500, y: 500 }, FROM_THE_LEFT);
    for (let held = 0; held < 240; held += 1) {
      step(player, RIGHT);
    }

    expect(speedOf(player)).toBeCloseTo(PLAYER_MAX_SPEED * 2, 4);
  });
});
