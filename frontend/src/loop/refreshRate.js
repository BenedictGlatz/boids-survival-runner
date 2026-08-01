/**
 * How fast the display actually refreshes, and which target framerates that leaves
 * worth offering.
 *
 * The browser exposes no refresh rate, so it is measured: requestAnimationFrame is
 * driven by the display, and the interval between its calls is the refresh period.
 * A 60 Hz panel cannot show 120 fps, so the menu must not offer it — otherwise the
 * setting promises something the hardware never delivers.
 *
 * The arithmetic is split from the measurement on purpose: the two pure functions
 * are unit-testable under Vitest's Node environment, and requestAnimationFrame is
 * only touched inside the probe's body, never while the module is imported.
 */

import {
  MAX_PLAUSIBLE_REFRESH_RATE_HZ,
  MIN_PLAUSIBLE_REFRESH_RATE_HZ,
  REFRESH_RATE_SAMPLE_COUNT,
  REFRESH_RATE_TOLERANCE,
  TARGET_FPS_OPTIONS,
} from '../gameConfig.js';

const MILLISECONDS_PER_SECOND = 1000;

/**
 * Turns a series of measured frame intervals into a refresh rate.
 *
 * The median is taken rather than the average: start-up regularly produces one
 * long frame (a script or a layout landing between two animation frames), and a
 * single outlier is enough to pull an average far below the real rate.
 * @param {number[]} intervalsMs - Milliseconds between consecutive animation frames.
 * @returns {?number} The refresh rate in hertz, or `null` when the sample is empty
 *   or the result is too far outside what a display plausibly does.
 */
export function estimateRefreshRateHz(intervalsMs) {
  // Zero and negative intervals would divide into nonsense; a timestamp source
  // that stalls can produce both.
  const usableIntervalsMs = [];

  for (const intervalMs of intervalsMs) {
    if (Number.isFinite(intervalMs) && intervalMs > 0) {
      usableIntervalsMs.push(intervalMs);
    }
  }

  if (usableIntervalsMs.length === 0) {
    return null;
  }

  usableIntervalsMs.sort((first, second) => first - second);

  // With an even sample count this takes the upper of the two middle values
  // instead of averaging them — a difference far below the tolerance below.
  const medianIntervalMs = usableIntervalsMs[Math.floor(usableIntervalsMs.length / 2)];
  const refreshRateHz = MILLISECONDS_PER_SECOND / medianIntervalMs;

  if (
    refreshRateHz < MIN_PLAUSIBLE_REFRESH_RATE_HZ ||
    refreshRateHz > MAX_PLAUSIBLE_REFRESH_RATE_HZ
  ) {
    return null;
  }

  return refreshRateHz;
}

/**
 * The target framerates worth offering on a display of the given rate.
 *
 * `TARGET_FPS_OPTIONS` is ascending, and both special cases below rely on that:
 * the first entry is the slowest option and the last one the fastest.
 * @param {?number} refreshRateHz - Measured refresh rate, or `null` if unknown.
 * @returns {number[]} The offered rates, ascending and never empty.
 */
export function availableTargetFpsOptions(refreshRateHz) {
  // Nothing measured means nothing to filter by. Offering all of them is the
  // honest answer: the loop is capped by the display either way.
  if (refreshRateHz === null || refreshRateHz === undefined) {
    return [...TARGET_FPS_OPTIONS];
  }

  const highestUsableFps = refreshRateHz * (1 + REFRESH_RATE_TOLERANCE);
  const availableFps = [];

  for (const fps of TARGET_FPS_OPTIONS) {
    if (fps <= highestUsableFps) {
      availableFps.push(fps);
    }
  }

  // A display slower than every option still needs something to select, so the
  // slowest one stays on the list rather than the group rendering empty.
  if (availableFps.length === 0) {
    availableFps.push(TARGET_FPS_OPTIONS[0]);
  }

  return availableFps;
}

/**
 * Watches a handful of animation frames and reports what the display is doing.
 *
 * Called once during start-up, in parallel with the locale fetch, so the dozen
 * frames it waits for cost no extra time before the menu appears.
 * @returns {Promise<?number>} The measured refresh rate in hertz, or `null` when it
 *   could not be established.
 */
export function measureRefreshRateHz() {
  // A hidden tab throttles requestAnimationFrame to roughly one call per second.
  // Measuring then would report a 1 Hz display, so it is better not to measure.
  if (document.hidden) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const intervalsMs = [];
    let previousTimestamp = null;

    function sampleFrame(timestamp) {
      if (previousTimestamp !== null) {
        intervalsMs.push(timestamp - previousTimestamp);
      }

      previousTimestamp = timestamp;

      if (intervalsMs.length < REFRESH_RATE_SAMPLE_COUNT) {
        requestAnimationFrame(sampleFrame);
        return;
      }

      resolve(estimateRefreshRateHz(intervalsMs));
    }

    requestAnimationFrame(sampleFrame);
  });
}
