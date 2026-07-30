// Pure arithmetic for fading a temporary obstacle in and out, split from the drawing
// code for the same reason `dashPulse.js` is: it is the part with an answer worth
// asserting on, and it can be tested without a canvas.
//
// The only input is the life fraction the engine packs into the obstacle buffer: 1.0
// the moment an obstacle appears, counting down to 0.0 as it expires.

/**
 * How solidly an obstacle should be drawn, from its remaining life.
 *
 * Ramps up over the first slice of its life and back down over the last, so an
 * obstacle announces itself before it can be collided with and warns before it goes
 * instead of vanishing between two frames. Flat at 1 in between.
 * @param {number} lifeFraction - Remaining life, 1 when new and 0 when expired.
 * @param {number} fadeShare - Share of the lifetime spent fading at each end.
 * @returns {number} Opacity factor between 0 and 1.
 */
export function obstacleFadeLevel(lifeFraction, fadeShare) {
  if (!Number.isFinite(lifeFraction) || lifeFraction <= 0) {
    return 0;
  }

  if (!Number.isFinite(fadeShare) || fadeShare <= 0) {
    return 1;
  }

  const clampedLife = Math.min(lifeFraction, 1);
  // How far into its life the obstacle is, counting up rather than down.
  const elapsedShare = 1 - clampedLife;

  const fadingIn = elapsedShare / fadeShare;
  const fadingOut = clampedLife / fadeShare;

  // Whichever end is closer decides, so the two ramps cannot both apply and a
  // lifetime shorter than two fades simply never reaches full opacity.
  return Math.max(0, Math.min(1, fadingIn, fadingOut));
}
