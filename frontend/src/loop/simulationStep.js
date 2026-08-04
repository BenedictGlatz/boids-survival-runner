/**
 * One fixed simulation step: the body of the loop's inner iteration.
 *
 * It lives here rather than in `index.js` for the same reason `renderState.js` does — that
 * file stood at the 400-line limit again. The split is along a real seam: `index.js` keeps
 * the bootstrap, the animation-frame loop and the round lifecycle, while everything that
 * happens *inside* one step is here.
 *
 * Unlike the rest of `loop/`, this module has no unit test, and the reason is structural
 * rather than an omission: it drives `engine-bridge.js`, and the Vitest suite runs in the
 * `node` environment with no WASM package. The step is covered by the Playwright suite
 * instead, which runs against the production build.
 */

import { setWave, tick } from '../engine-bridge.js';
import { buildControls } from '../input/controls.js';
import { MEND_SEGMENTS } from '../powerups/mend.js';
import {
  advanceClock,
  dueWaveNumber,
  isPlayerDashReady,
  registerDash,
  registerHit,
  restoreLives,
} from '../round/roundData.js';
import { SIMULATION_STEP_SECONDS, WORLD_BOUNDS } from '../gameConfig.js';

/**
 * Advances the world by exactly one fixed step: clock, player input, wave progression,
 * the engine tick, power-ups and finally any hit the step produced.
 *
 * The order of the calls inside is load-bearing throughout and each step of it is
 * commented, because every pair of adjacent lines here was at some point the wrong way
 * round.
 * @param {object} roundData - The current round state, from `round/roundData.js`.
 * @param {import('../input/inputManager.js').InputManager} input - Asked once for this step.
 * @param {import('../player/playerController.js').PlayerController} player - Integrated here.
 * @param {import('../powerups/powerups.js').PowerupField} powerups - Stepped and asked to absorb.
 * @returns {void}
 */
export function runSimulationStep(roundData, input, player, powerups) {
  advanceClock(roundData);

  // Read once per step: the dash request is a latch, so consuming it here is what
  // keeps one key press from firing a dash in every step of a multi-step frame.
  const controls = buildControls(input);
  const dashing = controls.dashRequested && isPlayerDashReady(roundData);

  if (dashing) {
    registerDash(roundData);
  }

  // Captured before the player integrates: the engine tests the whole move against
  // the obstacles, not just where it ended, which is what catches a dash fast enough
  // to cross a thin obstacle inside a single step.
  const previousPosition = player.getPosition();

  // Set every step rather than only when it changes: it is one multiplication, and a buff
  // that expires has to reach the controller on the step it expires on.
  player.setSpeedMultiplier(powerups.speedMultiplier());

  // The player has to move inside the same fixed step as the flock: its
  // position is an input to tick() and to the engine's collision test, so
  // integrating it per rendered frame would desync the two.
  const attemptedPosition = player.update(
    { direction: controls.direction, dash: dashing },
    SIMULATION_STEP_SECONDS,
    WORLD_BOUNDS,
  );

  // Runs per step so newly spawned boids exist before this step's tick(), and
  // so setWave sees the current player position for safe-spawn placement.
  updateWaveProgression(roundData, attemptedPosition);

  const frame = tick(previousPosition, attemptedPosition);
  roundData.currentFrame = frame;
  roundData.entityCount = frame.entityCount;

  // The engine may have pushed the player back out of an obstacle. Taking its answer
  // is what keeps the position the renderer draws and the one the flock steered
  // against from drifting apart over a run.
  if (frame.obstacleHit) {
    player.applyObstacleBlock(frame.playerPosition, frame.blockNormal);
  }

  // After that correction, so nothing is ever collected from a position the player was just
  // pushed out of. It runs per simulation step and not per frame, or a 144 Hz player would
  // collect differently from a 60 Hz one.
  //
  // The life count goes in because Mend's rules need it: a heal nobody can use must not spawn,
  // and one already lying there must not be collected. Nothing about the count comes back out —
  // the field reads it and never writes it.
  const collected = powerups.step(
    roundData.simulationTimeMs,
    player.position.x,
    player.position.y,
    frame,
    roundData.lives,
  );

  // The smallest of the three effects, and the only one that is not a buff: one segment back,
  // clamped to the maximum. Applied before the hits below, so a heal and a hit landing on the
  // same step settle in the order they happened rather than cancelling each other out.
  if (collected === 'mend') {
    restoreLives(roundData, MEND_SEGMENTS);
  }

  // Every step's hits are consumed here, and both sources share one entry point so
  // they share the invulnerability window. Reading only the last frame of a multi-step
  // frame would silently drop a hit from an earlier step.
  //
  // The absorber is a closure rather than a named function because it needs both the round
  // and the power-ups. It is built inside this branch, so a step without a hit allocates
  // nothing — and `registerHit` only asks for it on a hit that would really cost a life.
  if (frame.hitCount > 0 || frame.obstacleHit) {
    registerHit(roundData, () => powerups.absorbHit(roundData.simulationTimeMs));
  }
}

/** Spawns the next wave once the round clock has reached it. Silent while none is due. */
function updateWaveProgression(roundData, playerPosition) {
  const nextWave = dueWaveNumber(roundData);

  if (nextWave <= roundData.wave) {
    return;
  }

  roundData.wave = nextWave;
  setWave(roundData.wave, playerPosition);
}
