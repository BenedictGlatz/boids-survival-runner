/**
 * Obstacle rendering — the "Hazard Tape" look of the SIGNAL design system.
 *
 * Same buffer contract as before (`OBSTACLE_STRIDE`, `life_fraction`, `hit_flash`) and
 * the same single draw path: an obstacle is one round-capped stroke along its centre
 * line, so a circle is just a capsule whose line has zero length. No engine change.
 *
 * What is new is the stroke sequence, three instead of two:
 *  - a hatched body and a red danger edge instead of a plain slate rim,
 *  - a halo ring while it appears and an amber edge while it expires, both derived from
 *    `life_fraction` alone — no extra buffer value,
 *  - a white hit edge, because a red flash on an already red edge would be invisible.
 *
 * The hatching is the one signal that works without colour and tells an obstacle apart
 * from a hole in the ground, and it stays dark enough that the swarm keeps the visual
 * priority. Never fill a large area in red: red is the colour of ninety moving boids.
 *
 * The colour tables work like the previous version's. An obstacle's opacity changes every
 * frame, so no `rgba(...)` may be built per frame — every colour an obstacle can ever
 * have exists before the first frame is drawn.
 */

import { OBSTACLE_FADE_SHARE, OBSTACLE_STRIDE } from '../gameConfig.js';
import { obstacleFadeLevel } from './obstacleFade.js';

/** Slate: the obstacle body reads as world, not as an entity. */
const BODY_COLOR = '#2a313f';

/** Width of the sharp outer edge. It carries the danger signal. */
const EDGE_WIDTH = 1.5;

/**
 * From which radius on the centre is darkened, and how wide the hatching stays as a band
 * along the rim. Below that threshold an obstacle is so thin that a core would eat it.
 */
const CORE_MIN_RADIUS = 8;
const CORE_BAND_WIDTH = 7;

/** Opacity of the darkened core, as a level of the alpha table. */
const CORE_ALPHA = 0.42;

/** How far the spawn ring runs past the surface, in pixels. */
const SPAWN_RING_REACH = 34;
const SPAWN_RING_ALPHA = 0.09;
const SPAWN_RING_EDGE_ALPHA = 0.5;
const SPAWN_RING_INSET = 6;

/** The hatch tile: two diagonals, so the pattern runs on across the seam. */
const HATCH_TILE_SIZE = 10;
const HATCH_LINE_WIDTH = 3.5;
const HATCH_LINE_COLOR = 'rgba(240, 58, 95, 0.3)';
const HATCH_LINE_OVERSHOOT = 2;
const HATCH_LINE_OFFSET = 3;

/** Width of the white edge of a hit flash. */
const HIT_EDGE_WIDTH = 2;

/** Colour templates — `ALPHA` is replaced by `buildAlphaTable`. */
const T_CORE = 'rgba(14, 17, 24, ALPHA)';
const T_EDGE_DANGER = 'rgba(240, 90, 110, ALPHA)';
const T_EDGE_WARNING = 'rgba(251, 191, 36, ALPHA)';
const T_HALO = 'rgba(240, 58, 95, ALPHA)';
const T_HIT_FILL = 'rgba(220, 38, 38, ALPHA)';
const T_HIT_EDGE = 'rgba(255, 255, 255, ALPHA)';

const FADE_STEPS = 12;
const CORE = buildAlphaTable(T_CORE, FADE_STEPS);
const EDGE_DANGER = buildAlphaTable(T_EDGE_DANGER, FADE_STEPS);
const EDGE_WARNING = buildAlphaTable(T_EDGE_WARNING, FADE_STEPS);
const HALO = buildAlphaTable(T_HALO, FADE_STEPS);
const HIT_FILL = buildAlphaTable(T_HIT_FILL, FADE_STEPS);
const HIT_EDGE = buildAlphaTable(T_HIT_EDGE, FADE_STEPS);

/**
 * The warning hatch as a canvas pattern. Built once and reused — a `createPattern` per
 * frame would be an allocation on the hot path.
 */
let hatchPattern = null;

/**
 * Returns the hatch pattern, or the plain body colour where no pattern can be built.
 *
 * The fallback is what keeps this module testable: the unit suite runs in Node and hands
 * in a recording stub instead of a real context, so there is neither a `document` to
 * create the tile canvas on nor a `createPattern` to call. Under Node the hatching is not
 * observable anyway — the stroke geometry, which is what the tests assert on, is.
 */
function hatch(ctx) {
  if (hatchPattern) {
    return hatchPattern;
  }

  if (typeof document === 'undefined' || typeof ctx.createPattern !== 'function') {
    return BODY_COLOR;
  }

  const tile = document.createElement('canvas');
  tile.width = HATCH_TILE_SIZE;
  tile.height = HATCH_TILE_SIZE;

  const tileCtx = tile.getContext('2d');
  tileCtx.fillStyle = BODY_COLOR;
  tileCtx.fillRect(0, 0, HATCH_TILE_SIZE, HATCH_TILE_SIZE);
  tileCtx.strokeStyle = HATCH_LINE_COLOR;
  tileCtx.lineWidth = HATCH_LINE_WIDTH;
  tileCtx.beginPath();

  // Both diagonals run past the tile edges: a single stroke per tile tears at the seam.
  tileCtx.moveTo(-HATCH_LINE_OVERSHOOT, HATCH_TILE_SIZE + HATCH_LINE_OVERSHOOT);
  tileCtx.lineTo(HATCH_TILE_SIZE + HATCH_LINE_OVERSHOOT, -HATCH_LINE_OVERSHOOT);
  tileCtx.moveTo(HATCH_LINE_OFFSET, HATCH_TILE_SIZE + HATCH_LINE_OFFSET + HATCH_LINE_OVERSHOOT);
  tileCtx.lineTo(HATCH_TILE_SIZE + HATCH_LINE_OFFSET + HATCH_LINE_OVERSHOOT, HATCH_LINE_OFFSET);
  tileCtx.stroke();

  hatchPattern = ctx.createPattern(tile, 'repeat');
  return hatchPattern;
}

