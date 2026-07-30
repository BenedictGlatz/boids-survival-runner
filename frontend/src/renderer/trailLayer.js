/**
 * Draws the dash trails held in `dashTrailHistory.js`, shaped by the arithmetic in
 * `dashTrail.js` — the "Ion Streak" of
 * `docs/design_system/dash_animation/design-system.md` §8.
 *
 * Runs *after* the obstacles and *before* the boids and the player, so a trail sits behind
 * the object it belongs to: it is exhaust, not a thing in the arena.
 *
 * No colour string is ever built here. Opacity comes from `globalAlpha` and the colour is
 * one of the fixed strings the caller passes in — the same rule the glow table in
 * `entityPalette.js` follows.
 */

import { BOID_VISUAL_LENGTH, PLAYER_VISUAL_RADIUS } from '../gameConfig.js';
import {
  coreAlpha,
  coreHalfWidth,
  launchRingAlpha,
  launchRingRadius,
  MAX_TRAILS,
  PLAYER_TRAIL_TIER,
  ribbonAlpha,
  ribbonHalfWidth,
} from './dashTrail.js';

/**
 * Half width at the object: the player's radius and a boid's half length, so the band leaves
 * the object exactly as wide as the object is and derives from its size instead of repeating it.
 */
const PLAYER_RIBBON_HALF = PLAYER_VISUAL_RADIUS;
const BOID_RIBBON_HALF = BOID_VISUAL_LENGTH * 0.5;

/** The core is white for both owners — colour is carried by the body of the ribbon. */
const CORE_COLOR = '#FFFFFF';

/** How many of the newest samples the core runs over. Beyond that it is invisible anyway. */
const CORE_SAMPLES = 11;

const LAUNCH_RING_WIDTH = 2;

/**
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {import('./dashTrailHistory.js').DashTrails} trails - The history to draw.
 * @param {(tier: number) => string} colorForTier - Owner colour; `tier` is
 *   `PLAYER_TRAIL_TIER` for the player and a difficulty tier for a boid.
 * @returns {void}
 */
export function drawDashTrails(ctx, trails, colorForTier) {
  ctx.save();

  for (let slot = 0; slot < MAX_TRAILS; slot += 1) {
    const count = trails.count(slot);
    if (count === 0) continue;

    const tier = trails.tier(slot);
    const color = colorForTier(tier);
    const baseHalf = tier === PLAYER_TRAIL_TIER ? PLAYER_RIBBON_HALF : BOID_RIBBON_HALF;

    if (count > 1) {
      const strength = strongestSample(trails, slot, count);
      drawRibbon(ctx, trails, slot, count, color, baseHalf, strength, 0);
      drawRibbon(ctx, trails, slot, count, CORE_COLOR, baseHalf, strength, 1);
    }

    drawLaunchRing(ctx, trails, slot, color);
  }

  ctx.restore();
}

/**
 * One tapered band along the sample history.
 *
 * The quad per segment is built from the segment's own direction rather than from the stored
 * heading: two samples one frame apart give the direction the object actually travelled,
 * which is what the band has to follow through a curve.
 *
 * `pass` picks the geometry — `0` the coloured body, `1` the white core. One function for
 * both, because the only difference between them is the width and the falloff.
 */
function drawRibbon(ctx, trails, slot, count, color, baseHalf, strength, pass) {
  const samples = trails.samples;
  const last = count - 1;
  const first = pass === 1 ? Math.max(0, count - CORE_SAMPLES) : 0;

  ctx.fillStyle = color;

  for (let ordinal = first; ordinal < last; ordinal += 1) {
    const olderOffset = trails.offsetOf(slot, ordinal);
    const newerOffset = trails.offsetOf(slot, ordinal + 1);
    const olderX = samples[olderOffset];
    const olderY = samples[olderOffset + 1];
    const newerX = samples[newerOffset];
    const newerY = samples[newerOffset + 1];
    const deltaX = newerX - olderX;
    const deltaY = newerY - olderY;
    const length = Math.hypot(deltaX, deltaY);

    // Two samples in the same spot have no direction to be perpendicular to, and no area
    // to fill either.
    if (length < 0.01) continue;

    const normalX = -deltaY / length;
    const normalY = deltaX / length;
    const olderAge = ordinal / last;
    const newerAge = (ordinal + 1) / last;
    const olderHalf =
      pass === 1
        ? coreHalfWidth(baseHalf, olderAge, strength)
        : ribbonHalfWidth(baseHalf, olderAge, strength);
    const newerHalf =
      pass === 1
        ? coreHalfWidth(baseHalf, newerAge, strength)
        : ribbonHalfWidth(baseHalf, newerAge, strength);

    ctx.globalAlpha = pass === 1 ? coreAlpha(newerAge, strength) : ribbonAlpha(newerAge, strength);
    ctx.beginPath();
    ctx.moveTo(olderX + normalX * olderHalf, olderY + normalY * olderHalf);
    ctx.lineTo(newerX + normalX * newerHalf, newerY + normalY * newerHalf);
    ctx.lineTo(newerX - normalX * newerHalf, newerY - normalY * newerHalf);
    ctx.lineTo(olderX - normalX * olderHalf, olderY - normalY * olderHalf);
    ctx.closePath();
    ctx.fill();
  }
}

function drawLaunchRing(ctx, trails, slot, color) {
  const age = trails.ringAge(slot);
  if (age < 0) return;

  ctx.globalAlpha = launchRingAlpha(age);
  ctx.strokeStyle = color;
  ctx.lineWidth = LAUNCH_RING_WIDTH;
  ctx.beginPath();
  ctx.arc(trails.ringX(slot), trails.ringY(slot), launchRingRadius(age), 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * One strength for the whole band: the strongest sample still in it.
 *
 * Per-sample strength would taper the band twice — once by age, once by the impulse decaying
 * — and a doubly tapered band is thin everywhere instead of thin at the tail.
 */
function strongestSample(trails, slot, count) {
  const samples = trails.samples;
  let strongest = 0;

  for (let ordinal = 0; ordinal < count; ordinal += 1) {
    const strength = samples[trails.offsetOf(slot, ordinal) + 4];
    if (strength > strongest) strongest = strength;
  }

  return strongest;
}
