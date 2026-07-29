/**
 * Decouples simulation rate from render rate.
 *
 * The Rust engine advances exactly one fixed step per `tick()` call, so the
 * simulation must run at a constant rate while only drawing follows the user's
 * chosen target framerate. This class owns that timing arithmetic and nothing
 * else — no DOM access, no game state.
 */
export class FrameScheduler {
  /**
   * @param {number} stepMs - Wall-clock duration of one simulation step.
   * @param {number} maxStepsPerFrame - Catch-up limit after a stall.
   * @param {number} uncappedTargetFps - Target at or above which throttling is off.
   * @param {number} renderIntervalToleranceMs - Slack allowed in the render gate.
   */
  constructor(stepMs, maxStepsPerFrame, uncappedTargetFps, renderIntervalToleranceMs) {
    this._stepMs = stepMs;
    this._maxPendingMs = stepMs * maxStepsPerFrame;
    this._uncappedTargetFps = uncappedTargetFps;
    this._renderIntervalToleranceMs = renderIntervalToleranceMs;
    this._previousTimestamp = null;
    this._pendingMs = 0;
    this._lastRenderedAt = Number.NEGATIVE_INFINITY;
  }

  /**
   * Accounts for the time since the previous frame and reports how many
   * simulation steps are now due.
   * @param {number} timestamp - The requestAnimationFrame timestamp.
   * @returns {number} Steps to run this frame, never above the catch-up limit.
   */
  beginFrame(timestamp) {
    const elapsedMs =
      this._previousTimestamp === null ? 0 : Math.max(0, timestamp - this._previousTimestamp);
    this._previousTimestamp = timestamp;

    // Clamping the debt also bounds the loop below, so no separate counter is
    // needed. Time beyond the limit is dropped: under sustained overload the
    // world runs in slow motion instead of freezing to catch up, and it
    // recovers on its own once frames get cheap again.
    this._pendingMs = Math.min(this._pendingMs + elapsedMs, this._maxPendingMs);

    const steps = Math.floor(this._pendingMs / this._stepMs);
    this._pendingMs -= steps * this._stepMs;

    return steps;
  }

  /**
   * Drops accumulated simulation debt without running it and restarts the frame
   * clock, so the next `beginFrame` measures from then rather than from the last
   * active frame. Used whenever the world is deliberately frozen (countdown,
   * round start, death); without the clock reset a restart would carry the whole
   * frozen span into the first step of the new round as a catch-up burst.
   */
  discardPendingTime() {
    this._pendingMs = 0;
    this._previousTimestamp = null;
  }

  /**
   * @param {number} timestamp - The requestAnimationFrame timestamp.
   * @param {number} targetFps - The user's chosen target framerate.
   * @returns {boolean} Whether this frame should be drawn.
   */
  shouldRenderNow(timestamp, targetFps) {
    // requestAnimationFrame is already capped by the display refresh rate, so
    // the highest option simply means "do not throttle".
    if (targetFps >= this._uncappedTargetFps) {
      return true;
    }

    const minimumIntervalMs = 1000 / targetFps - this._renderIntervalToleranceMs;

    return timestamp - this._lastRenderedAt >= minimumIntervalMs;
  }

  /** @param {number} timestamp - The requestAnimationFrame timestamp. */
  markRendered(timestamp) {
    this._lastRenderedAt = timestamp;
  }
}
