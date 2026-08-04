/**
 * Mend's import-free arithmetic, split out for the same reason `dashPulse.js` and
 * `spawnMarkerPulse.js` are: none of it touches a canvas, so all of it is testable under
 * Vitest while the layers that call it are not.
 *
 * Three numbers live here, and together they are the whole of Mend's presentation
 * (`docs/design_system/design-system.md` §11): the one-off arc that runs round the player, the
 * white flash on the segment that was just won back, and the drain to slate of a marker nobody
 * can currently use.
 *
 * Mend is an **event**, not a state — it has nothing left to show once it is over — so every
 * function here is a function of *age since the heal* and nothing else.
 */

/**
 * How long Mend's moment lasts. Long enough to land in the eye, short enough not to be read
 * as one of the remaining-time arcs; the arc and the segment flash share it, because they are
 * two halves of one event rather than two events.
 */
export const MEND_ARC_SECONDS = 0.45;

/** The slate an inert marker drains toward — `design-system.md` §1's "worth nothing" signal. */
const INERT_COLOR = [148, 163, 184];

/** How many steps the blend toward slate is quantised into. See `towardInert`. */
const INERT_STEPS = 6;

/** Peak opacity of the arc. Just short of solid, so it reads as light rather than as a ring. */
const ARC_PEAK_ALPHA = 0.95;

/**
 * How far through its 450 ms the moment is.
 * @param {number} age - Seconds since the heal.
 * @returns {number} `0`..`1`, clamped at both ends.
 */
export function mendProgress(age) {
  return Math.min(1, Math.max(0, age / MEND_ARC_SECONDS));
}

/**
 * Opacity of the arc as it runs.
 *
 * Falls off with the square of the progress rather than linearly: the arc has to be brightest
 * while it is still *growing*, or the eye catches only its disappearance and misses that
 * something was added.
 * @param {number} age - Seconds since the heal.
 * @returns {number} Opacity, `0`..`ARC_PEAK_ALPHA`.
 */
export function mendArcAlpha(age) {
  const progress = mendProgress(age);

  return (1 - progress * progress) * ARC_PEAK_ALPHA;
}

/**
 * How much of the circle the arc has swept, in radians.
 *
 * The caller draws it **counter-clockwise**, where every remaining-time arc in the game drains
 * clockwise. That inversion is the entire message: something was added, not something is
 * running out.
 * @param {number} age - Seconds since the heal.
 * @returns {number} Radians, `0`..`2π`.
 */
export function mendArcSweep(age) {
  return mendProgress(age) * Math.PI * 2;
}

/**
 * How white the segment that was just won back is drawn.
 *
 * Full white on the step it arrives and settled into its ordinary green well before the arc
 * finishes — it flashes and sets, rather than pulsing. Squared, so the bright part is short
 * and the settle is the longer half.
 * @param {number} age - Seconds since the heal.
 * @returns {number} How far to blend the segment toward white, `1`..`0`.
 */
export function healFlashAlpha(age) {
  const remaining = 1 - mendProgress(age);

  return remaining * remaining;
}

const inertCache = new Map();

/**
 * Blends a live colour toward slate, for a Mend marker at full health.
 *
 * Cached and quantised into sixths, because an inert marker is redrawn on every frame and
 * building a colour string per frame is precisely what this renderer does not do. The cache
 * can therefore never hold more than a handful of entries.
 * @param {string} color - Hex colour, `#RRGGBB`.
 * @param {number} amount - `0` fully live … `1` fully inert.
 * @returns {string} A CSS `rgb()` colour.
 */
export function towardInert(color, amount) {
  const quantised = Math.round(Math.min(1, Math.max(0, amount)) * INERT_STEPS) / INERT_STEPS;
  const key = `${color}|${quantised}`;
  const cached = inertCache.get(key);

  if (cached !== undefined) {
    return cached;
  }

  const channels = [];
  for (let index = 0; index < 3; index += 1) {
    const from = parseInt(color.slice(1 + index * 2, 3 + index * 2), 16);
    channels.push(Math.round(from + (INERT_COLOR[index] - from) * quantised));
  }

  const blended = `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
  inertCache.set(key, blended);

  return blended;
}