/**
 * Draws every obstacle in the frame.
 * @param {CanvasRenderingContext2D} ctx - The target context.
 * @param {object} frame - Engine frame, as normalized by `engine-bridge.js`.
 * @returns {void}
 */
export function drawObstacles(ctx, frame) {
  const obstacles = frame.obstacles;
  if (!obstacles || !frame.obstacleCount) {
    return;
  }

  ctx.save();
  ctx.lineCap = 'round';

  for (let index = 0; index < frame.obstacleCount; index += 1) {
    const offset = index * OBSTACLE_STRIDE;
    const startX = obstacles[offset];
    const startY = obstacles[offset + 1];
    const endX = obstacles[offset + 2];
    const endY = obstacles[offset + 3];
    const radius = obstacles[offset + 4];
    const lifeFraction = obstacles[offset + 5];
    const hitFlash = obstacles[offset + 6];

    const fade = obstacleFadeLevel(lifeFraction, OBSTACLE_FADE_SHARE);
    if (fade <= 0) {
      continue;
    }

    // `life_fraction` is the remaining lifetime in (0, 1]: near 1 means it just appeared,
    // near 0 means it is running out. Both phases are exactly the fade windows, so
    // recognising them needs no further value and no state of its own.
    const isSpawning = lifeFraction > 1 - OBSTACLE_FADE_SHARE;
    const isExpiring = lifeFraction < OBSTACLE_FADE_SHARE;
    const shade = shadeFor(fade);

    if (isSpawning) {
      drawSpawnRing(ctx, startX, startY, endX, endY, radius, fade);
    }

    drawBody(ctx, startX, startY, endX, endY, radius, fade);

    // Amber while expiring — the same colour every other temporary state wears, so the
    // player learns the meaning once and can read it anywhere.
    ctx.strokeStyle = isExpiring ? EDGE_WARNING[shade] : EDGE_DANGER[shade];
    ctx.lineWidth = EDGE_WIDTH;
    strokeSpine(ctx, startX, startY, endX, endY);

    if (hitFlash > 0) {
      // Its own opacity is folded in, so a disappearing obstacle cannot flash at full
      // strength.
      drawHitFlash(ctx, startX, startY, endX, endY, radius, hitFlash * fade);
    }
  }

  ctx.restore();
}

/**
 * Body: hatching across the full width, then a darkened core on top, so the hatching only
 * acts as a band along the rim and the boids stay readable over the middle. A thin bar
 * loses the core by itself.
 *
 * A pattern carries no opacity, so `globalAlpha` does the fading for this one stroke. The
 * core comes from the alpha table again afterwards.
 */
function drawBody(ctx, startX, startY, endX, endY, radius, fade) {
  ctx.globalAlpha = fade;
  ctx.strokeStyle = hatch(ctx);
  ctx.lineWidth = radius * 2;
  strokeSpine(ctx, startX, startY, endX, endY);
  ctx.globalAlpha = 1;

  if (radius <= CORE_MIN_RADIUS) {
    return;
  }

  ctx.strokeStyle = CORE[shadeFor(fade * CORE_ALPHA)];
  ctx.lineWidth = radius * 2 - CORE_BAND_WIDTH;
  strokeSpine(ctx, startX, startY, endX, endY);
}

/**
 * A ring that runs outwards as an obstacle appears, so it lands instead of fading in.
 * One stroke of width `(radius + reach) * 2` at very low opacity — the same capsule
 * geometry, only thicker, so there is no second kind of path.
 */
function drawSpawnRing(ctx, startX, startY, endX, endY, radius, fade) {
  const grow = 1 - fade; // fade runs 0 -> 1, so the ring closes in from outside

  ctx.strokeStyle = HALO[shadeFor(fade * SPAWN_RING_ALPHA)];
  ctx.lineWidth = (radius + SPAWN_RING_INSET + grow * SPAWN_RING_REACH) * 2;
  strokeSpine(ctx, startX, startY, endX, endY);

  ctx.strokeStyle = EDGE_DANGER[shadeFor(fade * SPAWN_RING_EDGE_ALPHA)];
  ctx.lineWidth = EDGE_WIDTH;
  strokeSpine(ctx, startX, startY, endX, endY);
}

/**
 * Hit flash: the area red as built, but the edge **white** — the ordinary edge is already
 * red here, so a red rim on top of it would be invisible.
 */
function drawHitFlash(ctx, startX, startY, endX, endY, radius, level) {
  const shade = shadeFor(level);

  ctx.strokeStyle = HIT_FILL[shade];
  ctx.lineWidth = radius * 2;
  strokeSpine(ctx, startX, startY, endX, endY);

  ctx.strokeStyle = HIT_EDGE[shade];
  ctx.lineWidth = HIT_EDGE_WIDTH;
  strokeSpine(ctx, startX, startY, endX, endY);
}

/**
 * Strokes an obstacle's centre line. A zero-length line still paints, because the round
 * cap gives it a circle, but only if both endpoints are handed over — some canvas
 * implementations skip a `lineTo` back to the same point, so the tiny offset below keeps
 * the circle case reliable.
 */
function strokeSpine(ctx, startX, startY, endX, endY) {
  ctx.beginPath();
  ctx.moveTo(startX, startY);

  if (startX === endX && startY === endY) {
    ctx.lineTo(endX + 0.01, endY);
  } else {
    ctx.lineTo(endX, endY);
  }

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
