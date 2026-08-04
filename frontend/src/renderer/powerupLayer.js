/**
 * Everything a power-up puts **on the player**: the Aegis shell, the remaining-time arcs, the
 * shatter a spent shield leaves behind, and Mend's one-off arc.
 *
 * The counterpart of `powerupMarkerLayer.js`, which draws what still lies in the arena. The
 * shapes and colours come from there rather than being repeated here, because the shell on the
 * player is the marker's own hexagon moved onto them — that is the entire explanation the
 * effect gets, and it only works if the two are literally the same hexagon.
 *
 * The split between the two files also draws the line the design system draws
 * (`docs/design_system/design-system.md` §11) between a **state** and an **event**: Aegis and
 * Overdrive run, so they get a remaining-time arc and a HUD row. Mend happens, so it gets the
 * moment and nothing else — there is nothing left to display once it is over, and the result
 * is already in the life segments under the player.
 *
 * The arc itself is no longer drawn here: it moved to `timeArc.js` when a marker's remaining
 * lifetime started using the same motif. Three arcs that look alike because they are one function
 * is a different thing from three that happen to agree.
 *
 * Purely presentational, like `trailLayer.js`. Nothing here decides anything.
 */

import { mendArcAlpha, mendArcSweep, MEND_ARC_SECONDS } from './mendPulse.js';
import {
  AEGIS_COLOR,
  hexPath,
  MEND_COLOR,
  OVERDRIVE_COLOR,
  STROKE_WIDTH,
} from './powerupMarkerLayer.js';
import { drawTimeArc } from './timeArc.js';

/** Shell radius, clear of the player's own 16 px body and its glow. */
const SHELL_RADIUS = 30;

/** Aegis inside, Overdrive outside, so both buffs can run at once and stay apart. */
const AEGIS_ARC_RADIUS = 36;
const OVERDRIVE_ARC_RADIUS = 42;

/**
 * Mend's arc sits inside both of those. It is over long before either could clash with it, and
 * being the innermost of the three is one more thing separating it from a countdown.
 */
const MEND_ARC_RADIUS = 34;
const MEND_ARC_WIDTH = 2.5;
const MEND_ARC_GLOW = 10;

const SHELL_SPIN_TURNS_PER_SECOND = 0.5;
const SHELL_GLOW_BLUR = 9;

const SHATTER_SECONDS = 0.35;
const SHARD_COUNT = 6;
/** How far the shards drift and how long they start out, in world units. */
const SHARD_DRIFT = 30;
const SHARD_HALF_LENGTH = 9;
/** The white flash grows past the shell it came from. */
const SHATTER_FLASH_COLOR = '#FFFFFF';
const SHATTER_FLASH_GROWTH = 26;
const SHATTER_FLASH_WIDTH = 1.5;

/**
 * Everything that sits on the player: the Aegis shell, both time arcs, the shatter, and the
 * arc Mend runs once.
 *
 * Drawn after the player, because these lie on them rather than behind them — and before the
 * life segments, which may never be drawn over.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {{x: number, y: number}} playerPosition - Current player position.
 * @param {object} renderState - The loop's render state; `powerupBuffs`, `aegisShatterAge` and
 *   `mendArcAge` are read, and all three may be absent while the world is frozen.
 * @param {number} seconds - Wall-clock seconds, for spin and breathing.
 * @returns {void}
 */
export function drawPlayerBuffs(ctx, playerPosition, renderState, seconds) {
  if (!playerPosition) return;

  const buffs = renderState.powerupBuffs ?? {};

  if (buffs.aegis !== undefined) {
    drawAegisShell(ctx, playerPosition.x, playerPosition.y, seconds, buffs.aegis);
  }

  if (buffs.overdrive !== undefined) {
    drawOverdriveRing(ctx, playerPosition.x, playerPosition.y, buffs.overdrive, seconds);
  }

  if (renderState.aegisShatterAge !== undefined) {
    drawAegisShatter(ctx, playerPosition.x, playerPosition.y, renderState.aegisShatterAge);
  }

  // Deliberately last of the four: it is the newest thing to have happened, and for its 450 ms
  // it is the one the player is meant to read.
  if (renderState.mendArcAge !== undefined) {
    drawMendArc(ctx, playerPosition.x, playerPosition.y, renderState.mendArcAge);
  }
}

/**
 * The Aegis shell on the player: the marker's own hexagon, now around you. The pickup
 * animating onto the player is the entire explanation the effect needs — no icon, no text.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {number} x - Player position.
 * @param {number} y - Player position.
 * @param {number} seconds - Wall-clock seconds, for spin and breathing.
 * @param {number} remaining - Fraction of the buff left, `1`..`0`.
 * @returns {void}
 */
