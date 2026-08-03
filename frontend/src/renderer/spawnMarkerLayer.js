/**
 * Where the next wave will come in — drawn at the world edge for the length of the
 * engine's warning window, while there is still nothing there.
 *
 * **The graphic is a placeholder.** A red glow plus a ring that closes in on the spawn
 * point, deliberately not a SIGNAL design-system component yet: the point of this pass is
 * the mechanic, and the final artwork replaces the two draw helpers below without touching
 * the buffer decode, the layer order, or anything in the engine.
 *
 * Two things about it are not placeholder and should survive the redesign:
 *
 *  - **One marker per announced boid, not per gate.** The engine spreads a gate's boids
 *    about 28 units apart and the glow reaches `SPAWN_MARKER_RADIUS` (34), so the glows
 *    overlap into a single arc along the edge. The gate needs no concept of its own on
 *    either side of the boundary, and the marker is literally the spot each boid appears
 *    at — which is what the player is being told.
 *  - **The ring shrinks rather than grows.** An obstacle's spawn ring runs outwards
 *    (`obstacleLayer.js`), because an obstacle is already where it will be. A marker
 *    points at somewhere still empty, so its ring collapses onto the spawn point and lands
 *    exactly as the boids do.
 *
 * Red because this is a warning, and the swarm is red too — which is the reason the glow
 * stays a soft low-opacity wash rather than a filled shape: a solid red disc would compete
 * with ninety moving boids for the same colour. The opacity changes every frame, so as in
 * `obstacleLayer.js` no `rgba(...)` may be built per frame; every colour a marker can wear
 * exists before the first frame is drawn.
 */

import { SPAWN_MARKER_RADIUS, SPAWN_MARKER_STRIDE } from '../gameConfig.js';
import {
  spawnMarkerFlicker,
  spawnMarkerIntensity,
  spawnMarkerRingScale,
} from './spawnMarkerPulse.js';

/** Colour templates — `ALPHA` is replaced by `buildAlphaTable`. */
const T_GLOW = 'rgba(240, 58, 95, ALPHA)';
const T_RING = 'rgba(255, 120, 140, ALPHA)';
const T_CORE = 'rgba(255, 226, 232, ALPHA)';

const FADE_STEPS = 12;
const GLOW = buildAlphaTable(T_GLOW, FADE_STEPS);
const RING = buildAlphaTable(T_RING, FADE_STEPS);
const CORE = buildAlphaTable(T_CORE, FADE_STEPS);

/**
 * Peak opacity of each of the three parts. The glow is the faintest by a wide margin
 * because it is also the largest — see the note about red above.
 */
const GLOW_ALPHA = 0.3;
const RING_ALPHA = 0.7;
const CORE_ALPHA = 0.85;

const RING_WIDTH = 2;

/** How much of the glow radius the bright centre dot takes up. */
const CORE_RADIUS_SHARE = 0.16;

/**
 * Draws a marker for every boid the engine has announced but not let in yet.
 *
 * Silent on the frames where nothing is pending, which is nearly all of them.
 * @param {CanvasRenderingContext2D} ctx - The target context, in world space.
 * @param {object} frame - Engine frame, as normalized by `engine-bridge.js`.
 * @param {number} wallClockSeconds - Seconds since page load, for the flicker only.
 * @returns {void}
 */
export function drawSpawnMarkers(ctx, frame, wallClockSeconds) {
  const markers = frame.spawnMarkers;
  if (!markers || !frame.spawnMarkerCount) {
    return;
  }

  // One flicker for the whole frame rather than one per marker: the boids of a gate are
  // announcing the same arrival, so they have to beat together.
  const flicker = spawnMarkerFlicker(wallClockSeconds);

  ctx.save();

  for (let index = 0; index < frame.spawnMarkerCount; index += 1) {
    const offset = index * SPAWN_MARKER_STRIDE;
    const x = markers[offset];
    const y = markers[offset + 1];
    const warningProgress = markers[offset + 2];
    const intensity = spawnMarkerIntensity(warningProgress) * flicker;

    drawGlow(ctx, x, y, intensity);
    drawClosingRing(ctx, x, y, spawnMarkerRingScale(warningProgress), intensity);
  }

  ctx.restore();
}

/**
 * The wash itself, plus the bright dot that marks the exact spot inside it.
 *
 * The dot is what keeps the marker precise: the glow of a whole gate is one soft arc, so
 * without it the player would know roughly where but not exactly.
 */
function drawGlow(ctx, x, y, intensity) {
  ctx.fillStyle = GLOW[shadeFor(intensity * GLOW_ALPHA)];
  ctx.beginPath();
  ctx.arc(x, y, SPAWN_MARKER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = CORE[shadeFor(intensity * CORE_ALPHA)];
  ctx.beginPath();
  ctx.arc(x, y, SPAWN_MARKER_RADIUS * CORE_RADIUS_SHARE, 0, Math.PI * 2);
  ctx.fill();
}

/** The ring that closes in on the spawn point as the arrival approaches. */
function drawClosingRing(ctx, x, y, ringScale, intensity) {
  ctx.strokeStyle = RING[shadeFor(intensity * RING_ALPHA)];
  ctx.lineWidth = RING_WIDTH;
  ctx.beginPath();
  ctx.arc(x, y, SPAWN_MARKER_RADIUS * ringScale, 0, Math.PI * 2);
  ctx.stroke();
}

/** Which precomputed opacity step a level between 0 and 1 rounds to. */
function shadeFor(level) {
  return Math.min(FADE_STEPS - 1, Math.max(0, Math.round(level * (FADE_STEPS - 1))));
}

/** Precomputes one colour string per opacity step from a template. */
function buildAlphaTable(template, steps) {
  const table = [];

  for (let step = 0; step < steps; step += 1) {
    const alpha = (step + 1) / steps;
    table.push(template.replace('ALPHA', alpha.toFixed(3)));
  }

  return table;
}
