/**
 * Draws the two power-ups — the hexagon vocabulary of `docs/design_system/design-system.md`
 * §11, where the hexagon is the fourth and last shape in the game: triangle boid, circle
 * player, capsule obstacle, hexagon pickup.
 *
 * Three things live here: the marker lying in the arena, the shell and time arcs that sit on
 * the player while a buff runs, and the shatter the shield leaves behind when it eats a hit.
 *
 * Purely presentational, like `trailLayer.js`. Spawning, collection and the actual effects are
 * gameplay and live in `powerups/powerups.js`; nothing in this file decides anything, it is
 * handed a render state and draws it.
 */

import { launchRingAlpha, launchRingRadius, LAUNCH_RING_SECONDS } from './dashTrail.js';

/** Marker radius. Smaller than an obstacle, larger than a boid — reads as an item. */
export const PICKUP_RADIUS = 18;

/**
 * Amber is already the game's colour for a temporary state change, cyan the colour of the
 * player and their skill. Both are the values `styles/tokens.css` carries as `--warning` and
 * `--player`; a canvas cannot read a CSS custom property, which is the same duplication the
 * arena colours live with.
 */
export const AEGIS_COLOR = '#FBBF24';
export const OVERDRIVE_COLOR = '#38BDF8';

/** Shell radius, clear of the player's own 16 px body and its glow. */
const SHELL_RADIUS = 30;

/** Aegis inside, Overdrive outside, so both buffs can run at once and stay apart. */
const AEGIS_ARC_RADIUS = 36;
const OVERDRIVE_ARC_RADIUS = 42;

/** Stroke width shared by every outline here, so the whole set reads as one motif. */
const STROKE_WIDTH = 2;

const BOB_AMPLITUDE = 3;
const BOB_SECONDS = 2.2;
const SPIN_TURNS_PER_SECOND = 0.25;
const BREATHE_SECONDS = 1.6;

/** Opaque core, or the arena grid runs straight through the glyph and it stops reading. */
const MARKER_CORE_COLOR = 'rgba(11, 13, 18, 0.85)';
const MARKER_GLOW_BASE = 12;
const MARKER_GLOW_BREATH = 10;

/** Glyph sizes as fractions of the marker radius. */
const AEGIS_GLYPH_SHELL_SHARE = 0.46;
const AEGIS_GLYPH_CORE_SHARE = 0.13;
const OVERDRIVE_GLYPH_SHARE = 0.3;

/** Below this fraction the time arc blinks — the only warning a buff is about to end. */
const ARC_BLINK_BELOW = 0.17;
const ARC_BLINK_HZ = 4;
const ARC_ALPHA = 0.9;
const ARC_BLINK_ALPHA = 0.14;

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
 * Colour of a power-up kind.
 * @param {'aegis'|'overdrive'} kind - Which power-up.
 * @returns {string} Hex colour.
 */
export function powerupColor(kind) {
  return kind === 'aegis' ? AEGIS_COLOR : OVERDRIVE_COLOR;
}

/**
 * Traces a hexagon. Never fills or strokes itself — the caller decides, usually doing both.
 * @param {CanvasRenderingContext2D} ctx - Canvas context.
 * @param {number} x - Centre.
 * @param {number} y - Centre.
 * @param {number} radius - Centre to vertex.
 * @param {number} rotation - Radians.
 * @returns {void}
 */
export function hexPath(ctx, x, y, radius, rotation) {
  ctx.beginPath();

  for (let corner = 0; corner < 6; corner += 1) {
    const angle = rotation + (corner / 6) * Math.PI * 2;
    const pointX = x + Math.cos(angle) * radius;
    const pointY = y + Math.sin(angle) * radius;

    if (corner === 0) {
      ctx.moveTo(pointX, pointY);
    } else {
      ctx.lineTo(pointX, pointY);
    }
  }

  ctx.closePath();
}

/**
 * Everything that lies on the ground: the markers and the rings left where one was picked up.
 *
 * Drawn over the obstacles and under the dash trail, because a marker is terrain the player
 * moves over rather than something in front of them.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {object} renderState - The loop's render state; `powerupMarkers` and `powerupCollects`
 *   are read, and both may be absent while the world is frozen.
 * @param {number} seconds - Wall-clock seconds, for spin and bob.
 * @returns {void}
 */
export function drawPowerupMarkers(ctx, renderState, seconds) {
  for (const marker of renderState.powerupMarkers ?? []) {
    drawPowerupMarker(ctx, marker.kind, marker.x, marker.y, seconds, marker.spawnScale);
  }

  for (const pop of renderState.powerupCollects ?? []) {
    drawCollectRing(ctx, pop.x, pop.y, pop.age, pop.kind);
  }
}

/**
 * Everything that sits on the player: the Aegis shell, both time arcs, and the shatter.
 *
 * Drawn after the player, because these lie on them rather than behind them.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {{x: number, y: number}} playerPosition - Current player position.
 * @param {object} renderState - The loop's render state; `powerupBuffs` and `aegisShatterAge`
 *   are read, and both may be absent while the world is frozen.
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
    drawOverdriveRing(ctx, playerPosition.x, playerPosition.y, buffs.overdrive);
  }

  if (renderState.aegisShatterAge !== undefined) {
    drawAegisShatter(ctx, playerPosition.x, playerPosition.y, renderState.aegisShatterAge);
  }
}

/**
 * One marker lying in the arena.
 *
 * The shell turns and the marker bobs, both off wall-clock time — this is the only rotating
 * thing in the arena, which is what makes a pickup findable in a field of 90 boids without
 * being brighter than anything else. The pick-up distance is deliberately larger than what is
 * drawn here; `powerups.js` owns that number and this file never asks for it.
 *
 * The glyph inside does **not** turn with the shell: a rotating icon reads as debris.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {'aegis'|'overdrive'} kind - Which power-up.
 * @param {number} x - World position.
 * @param {number} y - World position.
 * @param {number} seconds - Wall-clock seconds, for spin and bob.
 * @param {number} [scale] - `0`..`1` spawn-in scale.
 * @returns {void}
 */