export function drawAegisShell(ctx, x, y, seconds, remaining) {
  ctx.save();
  ctx.strokeStyle = AEGIS_COLOR;
  ctx.lineWidth = STROKE_WIDTH;
  ctx.shadowColor = AEGIS_COLOR;
  ctx.shadowBlur = SHELL_GLOW_BLUR;
  ctx.globalAlpha = 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(seconds * 3));
  hexPath(ctx, x, y, SHELL_RADIUS, seconds * SHELL_SPIN_TURNS_PER_SECOND * Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  drawTimeArc(ctx, x, y, AEGIS_ARC_RADIUS, remaining, AEGIS_COLOR, seconds);
}

/**
 * The Overdrive ring. There is no shell and no new effect: Overdrive shows itself through the
 * Ion Streak trail (`trailLayer.js`) running continuously instead of only during a dash.
 * Speed already has a language in this game — Overdrive just switches it on.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {number} x - Player position.
 * @param {number} y - Player position.
 * @param {number} remaining - Fraction of the buff left, `1`..`0`.
 * @param {number} seconds - Wall-clock seconds, for the arc's blink.
 * @returns {void}
 */
export function drawOverdriveRing(ctx, x, y, remaining, seconds) {
  drawTimeArc(ctx, x, y, OVERDRIVE_ARC_RADIUS, remaining, OVERDRIVE_COLOR, seconds);
}

/**
 * Mend's one-off arc around the player: a life was just given back.
 *
 * It runs **counter-clockwise and fills**, where every remaining-time arc in the game drains
 * clockwise. That inversion is the whole message — something was added, not something is
 * running out — and it is the reason the two cannot be confused despite being the same 2 px
 * stroke around the same player. Anyone who does confuse them has lost the direction, not the
 * colour, so that is where to start.
 *
 * It is also all the feedback Mend gets on the player: an event has nothing left to show once
 * it is over, so the moment itself has to carry it.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {number} x - Player position.
 * @param {number} y - Player position.
 * @param {number} age - Seconds since the heal; past `MEND_ARC_SECONDS` nothing is drawn.
 * @returns {void}
 */
export function drawMendArc(ctx, x, y, age) {
  if (age < 0 || age > MEND_ARC_SECONDS) return;

  ctx.save();
  ctx.globalAlpha = mendArcAlpha(age);
  ctx.strokeStyle = MEND_COLOR;
  ctx.lineWidth = MEND_ARC_WIDTH;
  ctx.lineCap = 'round';
  ctx.shadowColor = MEND_COLOR;
  ctx.shadowBlur = MEND_ARC_GLOW;
  ctx.beginPath();
  ctx.arc(x, y, MEND_ARC_RADIUS, -Math.PI / 2, -Math.PI / 2 - mendArcSweep(age), true);
  ctx.stroke();
  ctx.restore();
}

/**
 * The shield giving its life for you: a white flash, then the hexagon breaking into six shards
 * that drift outward. It has to look expensive, or nobody notices the shield is spent and the
 * next hit comes as a surprise.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {number} x - Where the hit landed.
 * @param {number} y - Where the hit landed.
 * @param {number} age - Seconds since the absorb; past `SHATTER_SECONDS` nothing is drawn.
 * @returns {void}
 */
export function drawAegisShatter(ctx, x, y, age) {
  if (age < 0 || age > SHATTER_SECONDS) return;

  const progress = age / SHATTER_SECONDS;

  ctx.save();
  ctx.globalAlpha = 1 - progress;
  ctx.strokeStyle = AEGIS_COLOR;
  ctx.lineWidth = STROKE_WIDTH;
  ctx.lineCap = 'round';

  for (let shard = 0; shard < SHARD_COUNT; shard += 1) {
    const angle = (shard / SHARD_COUNT) * Math.PI * 2 + 0.5;
    const distance = SHELL_RADIUS + progress * SHARD_DRIFT;
    const centreX = x + Math.cos(angle) * distance;
    const centreY = y + Math.sin(angle) * distance;
    // Each shard is a piece of the shell, so it lies across the radius rather than along it.
    const halfX = -Math.sin(angle) * SHARD_HALF_LENGTH * (1 - progress);
    const halfY = Math.cos(angle) * SHARD_HALF_LENGTH * (1 - progress);

    ctx.beginPath();
    ctx.moveTo(centreX - halfX, centreY - halfY);
    ctx.lineTo(centreX + halfX, centreY + halfY);
    ctx.stroke();
  }

  ctx.globalAlpha = (1 - progress) * 0.9;
  ctx.strokeStyle = SHATTER_FLASH_COLOR;
  ctx.lineWidth = SHATTER_FLASH_WIDTH;
  hexPath(ctx, x, y, SHELL_RADIUS + progress * SHATTER_FLASH_GROWTH, 0.5);
  ctx.stroke();
  ctx.restore();
}
