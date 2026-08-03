// Pure arithmetic for fading a temporary obstacle in and out, split from the drawing
// code for the same reason `dashPulse.js` is: it is the part with an answer worth
// asserting on, and it can be tested without a canvas.
//
// The only input is the render phase the engine packs into the obstacle buffer, one
// signed number carrying the whole life cycle in the same way a boid's dash phase does:
//
//   -1 .. 0  the obstacle is materialising, and is *not solid yet* — the engine lets
//            the player and the flock pass straight through it. -1 is the step it
//            appeared, climbing towards 0 as the window closes.
//    0 ..  1 the remaining life of a solid obstacle, counting down to 0.
//
// That the fade-in is driven by the engine's window rather than by a share of the
// lifetime chosen here is the point: what the player sees appearing is exactly what
// cannot hurt them yet. A number picked on this side could disagree with the engine's,
// and an obstacle would go solid before it looks it.

/**
 * How solidly an obstacle should be drawn, from the render phase the engine reports.
 *
 * Ramps up over the materialising window and back down over the last slice of the
 * lifetime, so an obstacle announces itself before it can be collided with and warns
 * before it goes instead of vanishing between two frames. Flat at 1 in between.
 * @param {number} renderPhase - Signed life-cycle phase, negative while materialising.
 * @param {number} fadeShare - Share of the lifetime spent fading out at the end.
 * @returns {number} Opacity factor between 0 and 1.
 */
export function obstacleFadeLevel(renderPhase, fadeShare) {
  if (!Number.isFinite(renderPhase) || renderPhase === 0) {
    return 0;
  }

  // Still materialising: the window itself is the fade, so nothing else is consulted.
  if (renderPhase < 0) {
    return clampToOpacity(1 + renderPhase);
  }

  if (!Number.isFinite(fadeShare) || fadeShare <= 0) {
    return 1;
  }

  return clampToOpacity(renderPhase / fadeShare);
}

/** Keeps a computed level inside the range every colour table is built for. */
function clampToOpacity(level) {
  return Math.max(0, Math.min(1, level));
}
