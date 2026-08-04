/**
 * The line in front of a boid that is about to lunge: where the dash would go, and how far
 * it would carry.
 *
 * The pulse (`dashPulse.js`, drawn into the boid itself) already says *that* a dash is
 * coming and *when*. This layer adds the one question the pulse cannot answer, which is
 * where to. Without it the warning tells the player to move without telling them where.
 *
 * The whole geometry comes from the engine's `dash_aims` buffer — start point, end point and
 * charge progress per charging boid — and none of it is recomputed here. That is the point:
 * the engine picks the dash direction in the single step the dash launches, and the same
 * function that writes it also produces this line, so the line cannot promise a direction
 * the launch will not take. A frontend that recalculated "towards the player" would drift
 * apart from the engine the first time that aim rule changes.
 *
 * Two consequences of the buffer worth knowing while reading the loop below:
 *
 *  - **An entry exists only while a boid is charging.** The buffer is the warning: it is
 *    empty on nearly every frame, it fills when a boid starts pulsing, and the entry is gone
 *    on the step the boid launches — where `trailLayer.js` takes over with the ion streak.
 *    So there is no state to check and no "nothing here" value to skip.
 *  - **It is not index-aligned with the boid buffers**, so each entry carries its own start
 *    point and its own copy of the charge progress rather than an index into `positions`.
 *
 * Red, thin and dashed, and every part of that is deliberate: red is the swarm's colour and
 * the colour of everything that costs the player something, thin and broken keeps a line
 * that can be ~270 px long from reading as a solid object of its own — up to a dozen of them
 * can be on screen at once. As in `spawnMarkerLayer.js` the opacity changes every frame, so
 * no `rgba(...)` may be built inside the loop; every shade a line can wear exists before the
 * first frame is drawn.
 */

import { DASH_AIM_STRIDE } from '../gameConfig.js';
import { dashAimAlpha } from './dashPulse.js';

/** Colour template — `ALPHA` is replaced by `buildAlphaTable`. */
const T_LINE = 'rgba(240, 58, 95, ALPHA)';

const FADE_STEPS = 12;
const LINE = buildAlphaTable(T_LINE, FADE_STEPS);

/** Opacity of the strongest line, just before the launch. Never fully opaque. */
const LINE_ALPHA = 0.85;

/** World units, the same hairline the boid outline is drawn with. */
const LINE_WIDTH = 1.5;

/**
 * Dash and gap in world units. The dash is the longer of the two so the line reads as a
 * line rather than as a row of dots, and at 10 + 8 a boid's reach of 220–280 px breaks into
 * twelve to fifteen segments — enough to be unmistakably dashed at any window size.
 */
const LINE_DASH = [10, 8];

/**
 * Draws one warning line per charging boid.
 *
 * Silent on the frames where nobody is charging, which is most of them.
 * @param {CanvasRenderingContext2D} ctx - The target context, in world space.
 * @param {object} frame - Engine frame, as normalized by `engine-bridge.js`.
 * @returns {void}
 */
export function drawDashAimLines(ctx, frame) {
  const aims = frame.dashAims;
  if (!aims || !frame.dashAimCount) {
    return;
  }

  ctx.save();
  // Inside the bracket on purpose: the dash pattern is part of the canvas drawing state, so
  // a leak here would break up the boid outlines and every other stroke drawn after this.
  ctx.setLineDash(LINE_DASH);
  ctx.lineWidth = LINE_WIDTH;

  for (let index = 0; index < frame.dashAimCount; index += 1) {
    const offset = index * DASH_AIM_STRIDE;
    const chargeProgress = aims[offset + 4];

    ctx.strokeStyle = LINE[shadeFor(dashAimAlpha(chargeProgress) * LINE_ALPHA)];
    ctx.beginPath();
    ctx.moveTo(aims[offset], aims[offset + 1]);
    ctx.lineTo(aims[offset + 2], aims[offset + 3]);
    ctx.stroke();
  }

  ctx.restore();
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
