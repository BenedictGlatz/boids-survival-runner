/**
 * Feeds the dash-trail history one frame's worth of samples — the reading half of the
 * "Ion Streak" (`docs/design_system/dash_animation/design-system.md` §8), where
 * `dashTrailHistory.js` owns the storage and `trailLayer.js` the drawing.
 *
 * It lives beside `canvasRenderer.js` rather than inside it for the plain reason that the
 * renderer is already close to the 400-line limit, and because sampling is a separate job
 * from drawing: this module reads the frame and the loop's render state, the layer reads only
 * the history. Nothing here touches a canvas.
 *
 * The frame order is fixed and the caller must not reorder it: `advance` once, then one
 * sample per dashing object, then `settle`. Sampling happens before anything is drawn, so a
 * ribbon and the object it belongs to are never a frame apart.
 */

import { PLAYER_DASH_SPEED, PLAYER_MAX_SPEED, SIMULATION_STEP_SECONDS } from '../gameConfig.js';
import { boidTrailStrength, OVERDRIVE_TRAIL_BASE_SHARE, trailStrength } from './dashTrail.js';

/**
 * Heading used when an object is momentarily at rest — the same fallback the boid arrows use,
 * for the same reason: a zero velocity has no direction to point a shape along.
 */
const DEFAULT_HEADING_X = 1;
const DEFAULT_HEADING_Y = 0;

/**
 * Opens a frame, samples every object that is currently dashing, and closes it again.
 * @param {import('./dashTrailHistory.js').DashTrails} trails - The history to write into.
 * @param {object} frame - The engine's flat-buffer frame, as normalized by `engine-bridge.js`.
 * @param {{x: number, y: number}} playerPosition - Current player position.
 * @param {object} renderState - The loop's render state. Read here are `deltaSeconds` (wall
 *   time of the drawn frame), `playerSpeed`, `playerVelocityX`, `playerVelocityY` and
 *   `powerupBuffs`.
 * @returns {void}
 */
export function sampleDashTrails(trails, frame, playerPosition, renderState) {
  // Wall time, not simulation time: the launch ring is presentation and runs with the frame
  // rate. The ribbon itself needs no clock at all — its shape comes from the history alone.
  trails.advance(renderState.deltaSeconds ?? SIMULATION_STEP_SECONDS);
  samplePlayerTrail(trails, playerPosition, renderState);
  sampleBoidTrails(trails, frame);
  trails.settle();
}

/**
 * The player's trail. Its heading comes from the velocity direction, which is the direction
 * the dash was launched in.
 *
 * The speed and the velocity are passed in through the render state rather than read from the
 * controller: the renderer has no business holding a reference to the simulation side, and
 * these are three numbers the loop already has in hand.
 *
 * While Overdrive runs the threshold drops, which is the whole of that buff's own look: the
 * streak then runs during ordinary movement instead of only during a dash.
 */
function samplePlayerTrail(trails, playerPosition, renderState) {
  if (!playerPosition || renderState.playerSpeed === undefined) return;

  const speed = renderState.playerSpeed;
  const overdriveRuns = renderState.powerupBuffs?.overdrive !== undefined;
  const baseSpeed = overdriveRuns
    ? PLAYER_MAX_SPEED * OVERDRIVE_TRAIL_BASE_SHARE
    : PLAYER_MAX_SPEED;
  const strength = trailStrength(speed, baseSpeed, PLAYER_DASH_SPEED);
  if (strength <= 0) return;

  const headingX = speed === 0 ? DEFAULT_HEADING_X : (renderState.playerVelocityX ?? 0) / speed;
  const headingY = speed === 0 ? DEFAULT_HEADING_Y : (renderState.playerVelocityY ?? 0) / speed;

  trails.samplePlayer(playerPosition.x, playerPosition.y, headingX, headingY, strength);
}

/**
 * One trail per boid the engine reports as dashing. That is `dashPhases[i] < 0`, which the
 * frame already carries — no new buffer crosses the WASM boundary for this.
 */
function sampleBoidTrails(trails, frame) {
  if (!frame) return;

  const positions = frame.positions;
  const dashPhases = frame.dashPhases;
  if (!positions || !dashPhases) return;

  const velocities = frame.velocities;
  const tiers = frame.tiers;

  for (let index = 0; index < positions.length; index += 2) {
    const boidIndex = index / 2;
    const strength = boidTrailStrength(dashPhases[boidIndex] ?? 0);
    if (strength <= 0) continue;

    const velocityX = velocities?.[index] ?? 0;
    const velocityY = velocities?.[index + 1] ?? 0;
    const speed = Math.hypot(velocityX, velocityY);
    const headingX = speed === 0 ? DEFAULT_HEADING_X : velocityX / speed;
    const headingY = speed === 0 ? DEFAULT_HEADING_Y : velocityY / speed;

    trails.sampleBoid(
      boidIndex,
      tiers?.[boidIndex] ?? 0,
      positions[index],
      positions[index + 1],
      headingX,
      headingY,
      strength,
    );
  }
}
