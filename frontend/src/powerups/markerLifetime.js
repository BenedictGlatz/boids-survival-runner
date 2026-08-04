/**
 * A marker's time on the ground: how it arrives, how long it stays, how it shows that, and the
 * one thing that can end it early.
 *
 * Split out of `powerups.js` when the early ending arrived and that file went past the 400-line
 * limit — the third cut along the same seam, after `markerClearance.js` took the spawn geometry
 * and `mend.js` everything to do with lives. The seam is a real one: nothing here knows about
 * kinds, buffs, the spawn order or the player, and every function takes one marker record plus
 * the clock. That is also what makes it the half that can be tested by handing it an object
 * literal.
 *
 * The record itself is created here too, so the field names exist in exactly one place rather
 * than being written in `powerups.js` and read back here.
 */

import { PICKUP_RADIUS } from '../renderer/powerupMarkerLayer.js';
import { isTooCloseToAnObstacle } from './markerClearance.js';

/** How long an untouched marker lies there. One that lies forever is no longer a decision. */
export const MARKER_LIFETIME_MS = 12000;

/** How long a fresh marker takes to scale in. A marker never simply appears. */
const SPAWN_SCALE_IN_MS = 450;

/**
 * How long a marker takes to scale away once an obstacle has grown over it.
 *
 * A marker is placed clear of every hazard, but obstacles keep arriving after it has settled —
 * one appears roughly as often as a marker does and then stands for forty seconds — so sooner or
 * later one grows over a marker already lying there. That marker sits in a hazard, so it goes;
 * it just does not go *abruptly*, because a marker that blinks out in front of the player reads
 * as theft.
 *
 * Comfortably inside the engine's `OBSTACLE_ARMING_STEPS` (90 steps, 1.5 s), during which a new
 * obstacle is drawn but not yet solid. The marker is therefore gone before the hazard that took
 * it could cost anybody a life.
 */
const OBSTACLE_RETIRE_FADE_MS = 350;

/**
 * How close an obstacle has to come before a marker already lying there gives up its spot.
 *
 * The drawn hexagon, not the generous `MIN_OBSTACLE_CLEARANCE` a marker is *placed* with: it goes
 * only once the hazard actually reaches the glyph. Retiring at the placement distance would throw
 * away markers that are a comfortable run away from a new obstacle and perfectly collectable —
 * the cure would take more markers than the disease.
 */
const MARKER_OVERLAP_CLEARANCE = PICKUP_RADIUS;

/**
 * A fresh marker record.
 *
 * The expiry is stored as an absolute timestamp rather than derived from the spawn time, the same
 * way a buff holds its `endsAtMs`: the spawn time is still needed for the scale-in, but only a
 * stored expiry could ever be a different one per marker.
 * @param {'aegis'|'mend'|'overdrive'} kind - Which power-up lies there.
 * @param {number} x - Where it lies.
 * @param {number} y - Where it lies.
 * @param {number} simulationMs - `gameData.simulationTimeMs` at the moment it appears.
 * @returns {{kind: string, x: number, y: number, spawnedAtMs: number, expiresAtMs: number,
 *   retiringSinceMs: number}} The record every other function here reads.
 */
export function newMarker(kind, x, y, simulationMs) {
  return {
    kind,
    x,
    y,
    spawnedAtMs: simulationMs,
    expiresAtMs: simulationMs + MARKER_LIFETIME_MS,
    // -1 means "running normally". Set once, when an obstacle grows over the marker.
    retiringSinceMs: -1,
  };
}

/**
 * How much of the marker is drawn: it scales in on arrival and back out if a hazard took its spot.
 *
 * One number for both directions, because they are the same statement reversed and the renderer
 * should not have to know which of the two is running.
 * @param {object} marker - A record from `newMarker`.
 * @param {number} simulationMs - `gameData.simulationTimeMs`.
 * @returns {number} `0`..`1`.
 */
export function markerScale(marker, simulationMs) {
  return Math.min(
    1,
    (simulationMs - marker.spawnedAtMs) / SPAWN_SCALE_IN_MS,
    retireScale(marker, simulationMs),
  );
}

/**
 * How much of its time on the ground is left, for the ring that runs around it.
 *
 * The same fraction a running buff reports, so both can be drawn with the same arc: a marker
 * about to be taken back says so, instead of being there one frame and gone the next.
 *
 * Deliberately **not** cut short when a hazard retires the marker early. Doing that would make
 * the ring jump from whatever it showed to nearly nothing in a single frame, and a countdown that
 * jumps has stopped being one. The ring keeps telling the truth about the lifetime; the leaving
 * is carried by `markerScale`.
 * @param {object} marker - A record from `newMarker`.
 * @param {number} simulationMs - `gameData.simulationTimeMs`.
 * @returns {number} `1`..`0`.
 */
export function markerRemaining(marker, simulationMs) {
  return Math.max(0, (marker.expiresAtMs - simulationMs) / MARKER_LIFETIME_MS);
}

/**
 * Whether the marker is done, either way: its time ran out or it has finished scaling away.
 * @param {object} marker - A record from `newMarker`.
 * @param {number} simulationMs - `gameData.simulationTimeMs`.
 * @returns {boolean} True once it should no longer be in the arena.
 */
export function hasLeftTheArena(marker, simulationMs) {
  return simulationMs >= marker.expiresAtMs || retireScale(marker, simulationMs) <= 0;
}

/**
 * Whether a hazard has grown over this marker since it was placed.
 * @param {object} marker - A record from `newMarker`.
 * @param {object} [frame] - The engine's frame, read for the obstacle geometry.
 * @returns {boolean} True when the marker has to start leaving.
 */
export function isCoveredByAnObstacle(marker, frame) {
  return isTooCloseToAnObstacle(marker.x, marker.y, frame, MARKER_OVERLAP_CLEARANCE);
}

/** `1` while the marker is not retiring, then down to `0` across the fade. */
function retireScale(marker, simulationMs) {
  if (marker.retiringSinceMs < 0) {
    return 1;
  }

  return 1 - (simulationMs - marker.retiringSinceMs) / OBSTACLE_RETIRE_FADE_MS;
}