export function drawPowerupMarker(ctx, kind, x, y, seconds, scale = 1) {
  if (scale <= 0) return;

  const color = powerupColor(kind);
  const radius = PICKUP_RADIUS * scale;
  const bobY = y + Math.sin((seconds * Math.PI * 2) / BOB_SECONDS) * BOB_AMPLITUDE;
  const rotation = seconds * SPIN_TURNS_PER_SECOND * Math.PI * 2;
  const breathe = 0.5 + 0.5 * Math.sin((seconds * Math.PI * 2) / BREATHE_SECONDS);

  ctx.save();
  ctx.fillStyle = MARKER_CORE_COLOR;
  hexPath(ctx, x, bobY, radius, rotation);
  ctx.fill();

  ctx.shadowColor = color;
  ctx.shadowBlur = MARKER_GLOW_BASE + breathe * MARKER_GLOW_BREATH;
  ctx.strokeStyle = color;
  ctx.lineWidth = STROKE_WIDTH;
  hexPath(ctx, x, bobY, radius, rotation);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = STROKE_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (kind === 'aegis') {
    // A shell around a core — the same thing the buff does, at glyph size.
    hexPath(ctx, x, bobY, radius * AEGIS_GLYPH_SHELL_SHARE, 0);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, bobY, radius * AEGIS_GLYPH_CORE_SHARE, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Hollow on purpose: the player is and stays the only filled cyan surface in the game.
    drawChevrons(ctx, x, bobY, radius * OVERDRIVE_GLYPH_SHARE);
  }

  ctx.restore();
}

function drawChevrons(ctx, x, y, size) {
  for (const offset of [-size * 0.75, size * 0.55]) {
    ctx.beginPath();
    ctx.moveTo(x + offset - size * 0.4, y - size);
    ctx.lineTo(x + offset + size * 0.45, y);
    ctx.lineTo(x + offset - size * 0.4, y + size);
    ctx.stroke();
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

  drawTimeArc(ctx, x, y, AEGIS_ARC_RADIUS, remaining, AEGIS_COLOR);
}

/**
 * The Overdrive ring. There is no shell and no new effect: Overdrive shows itself through the
 * Ion Streak trail (`trailLayer.js`) running continuously instead of only during a dash.
 * Speed already has a language in this game — Overdrive just switches it on.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {number} x - Player position.
 * @param {number} y - Player position.
 * @param {number} remaining - Fraction of the buff left, `1`..`0`.
 * @returns {void}
 */
export function drawOverdriveRing(ctx, x, y, remaining) {
  drawTimeArc(ctx, x, y, OVERDRIVE_ARC_RADIUS, remaining, OVERDRIVE_COLOR);
}

/**
 * The remaining-time motif both buffs share: a 2 px arc draining clockwise from twelve.
 *
 * It sits on the player and not only in the HUD on purpose — in wave 5 nobody looks at the
 * edge of the screen. The HUD gets the buffs too, but as the second place to look.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {number} x - Centre.
 * @param {number} y - Centre.
 * @param {number} radius - Arc radius.
 * @param {number} remaining - Fraction left, `1`..`0`.
 * @param {string} color - Buff colour.
 * @returns {void}
 */
export function drawTimeArc(ctx, x, y, radius, remaining, color) {
  if (remaining <= 0) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = STROKE_WIDTH;
  ctx.lineCap = 'butt';

  // Blinks off the wall clock, not off `remaining`, so the rate is a steady 4 Hz whatever a
  // buff's total duration happens to be.
  const blinkPhase = Math.sin((performance.now() / 1000) * ARC_BLINK_HZ * Math.PI * 2);
  ctx.globalAlpha = remaining < ARC_BLINK_BELOW && blinkPhase < 0 ? ARC_BLINK_ALPHA : ARC_ALPHA;

  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.min(1, remaining) * Math.PI * 2);
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

/**
 * The collection pop: the dash launch ring again, in the power-up's colour. Reusing the same
 * two functions keeps "something just happened at this spot" a single visual idea instead of
 * two that drift apart, and it is why `powerups.js` remembers a pickup for exactly
 * `LAUNCH_RING_SECONDS`.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {number} x - Where it was collected.
 * @param {number} y - Where it was collected.
 * @param {number} age - Seconds since collection.
 * @param {'aegis'|'overdrive'} kind - Which power-up.
 * @returns {void}
 */
export function drawCollectRing(ctx, x, y, age, kind) {
  if (age < 0 || age > LAUNCH_RING_SECONDS) return;

  ctx.save();
  ctx.globalAlpha = launchRingAlpha(age);
  ctx.strokeStyle = powerupColor(kind);
  ctx.lineWidth = STROKE_WIDTH;
  ctx.beginPath();
  ctx.arc(x, y, launchRingRadius(age), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
