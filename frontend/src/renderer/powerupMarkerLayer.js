/**
 * Everything a power-up looks like while it is still lying in the arena: the hexagonal marker,
 * its glyph, and the ring left behind where one was picked up.
 *
 * The hexagon is the fourth and last shape in the game (`docs/design_system/design-system.md`
 * §11: triangle boid, circle player, capsule obstacle, hexagon pickup), and this file owns that
 * vocabulary — the colours, the outline and `hexPath` itself. `powerupLayer.js`, which draws
 * what sits on the *player*, borrows them from here, because the shell around the player is
 * literally the marker's own hexagon moved onto them.
 *
 * Split off `powerupLayer.js` when Mend arrived and that file reached the 400-line limit. The
 * seam is the one the design document is already organised along: what lies on the ground and
 * what rides on the player.
 *
 * Purely presentational, like `trailLayer.js`. Spawning, collection and the actual effects are
 * gameplay and live in `powerups/powerups.js`; nothing in this file decides anything.
 */

import { launchRingAlpha, launchRingRadius, LAUNCH_RING_SECONDS } from './dashTrail.js';
import { towardInert } from './mendPulse.js';

/**
 * Marker radius. Smaller than an obstacle, larger than a boid — reads as an item.
 *
 * Half again the 18 px it started at, because a pickup that is hard to hit is a pickup
 * that gets ignored. `COLLECT_RADIUS` in `powerups/powerups.js` was raised by the same
 * factor: the collect distance has to stay the *visibly* generous one, or a graze that
 * looks like a hit stops being one.
 */
export const PICKUP_RADIUS = 27;

/**
 * Amber is already the game's colour for a temporary state change, cyan the colour of the
 * player and their skill, green the colour of life. All three are values `styles/tokens.css`
 * carries — as `--warning`, `--player` and `--life`; a canvas cannot read a CSS custom
 * property, which is the same duplication the arena colours live with.
 *
 * Green is not *widened* by Mend, it is used: §1 gives green to life, and Mend gives life
 * back. Which is also why Mend needs no colour of its own.
 */
export const AEGIS_COLOR = '#FBBF24';
export const OVERDRIVE_COLOR = '#38BDF8';
export const MEND_COLOR = '#22C55E';

/** Stroke width shared by every power-up outline, so the whole set reads as one motif. */
export const STROKE_WIDTH = 2;

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
const MEND_GLYPH_BAR_WIDTH_SHARE = 0.72;
const MEND_GLYPH_BAR_HEIGHT_SHARE = 0.15;
const MEND_GLYPH_GAP_SHARE = 0.17;

/**
 * The topmost bar of the meter glyph is only hinted at — that gap is the whole icon. It dims
 * along with the rest when the marker goes inert but never disappears: a glyph that loses a bar
 * has become a different glyph, and the icon is supposed to be the same one going quiet.
 */
const MEND_GLYPH_HINT_ALPHA = 0.3;
const MEND_GLYPH_HINT_INERT_DROP = 0.15;

/** How much opacity an inert marker gives up. It fades; it does not disappear. */
const INERT_ALPHA_DROP = 0.35;

/**
 * Colour of a power-up kind.
 * @param {'aegis'|'mend'|'overdrive'} kind - Which power-up.
 * @returns {string} Hex colour.
 */
