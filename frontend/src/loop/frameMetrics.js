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
 * one sample meaning one drawn frame, simulation time is accumulated and only
 * committed once the next frame is actually drawn. A sample therefore represents
 * all* the work done since the previous sample.
 *
 * Browsers deliberately coarsen `performance.now()` as a timing-attack defence —
 * Firefox rounds it down to whole milliseconds by default, Chrome to 100 us. A
 * single sample is therefore already quantised before it ever reaches us, which
 * is why `summary()` also reports window averages: the rounding is unbiased, so
 * averaging many samples recovers the fractional part the individual readings
 * cannot show.
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
   * @param {number} milliseconds - Time this animation frame spent simulating.
   */
  addSimulationTime(milliseconds) {
    this._pendingSimulationMs += milliseconds;
  }

  /**
   * Closes the current sample: the simulation time collected since the previous
   * drawn frame plus the time that frame took to draw.
   * @param {number} renderMilliseconds - Time this frame spent drawing.
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

  /** @returns {number} Fixed ring-buffer size, in samples. */
  get capacity() {
    return this._capacity;
  }

  /** @returns {number} Number of valid samples; stops growing once the buffer has wrapped. */
  get sampleCount() {
    return this._sampleCount;
  }

  /**
   * Buffer slot holding the oldest sample, i.e. where a left-to-right read
   * starts. While the buffer is still filling up that is simply slot 0; once it
   * has wrapped, the next slot to be overwritten is the oldest one.
   * @returns {number} Index of the oldest sample.
   */
  oldestIndex() {
    return this._sampleCount < this._capacity ? 0 : this._writeIndex;
  }

  /** @returns {Float32Array} Raw ring buffer. Index it via `oldestIndex()` and `capacity`. */
  get simulationSamples() {
    return this._simulationSamples;
  }

  /** @returns {Float32Array} Raw ring buffer. Index it via `oldestIndex()` and `capacity`. */
  get renderSamples() {
    return this._renderSamples;
  }

  /**
   * Aggregates the current window. Recomputed on demand rather than tracked
   * incrementally: it runs once per drawn frame over a few hundred values,
   * which is far cheaper than the clarity it costs to maintain running extremes
   * that also have to survive the buffer wrapping around.
   *
   * The averages are the numbers worth reading off the panel: they are the only
   * ones with meaningful decimals once the browser has rounded every individual
   * measurement (see the class comment). The peaks stay raw — an average would
   * hide exactly the spike they exist to report.
   * @returns {{lastSimulationMs: number, lastRenderMs: number, lastTotalMs: number,
   *            averageSimulationMs: number, averageRenderMs: number,
   *            averageTotalMs: number, maxSimulationMs: number,
   *            maxRenderMs: number, maxTotalMs: number}} The window's last, average, and peak costs.
   */
  summary() {
    if (this._sampleCount === 0) {
      return {
        lastSimulationMs: 0,
        lastRenderMs: 0,
        lastTotalMs: 0,
        averageSimulationMs: 0,
        averageRenderMs: 0,
        averageTotalMs: 0,
        maxSimulationMs: 0,
        maxRenderMs: 0,
        maxTotalMs: 0,
      };
    }

    let maxSimulationMs = 0;
    let maxRenderMs = 0;
    let maxTotalMs = 0;
    let simulationSumMs = 0;
    let renderSumMs = 0;
    const oldest = this.oldestIndex();

    for (let offset = 0; offset < this._sampleCount; offset += 1) {
      const slot = (oldest + offset) % this._capacity;
      const simulationMs = this._simulationSamples[slot];
      const renderMs = this._renderSamples[slot];
      const totalMs = simulationMs + renderMs;

      simulationSumMs += simulationMs;
      renderSumMs += renderMs;

      // The three peaks are tracked separately because the graph plots the two
      // series on their own axis in separate mode and only their sum in
      // combined mode; a single peak would be wrong for one of the two.
      if (simulationMs > maxSimulationMs) {
        maxSimulationMs = simulationMs;
      }
      if (renderMs > maxRenderMs) {
        maxRenderMs = renderMs;
      }
      if (totalMs > maxTotalMs) {
        maxTotalMs = totalMs;
      }
    }

    const newest = (this._writeIndex - 1 + this._capacity) % this._capacity;
    const lastSimulationMs = this._simulationSamples[newest];
    const lastRenderMs = this._renderSamples[newest];
    const averageSimulationMs = simulationSumMs / this._sampleCount;
    const averageRenderMs = renderSumMs / this._sampleCount;

    return {
      lastSimulationMs,
      lastRenderMs,
      lastTotalMs: lastSimulationMs + lastRenderMs,
      averageSimulationMs,
      averageRenderMs,
      averageTotalMs: averageSimulationMs + averageRenderMs,
      maxSimulationMs,
      maxRenderMs,
      maxTotalMs,
    };
  }
}
