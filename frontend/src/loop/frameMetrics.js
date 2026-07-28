/**
 * Collects how much time each frame spends simulating and drawing.
 *
 * Pure bookkeeping — no DOM, no drawing, no game state. The numbers handed in
 * are measured with `performance.now()`, so they cover *script* work only: the
 * browser's layout, paint and compositing happen after our frame code returns
 * and are not included.
 *
 * The simulation runs on every animation frame while drawing is throttled to the
 * chosen target framerate, so the two are measured at different rates. To keep
 * one bar meaning one drawn frame, simulation time is accumulated and only
 * committed once the next frame is actually drawn. A bar therefore represents
 * *all* the work done since the previous bar.
 */
export class FrameMetrics {
  /** @param {number} capacity - How many frames of history to keep. */
  constructor(capacity) {
    this._capacity = capacity;
    // Preallocated: recording happens every frame, and the coding standards
    // forbid per-frame allocations on the hot path.
    this._simulationSamples = new Float32Array(capacity);
    this._renderSamples = new Float32Array(capacity);
    this._sampleCount = 0;
    this._writeIndex = 0;
    this._pendingSimulationMs = 0;
  }

  /**
   * Adds this animation frame's simulation cost to the sample being built.
   * @param {number} milliseconds
   */
  addSimulationTime(milliseconds) {
    this._pendingSimulationMs += milliseconds;
  }

  /**
   * Closes the current sample: the simulation time collected since the previous
   * drawn frame plus the time that frame took to draw.
   * @param {number} renderMilliseconds
   */
  commitRenderedFrame(renderMilliseconds) {
    this._simulationSamples[this._writeIndex] = this._pendingSimulationMs;
    this._renderSamples[this._writeIndex] = renderMilliseconds;
    this._pendingSimulationMs = 0;

    this._writeIndex = (this._writeIndex + 1) % this._capacity;

    if (this._sampleCount < this._capacity) {
      this._sampleCount += 1;
    }
  }

  /** Clears the history and the pending sample, e.g. when a round starts. */
  reset() {
    this._sampleCount = 0;
    this._writeIndex = 0;
    this._pendingSimulationMs = 0;
  }

  get capacity() {
    return this._capacity;
  }

  /** Number of valid samples; stops growing once the buffer has wrapped. */
  get sampleCount() {
    return this._sampleCount;
  }

  /**
   * Buffer slot holding the oldest sample, i.e. where a left-to-right read
   * starts. While the buffer is still filling up that is simply slot 0; once it
   * has wrapped, the next slot to be overwritten is the oldest one.
   */
  oldestIndex() {
    return this._sampleCount < this._capacity ? 0 : this._writeIndex;
  }

  /** Raw ring buffer. Index it via `oldestIndex()` and `capacity`. */
  get simulationSamples() {
    return this._simulationSamples;
  }

  /** Raw ring buffer. Index it via `oldestIndex()` and `capacity`. */
  get renderSamples() {
    return this._renderSamples;
  }

  /**
   * Aggregates the current window. Recomputed on demand rather than tracked
   * incrementally: it runs once per drawn frame over a few hundred values,
   * which is far cheaper than the clarity it costs to maintain running extremes
   * that also have to survive the buffer wrapping around.
   *
   * @returns {{lastSimulationMs: number, lastRenderMs: number,
   *            lastTotalMs: number, maxTotalMs: number}}
   */
  summary() {
    if (this._sampleCount === 0) {
      return {
        lastSimulationMs: 0,
        lastRenderMs: 0,
        lastTotalMs: 0,
        maxTotalMs: 0,
      };
    }

    let maxTotalMs = 0;
    const oldest = this.oldestIndex();

    for (let offset = 0; offset < this._sampleCount; offset += 1) {
      const slot = (oldest + offset) % this._capacity;
      const totalMs = this._simulationSamples[slot] + this._renderSamples[slot];

      if (totalMs > maxTotalMs) {
        maxTotalMs = totalMs;
      }
    }

    const newest = (this._writeIndex - 1 + this._capacity) % this._capacity;
    const lastSimulationMs = this._simulationSamples[newest];
    const lastRenderMs = this._renderSamples[newest];

    return {
      lastSimulationMs,
      lastRenderMs,
      lastTotalMs: lastSimulationMs + lastRenderMs,
      maxTotalMs,
    };
  }
}