export function powerupColor(kind) {
  if (kind === 'aegis') return AEGIS_COLOR;
  if (kind === 'mend') return MEND_COLOR;

  return OVERDRIVE_COLOR;
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
    drawPowerupMarker(
      ctx,
      marker.kind,
      marker.x,
      marker.y,
      seconds,
      marker.spawnScale,
      marker.inert,
    );
  }

  for (const pop of renderState.powerupCollects ?? []) {
    drawCollectRing(ctx, pop.x, pop.y, pop.age, pop.kind);
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
 * @param {'aegis'|'mend'|'overdrive'} kind - Which power-up.
 * @param {number} x - World position.
 * @param {number} y - World position.
 * @param {number} seconds - Wall-clock seconds, for spin and bob.
 * @param {number} [scale] - `0`..`1` spawn-in scale.
 * @param {number} [inert] - `0`..`1`, a Mend marker at full lives. It drains to slate, stops
 *   turning and stops glowing, but keeps bobbing — it is still an object lying there.
 * @returns {void}
 */
export function drawPowerupMarker(ctx, kind, x, y, seconds, scale = 1, inert = 0) {
  if (scale <= 0) return;

  const color = inert > 0 ? towardInert(powerupColor(kind), inert) : powerupColor(kind);
  const radius = PICKUP_RADIUS * scale;
  const bobY = y + Math.sin((seconds * Math.PI * 2) / BOB_SECONDS) * BOB_AMPLITUDE;
  // Rotation and glow are what say "this is worth something", so an inert marker gives up
  // both. It still bobs, because it is still there.
  const liveness = 1 - inert;
  const rotation = seconds * SPIN_TURNS_PER_SECOND * Math.PI * 2 * liveness;
  const breathe = 0.5 + 0.5 * Math.sin((seconds * Math.PI * 2) / BREATHE_SECONDS);

  ctx.save();
  ctx.fillStyle = MARKER_CORE_COLOR;
  hexPath(ctx, x, bobY, radius, rotation);
  ctx.fill();

  ctx.shadowColor = color;
  ctx.shadowBlur = (MARKER_GLOW_BASE + breathe * MARKER_GLOW_BREATH) * liveness;
  ctx.strokeStyle = color;
  ctx.lineWidth = STROKE_WIDTH;
  ctx.globalAlpha = 1 - inert * INERT_ALPHA_DROP;
  hexPath(ctx, x, bobY, radius, rotation);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = STROKE_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (kind === 'aegis') {
    // A shell around a core — the same thing the buff does, at glyph size.
    hexPath(ctx, x, bobY, radius * AEGIS_GLYPH_SHELL_SHARE, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, bobY, radius * AEGIS_GLYPH_CORE_SHARE, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'mend') {
    drawMeterGlyph(ctx, x, bobY, radius, inert);
  } else {
    // Hollow on purpose: the player is and stays the only filled cyan surface in the game.
    drawChevrons(ctx, x, bobY, radius * OVERDRIVE_GLYPH_SHARE);
  }

  ctx.restore();
}

/**
 * The life meter itself, its top bar only hinted at. The gap *is* the icon — a heart or a
 * cross would be a second symbol for something the game already has one for, and the player
 * has been reading those three segments under their own feet since the first round.
 */
function drawMeterGlyph(ctx, x, y, radius, inert) {
  const barWidth = radius * MEND_GLYPH_BAR_WIDTH_SHARE;
  const barHeight = radius * MEND_GLYPH_BAR_HEIGHT_SHARE;
  const gap = radius * MEND_GLYPH_GAP_SHARE;
  const topY = y - barHeight * 1.5 - gap;

  for (let bar = 0; bar < 3; bar += 1) {
    const hinted = bar === 0;
    ctx.globalAlpha = hinted
      ? MEND_GLYPH_HINT_ALPHA - inert * MEND_GLYPH_HINT_INERT_DROP
      : 1 - inert * INERT_ALPHA_DROP;
    ctx.fillRect(x - barWidth / 2, topY + bar * (barHeight + gap), barWidth, barHeight);
  }

  ctx.globalAlpha = 1;
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
 * The collection pop: the dash launch ring again, in the power-up's colour. Reusing the same
 * two functions keeps "something just happened at this spot" a single visual idea instead of
 * two that drift apart, and it is why `powerups.js` remembers a pickup for exactly
 * `LAUNCH_RING_SECONDS`.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {number} x - Where it was collected.
 * @param {number} y - Where it was collected.
 * @param {number} age - Seconds since collection.
 * @param {'aegis'|'mend'|'overdrive'} kind - Which power-up.
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
