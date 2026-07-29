/**
 * Dash cooldown arithmetic.
 *
 * Pure functions, no config imports and nothing that touches the DOM, so the
 * behaviour can be unit tested without a browser or a built WebAssembly package.
 *
 * Every time value is measured on the simulation clock, never on wall time: the
 * simulation advances by a fixed step, so a backgrounded tab must not hand out
 * free cooldown progress.
 */

/** Whether enough simulation time has passed since the last dash. */
export function isDashReady(simulationTimeMs, lastDashAtMs, cooldownMs) {
  return simulationTimeMs - lastDashAtMs >= cooldownMs;
}

/**
 * How far the cooldown has recovered, from `0` right after a dash to `1` once
 * the dash is available again. Used to fill the bar at the bottom of the screen.
 */
export function dashCooldownProgress(simulationTimeMs, lastDashAtMs, cooldownMs) {
  if (cooldownMs <= 0) {
    return 1;
  }

  const elapsedMs = simulationTimeMs - lastDashAtMs;
  const progress = elapsedMs / cooldownMs;

  return Math.min(Math.max(progress, 0), 1);
}
