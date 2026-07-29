/**
 * Turns the engine's dash phase into the two numbers the renderer needs to warn
 * the player: how much bigger a boid is drawn, and how much brighter.
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
 * Scale factor for the boid silhouette. `1` is the normal size.
 *
 * The pulse gets both stronger and faster as the launch approaches, so a boid
 * that is about to lunge is the most eye-catching thing on screen.
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
