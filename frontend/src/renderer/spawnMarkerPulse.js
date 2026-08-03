/**
 * The arithmetic behind a spawn marker, split out for the same reason `dashPulse.js` and
 * `frameGraphScale.js` are: it imports nothing, so Vitest can cover it in the `node`
 * environment without a canvas or a built WASM package. What is left in
 * `spawnMarkerLayer.js` is the drawing, which Playwright covers instead.
 *
 * Two numbers come out of one engine value. `warningProgress` runs from `0` the step a
 * wave is announced towards `1` as its boids arrive, and the marker has to say both *that*
 * something is coming and *when*:
 *
 *  - the intensity brightens over the window, which is the "that",
 *  - the ring scale closes in on the spawn point, which is the "when".
 *
 * The flicker on top is presentation and runs on wall time, so it is the one input here
 * that is not derived from the simulation.
 */

import {
  SPAWN_MARKER_MINIMUM_INTENSITY,
  SPAWN_MARKER_PULSE_DEPTH,
  SPAWN_MARKER_PULSE_HZ,
  SPAWN_MARKER_RING_END_SCALE,
  SPAWN_MARKER_RING_START_SCALE,
} from '../gameConfig.js';

/**
 * How brightly a marker is drawn, from the engine's warning progress.
 *
 * Never zero: a marker that faded up from nothing would be invisible for the first half
 * of exactly the window it exists to fill, so it starts at
 * `SPAWN_MARKER_MINIMUM_INTENSITY` and reaches full strength as the boids arrive.
 * @param {number} warningProgress - Engine value between 0 and 1.
 * @returns {number} Brightness between `SPAWN_MARKER_MINIMUM_INTENSITY` and 1.
 */
export function spawnMarkerIntensity(warningProgress) {
  const progress = clampToUnit(warningProgress);

  return SPAWN_MARKER_MINIMUM_INTENSITY + (1 - SPAWN_MARKER_MINIMUM_INTENSITY) * progress;
}

/**
 * How wide the marker's outer ring is, as a multiple of the glow radius.
 *
 * Shrinks from `SPAWN_MARKER_RING_START_SCALE` onto `SPAWN_MARKER_RING_END_SCALE`, so the
 * ring lands on the spawn point exactly as the boids do. It is the inverse of the obstacle
 * spawn ring, which grows *outwards* — an obstacle is already where it will be, while a
 * marker is pointing at somewhere still empty.
 * @param {number} warningProgress - Engine value between 0 and 1.
 * @returns {number} Ring radius as a multiple of the marker radius.
 */
export function spawnMarkerRingScale(warningProgress) {
  const progress = clampToUnit(warningProgress);

  return (
    SPAWN_MARKER_RING_START_SCALE +
    (SPAWN_MARKER_RING_END_SCALE - SPAWN_MARKER_RING_START_SCALE) * progress
  );
}

/**
 * The flicker laid over the intensity, on wall time.
 *
 * One multiplier rather than a second brightness, so the caller applies it to whatever
 * `spawnMarkerIntensity` returned and the two cannot disagree about the range. It never
 * reaches zero — a marker that blinked out entirely would read as gone rather than as
 * pulsing.
 * @param {number} wallClockSeconds - Seconds since the page loaded.
 * @returns {number} Multiplier between `1 - SPAWN_MARKER_PULSE_DEPTH` and 1.
 */
export function spawnMarkerFlicker(wallClockSeconds) {
  const phase = wallClockSeconds * SPAWN_MARKER_PULSE_HZ * Math.PI * 2;
  // cos runs 1 -> -1, so half of it below 1 keeps the trough at exactly 1 - depth.
  const trough = (1 - Math.cos(phase)) * 0.5;

  return 1 - SPAWN_MARKER_PULSE_DEPTH * trough;
}

/** Keeps a value the engine promises to be in `[0, 1]` inside that range regardless. */
function clampToUnit(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}
