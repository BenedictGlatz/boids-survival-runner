/**
 * The tuning and the pure numbers that shape a dash trail — the "Ion Streak" of
 * `docs/design_system/dash_animation/design-system.md` §8.
 *
 * Two things live here and nothing else: the constants the trail is built from, and the
 * arithmetic that turns a sample's age into a width and an opacity. No canvas, so the shape of
 * the trail is unit-testable in Node exactly like `dashPulse.js` is. The history those numbers
 * are applied to is `dashTrailHistory.js`, which reads its sizes from here — the dependency
 * runs one way only, so the singleton it builds at load time cannot outrun these constants.
 *
 * There is deliberately **no** new field across the WASM boundary: a boid is dashing when
 * `dash_phases[i] < 0`, which the frame already carries, and the player's speed is known in
 * the frontend anyway.
 */

/** Samples kept per trail. At 60 fps this is ~0.37 s of history — about one dash. */
export const TRAIL_SAMPLES = 22;

/**
 * How many trails can be on screen at once: the player plus the engine's ceiling of concurrent
 * boid dashers, which is `MAX_CONCURRENT_DASHING_BOIDS + boidCount / BOIDS_PER_EXTRA_DASH_SLOT`
 * — eleven at 156 boids (see `docs/spec-s05-dash.md` §3). A dash that finds no free slot is
 * drawn without a trail rather than growing the buffer mid-frame, so a flock large enough to
 * unlock a twelfth dasher costs a ribbon and never a frame.
 */
export const MAX_TRAILS = 12;

/** Values per sample: `[x, y, headingX, headingY, strength]`. */
export const SAMPLE_STRIDE = 5;

/**
 * Distance between two consecutive samples that can only mean "this is not the same object
 * any more": a boid wrapping at the world edge, or indices being reassigned at wave start.
 * Without the check a trail would be drawn straight across the arena.
 *
 * Well above the largest honest step — a tier-4 dasher moves 18.7 px per simulation step,
 * and a catch-up frame runs at most `MAX_SIMULATION_STEPS_PER_FRAME` (5) of them.
 */
export const TRAIL_RESET_DISTANCE = 200;

/** Launch ring: the one-off pop at the moment the impulse is applied. */
export const LAUNCH_RING_SECONDS = 0.3;
export const LAUNCH_RING_START_RADIUS = 10;
export const LAUNCH_RING_END_RADIUS = 90;

/** `colors[slot]` for the player. Any other value is a boid's difficulty tier. */
export const PLAYER_TRAIL_TIER = -1;

/**
 * How much of a trail the current speed earns, from `0` (none) to `1` (full).
 *
 * The trail exists only above normal movement speed, so it ends by itself when the impulse
 * has bled off — there is no trail timer to keep in sync with the dash. The `0.6` keeps the
 * last, slowest bit of the ramp still faintly visible instead of cutting the tail off at a
 * hard threshold.
 * @param {number} speed - Current speed in px/s.
 * @param {number} baseSpeed - Normal top speed, `PLAYER_MAX_SPEED`.
 * @param {number} dashSpeed - Speed a dash starts at, `PLAYER_DASH_SPEED`.
 * @returns {number} Strength between `0` and `1`.
 */
export function trailStrength(speed, baseSpeed, dashSpeed) {
  if (dashSpeed <= baseSpeed) return 0;

  const raw = (speed - baseSpeed * 0.6) / (dashSpeed - baseSpeed);

  return Math.min(1, Math.max(0, raw));
}

/**
 * The same number for a boid, straight from the engine's dash phase.
 *
 * `dashPhase` counts the dash *down* (`-1` at launch toward `0`), so the trail is strongest
 * at the moment of the lunge and thins out as the boid runs out of impulse — which is what
 * the player needs to read: where the stab came from, not where it is petering out.
 * @param {number} dashPhase - The engine's `dash_phases[i]`.
 * @returns {number} Strength between `0` and `1`; `0` unless the boid is dashing.
 */
export function boidTrailStrength(dashPhase) {
  if (dashPhase >= 0) return 0;

  return Math.min(1, 0.35 + Math.abs(dashPhase));
}

/**
 * Half width of the ribbon at one sample.
 *
 * `ageFraction` is `0` at the oldest sample and `1` at the object, so the band is widest
 * where the object is and runs to a point behind it. The exponent below 1 keeps the taper
 * from looking like a triangle.
 *
 * `strength` is one value for the whole ribbon (the strongest sample in it), not the
 * individual sample's: tapering by age *and* by each sample's own strength at the same time
 * makes the band thin everywhere instead of thin at the tail.
 * @param {number} baseHalf - Half width at the object — the object's own radius.
 * @param {number} ageFraction - `0` oldest … `1` newest.
 * @param {number} strength - Strength of the whole ribbon, `0`..`1`.
 * @returns {number} Half width in world units.
 */
export function ribbonHalfWidth(baseHalf, ageFraction, strength) {
  return baseHalf * Math.pow(ageFraction, 0.8) * strength;
}

/**
 * Opacity of the ribbon at one sample. Never fully opaque — the trail is behind the boids
 * and must not read as a solid object of its own.
 * @param {number} ageFraction - `0` oldest … `1` newest.
 * @param {number} strength - Strength of the whole ribbon, `0`..`1`.
 * @returns {number} Alpha between `0` and `1`.
 */
export function ribbonAlpha(ageFraction, strength) {
  return 0.5 * ageFraction * strength;
}

/**
 * The white core, a second and much narrower ribbon inside the first. It falls off far
 * faster than the body (both exponents well above 1), so it stays a short bright streak
 * right behind the object.
 *
 * A stroked line was the obvious alternative and is wrong: a stroke keeps its width all the
 * way to the tail, which reads as a spear rather than as a trail.
 * @param {number} baseHalf - The ribbon's half width at the object.
 * @param {number} ageFraction - `0` oldest … `1` newest.
 * @param {number} strength - Strength of the whole ribbon, `0`..`1`.
 * @returns {number} Half width in world units.
 */
export function coreHalfWidth(baseHalf, ageFraction, strength) {
  return baseHalf * 0.34 * Math.pow(ageFraction, 2.2) * strength;
}

/**
 * Opacity of the core.
 * @param {number} ageFraction - `0` oldest … `1` newest.
 * @param {number} strength - Strength of the whole ribbon, `0`..`1`.
 * @returns {number} Alpha between `0` and `1`.
 */
export function coreAlpha(ageFraction, strength) {
  return 0.5 * Math.pow(ageFraction, 1.6) * strength;
}

/**
 * Radius of the launch ring, `age` seconds after the impulse.
 * @param {number} age - Seconds since launch.
 * @returns {number} Radius in world units.
 */
export function launchRingRadius(age) {
  const progress = Math.min(1, Math.max(0, age / LAUNCH_RING_SECONDS));

  return LAUNCH_RING_START_RADIUS + progress * (LAUNCH_RING_END_RADIUS - LAUNCH_RING_START_RADIUS);
}

/**
 * Opacity of the launch ring, `age` seconds after the impulse.
 * @param {number} age - Seconds since launch.
 * @returns {number} Alpha between `0` and `1`.
 */
export function launchRingAlpha(age) {
  const progress = Math.min(1, Math.max(0, age / LAUNCH_RING_SECONDS));

  return (1 - progress) * 0.7;
}
