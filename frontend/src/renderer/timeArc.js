/**
 * The remaining-time motif: a thin arc that drains clockwise from twelve o'clock and blinks once
 * it is nearly empty. `docs/design_system/design-system.md` §11 calls it "ein Motiv für beide",
 * and it is now used in three places — the two buffs running on the player and the lifetime of a
 * marker still lying in the arena.
 *
 * It lives in a module of its own rather than in either layer because that is the only way the
 * three can be the *same* arc instead of three that agree today and drift apart later. A marker's
 * ring looking "just like" the player's is not a resemblance to be maintained by hand; it is one
 * function called from two files.
 *
 * The module is deliberately a **leaf**: `powerupLayer.js` already imports the hexagon vocabulary
 * from `powerupMarkerLayer.js`, so reaching back into either of them from here would close an
 * import cycle. That is what `TIME_ARC_WIDTH` below is about.
 *
 * The two pure functions follow `dashPulse.js`, `mendPulse.js` and `spawnMarkerPulse.js`: the
 * arithmetic is separated from the canvas so it is testable under Vitest. Which is also why the
 * blink takes its clock as a parameter — it used to read `performance.now()` from inside the draw
 * call, and a hidden global input is exactly what cannot be tested.
 */

/**
 * Stroke width of the arc.
 *
 * Deliberately the same 2 px as `STROKE_WIDTH` in `powerupMarkerLayer.js`, so every power-up line
 * in the game reads as one motif. It is restated here rather than imported to keep this module a
 * leaf — see the note above; one duplicated number is the cheaper of the two prices.
 */
export const TIME_ARC_WIDTH = 2;

/** Below this fraction the arc blinks — the only warning that something is about to end. */
const ARC_BLINK_BELOW = 0.17;
const ARC_BLINK_HZ = 4;
const ARC_ALPHA = 0.9;
const ARC_BLINK_ALPHA = 0.14;

/**
 * How much of the circle is still drawn, in radians.
 * @param {number} remaining - Fraction of the time left, `1`..`0`.
 * @returns {number} Radians, `0`..`2π`, clamped at both ends.
 */
export function timeArcSweep(remaining) {
  return Math.min(1, Math.max(0, remaining)) * Math.PI * 2;
}

/**
 * Opacity of the arc, which is where the blink lives.
 *
 * The blink runs off the wall clock rather than off `remaining`, so it is a steady 4 Hz whatever
 * the total duration happens to be — a buff of six seconds and a marker of twelve blink alike.
 * @param {number} remaining - Fraction of the time left, `1`..`0`.
 * @param {number} seconds - Wall-clock seconds. Passed in rather than read here, so the blink is
 *   testable and so a frozen frame (which hands over `0`) simply does not blink.
 * @returns {number} Opacity.
 */
export function timeArcAlpha(remaining, seconds) {
  if (remaining >= ARC_BLINK_BELOW) {
    return ARC_ALPHA;
  }

  // Off on the negative half of the sine, on for the positive one: half the period dark is what
  // makes a blink read as a blink rather than as a flicker.
  const blinkPhase = Math.sin(seconds * ARC_BLINK_HZ * Math.PI * 2);

  return blinkPhase < 0 ? ARC_BLINK_ALPHA : ARC_ALPHA;
}

/**
 * Draws the arc. Nothing here decides anything — the caller owns the fraction.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {number} x - Centre.
 * @param {number} y - Centre.
 * @param {number} radius - Arc radius.
 * @param {number} remaining - Fraction of the time left, `1`..`0`.
 * @param {string} color - Colour of whatever is running out.
 * @param {number} seconds - Wall-clock seconds, for the blink.
 * @returns {void}
 */
export function drawTimeArc(ctx, x, y, radius, remaining, color, seconds) {
  if (remaining <= 0) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = TIME_ARC_WIDTH;
  // A round cap would overshoot the twelve-o'clock origin the arc is measured from.
  ctx.lineCap = 'butt';
  ctx.globalAlpha = timeArcAlpha(remaining, seconds);

  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + timeArcSweep(remaining));
  ctx.stroke();
  ctx.restore();
}
