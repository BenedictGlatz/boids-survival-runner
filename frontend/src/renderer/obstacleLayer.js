import { OBSTACLE_FADE_SHARE, OBSTACLE_STRIDE } from '../gameConfig.js';
import { obstacleFadeLevel } from './obstacleFade.js';

// Drawing the temporary obstacles. Its own module rather than another helper in
// canvasRenderer.js, which is close enough to the 400-line limit that the split would
// have been forced sooner or later anyway.

/** Dark slate, so an obstacle reads as part of the world rather than as an entity. */
const OBSTACLE_FILL_COLOR = 'rgba(71, 85, 105, ALPHA)';
/** A brighter rim, which is what makes the shape legible against the background. */
const OBSTACLE_EDGE_COLOR = 'rgba(148, 163, 184, ALPHA)';
const OBSTACLE_EDGE_WIDTH = 2;

/**
 * The red an obstacle flashes in right after the player ran into it. Drawn over the
 * ordinary colours rather than instead of them, so the flash fades back into the
 * obstacle's own look as it dies down and needs no second set of shades per obstacle.
 */
const OBSTACLE_HIT_FILL_COLOR = 'rgba(220, 38, 38, ALPHA)';
const OBSTACLE_HIT_EDGE_COLOR = 'rgba(254, 202, 202, ALPHA)';

/**
 * Opacity steps the two obstacle colours are precomputed in.
 *
 * Same reasoning as the boid glow table: an obstacle's opacity changes every frame
 * while it fades, and building an `rgba(...)` string per obstacle per frame would
 * allocate on the hot path. Quantising to a fixed number of steps means every colour
 * an obstacle can ever have already exists before the first frame.
 */
const FADE_STEPS = 12;
const OBSTACLE_FILL_COLORS = buildAlphaTable(OBSTACLE_FILL_COLOR, FADE_STEPS);
const OBSTACLE_EDGE_COLORS = buildAlphaTable(OBSTACLE_EDGE_COLOR, FADE_STEPS);
const OBSTACLE_HIT_FILL_COLORS = buildAlphaTable(OBSTACLE_HIT_FILL_COLOR, FADE_STEPS);
const OBSTACLE_HIT_EDGE_COLORS = buildAlphaTable(OBSTACLE_HIT_EDGE_COLOR, FADE_STEPS);

/**
 * Draws every obstacle in the frame.
 *
 * Both obstacle shapes go through one path. An obstacle is a capsule — a centre line
 * swept by a circle — and a round line cap on a zero-length line is exactly a circle,
 * so a stroked line of width `radius * 2` draws the bar and the circle alike. There is
 * no shape flag in the buffer and no branch here to match one.
 * @param {CanvasRenderingContext2D} ctx - The canvas context to draw into.
 * @param {object} frame - The engine frame, as normalized by `engine-bridge.js`.
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

    const shade = shadeFor(fade);

    // The body, as one thick round-capped stroke.
    ctx.strokeStyle = OBSTACLE_FILL_COLORS[shade];
    ctx.lineWidth = radius * 2;
    strokeSpine(ctx, startX, startY, endX, endY);

    // The rim, as the same stroke drawn thinner and brighter. Stroking the outline of
    // a capsule properly would mean building the path by hand; drawing it inset like
    // this is a pixel or two off and reads identically.
    ctx.strokeStyle = OBSTACLE_EDGE_COLORS[shade];
    ctx.lineWidth = OBSTACLE_EDGE_WIDTH;
    strokeSpine(ctx, startX, startY, endX, endY);

    if (hitFlash <= 0) {
      continue;
    }

    // The same two strokes again in red, at the flash's own strength: the obstacle the
    // player just ran into, fading back to its ordinary colour over a few frames. The
    // obstacle's fade is folded in so one that is disappearing cannot flash at full
    // opacity.
    const flashShade = shadeFor(hitFlash * fade);

    ctx.strokeStyle = OBSTACLE_HIT_FILL_COLORS[flashShade];
    ctx.lineWidth = radius * 2;
    strokeSpine(ctx, startX, startY, endX, endY);

    ctx.strokeStyle = OBSTACLE_HIT_EDGE_COLORS[flashShade];
    ctx.lineWidth = OBSTACLE_EDGE_WIDTH;
    strokeSpine(ctx, startX, startY, endX, endY);
  }

  ctx.restore();
}

/**
 * Strokes an obstacle's centre line. A zero-length line still paints, because the
 * round cap gives it a circle, but only if both endpoints are handed over — some
 * canvas implementations skip a `lineTo` back to the same point, so the tiny offset
 * below keeps the circle case reliable.
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
