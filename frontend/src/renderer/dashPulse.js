/**
 * Turns the engine's dash phase into the three numbers the renderer needs to warn
 * the player: how much bigger a boid is drawn, how much brighter, and how strongly the
 * line that says where it is about to lunge is drawn.
 *
 * Pure functions, no canvas and no config imports, so the pulse behaviour can be
 * unit tested without a browser or a built WebAssembly package.
 *
 * The engine sends one dash phase per boid (see `FrameResponse::dash_phases`):
 *   `0`            nothing to draw
 *   `0 < p < 1`    charging up; how far through the charge the boid is
 *   `-1 <= p < 0`  dashing; how much of the dash is left
 */

/** How many full pulses a boid goes through over its whole charge-up. */
const PULSE_CYCLES = 5;

/** How much larger a boid grows at the peak of the strongest pulse. */
const MAX_PULSE_GROWTH = 0.55;

/** How much larger a boid is drawn while it is actually dashing. */
const DASH_GROWTH = 0.3;

/** Brightness of a dashing boid, on the same 0..1 scale as the pulse. */
const DASH_GLOW_LEVEL = 1;

/**
 * Opacity the warning line starts at, as a share of its full strength.
 *
 * A floor rather than a fade from nothing, for the same reason a spawn marker has one: a
 * line that ramped up from zero would be invisible through the first half of exactly the
 * window it exists to fill, and that window is only 0.57–0.73 s long to begin with.
 */
const AIM_MINIMUM_ALPHA = 0.25;

/**
 * Scale factor for the boid silhouette. `1` is the normal size.
 *
 * The pulse gets both stronger and faster as the launch approaches, so a boid
 * that is about to lunge is the most eye-catching thing on screen.
 * @param {number} dashPhase - `0` when idle, `0 < p < 1` while charging up,
 *   `-1 <= p < 0` while dashing.
 * @returns {number} Multiplier applied to the boid's normal size.
 */
export function dashPulseScale(dashPhase) {
  if (dashPhase < 0) {
    return 1 + DASH_GROWTH;
  }

  if (dashPhase <= 0) {
    return 1;
  }

  return 1 + MAX_PULSE_GROWTH * dashPhase * pulseWave(dashPhase);
}

/**
 * How far the boid's colour is pushed toward white, from `0` (normal colour) to
 * `1` (brightest).
 * @param {number} dashPhase - `0` when idle, `0 < p < 1` while charging up,
 *   `-1 <= p < 0` while dashing.
 * @returns {number} Blend factor between `0` and `1`.
 */
export function dashGlowLevel(dashPhase) {
  if (dashPhase < 0) {
    return DASH_GLOW_LEVEL;
  }

  if (dashPhase <= 0) {
    return 0;
  }

  return dashPhase * pulseWave(dashPhase);
}

/**
 * How strongly the dash warning line in front of a charging boid is drawn.
 *
 * Rises steadily with the charge-up rather than pulsing along with it: the boid itself
 * already beats, and a line beating beside it would be a second animation competing for the
 * same glance instead of a second piece of information. The line says *where*, the pulse
 * says *when*.
 *
 * Only a charging boid has a line. A boid that has launched is no longer announcing a dash
 * — it is flying it — so a negative phase returns `0`. The engine already leaves those out
 * of the aim buffer entirely; this is the same statement made where the drawing happens.
 * @param {number} chargeProgress - The engine's charge progress, `0 < p < 1`.
 * @returns {number} Opacity between `AIM_MINIMUM_ALPHA` and `1`; `0` when there is no line.
 */
export function dashAimAlpha(chargeProgress) {
  if (!Number.isFinite(chargeProgress) || chargeProgress <= 0) {
    return 0;
  }

  const progress = Math.min(1, chargeProgress);

  return AIM_MINIMUM_ALPHA + (1 - AIM_MINIMUM_ALPHA) * progress;
}

/**
 * The pulse itself, as a value between `0` and `1`.
 *
 * Squaring the progress inside the sine is what makes the pulse speed up: early
 * in the charge-up the argument grows slowly, near the end it grows fast. That
 * removes the need for a wall clock — the phase alone drives the animation, so
 * the pulse stays in step with the simulation.
 */
function pulseWave(progress) {
  const angle = PULSE_CYCLES * 2 * Math.PI * progress * progress;

  return 0.5 - 0.5 * Math.cos(angle);
}
