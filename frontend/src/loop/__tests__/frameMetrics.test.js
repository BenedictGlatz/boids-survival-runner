import { describe, expect, it } from 'vitest';

import { FrameMetrics } from '../frameMetrics.js';

// A tiny history keeps the wraparound cases short enough to read at a glance.
const TEST_CAPACITY = 4;

/**
 * Reads the whole window oldest-to-newest, the way the graph draws it.
 * @param {FrameMetrics} metrics
 * @returns {Array<{simulationMs: number, renderMs: number}>}
 */
function readSamplesInDrawOrder(metrics) {
  const samples = [];
  const oldest = metrics.oldestIndex();

  for (let offset = 0; offset < metrics.sampleCount; offset += 1) {
    const slot = (oldest + offset) % metrics.capacity;
    samples.push({
      simulationMs: metrics.simulationSamples[slot],
      renderMs: metrics.renderSamples[slot],
    });
  }

  return samples;
}

describe('FrameMetrics simulation accumulator', () => {
  it('sums the simulation time of every animation frame into one drawn sample', () => {
    // Three animation frames simulate, only the third one draws — that is what
    // happens whenever rendering is throttled below the display refresh rate.
    const metrics = new FrameMetrics(TEST_CAPACITY);

    metrics.addSimulationTime(1);
    metrics.addSimulationTime(2);
    metrics.addSimulationTime(3);
    metrics.commitRenderedFrame(0.5);

    expect(metrics.sampleCount).toBe(1);
    expect(metrics.summary().lastSimulationMs).toBeCloseTo(6);
    expect(metrics.summary().lastRenderMs).toBeCloseTo(0.5);
  });

  it('starts a fresh accumulator after every drawn frame', () => {
    // The bug this guards against is a leaking accumulator: without the flush
    // each bar would include all the simulation time before it as well.
    const metrics = new FrameMetrics(TEST_CAPACITY);

    metrics.addSimulationTime(10);
    metrics.commitRenderedFrame(1);
    metrics.addSimulationTime(4);
    metrics.commitRenderedFrame(1);

    expect(readSamplesInDrawOrder(metrics)).toEqual([
      { simulationMs: 10, renderMs: 1 },
      { simulationMs: 4, renderMs: 1 },
    ]);
  });

  it('records a zero sample when a frame draws without simulating', () => {
    // Happens while the world is frozen (countdown, death): the loop still
    // draws, so the graph must keep advancing instead of stalling.
    const metrics = new FrameMetrics(TEST_CAPACITY);

    metrics.commitRenderedFrame(2);

    expect(metrics.sampleCount).toBe(1);
    expect(metrics.summary().lastSimulationMs).toBe(0);
    expect(metrics.summary().lastTotalMs).toBeCloseTo(2);
  });
});

describe('FrameMetrics ring buffer', () => {
  it('counts samples up to the capacity and then stops growing', () => {
    const metrics = new FrameMetrics(TEST_CAPACITY);

    for (let frame = 0; frame < TEST_CAPACITY * 3; frame += 1) {
      metrics.commitRenderedFrame(1);
    }

    expect(metrics.sampleCount).toBe(TEST_CAPACITY);
  });

  it('reads from slot 0 while the buffer is still filling up', () => {
    const metrics = new FrameMetrics(TEST_CAPACITY);

    metrics.commitRenderedFrame(1);
    metrics.commitRenderedFrame(1);

    expect(metrics.oldestIndex()).toBe(0);
  });

  it('keeps the newest samples in order once it has wrapped around', () => {
    const metrics = new FrameMetrics(TEST_CAPACITY);

    // Six frames into a four-slot buffer: the first two must be gone and the
    // remaining four must still read oldest-to-newest, not in slot order.
    for (let frame = 1; frame <= TEST_CAPACITY + 2; frame += 1) {
      metrics.addSimulationTime(frame);
      metrics.commitRenderedFrame(0);
    }

    expect(metrics.oldestIndex()).toBe(2);
    expect(readSamplesInDrawOrder(metrics).map((sample) => sample.simulationMs)).toEqual([
      3, 4, 5, 6,
    ]);
  });

  it('drops overwritten frames out of the peak once they leave the window', () => {
    const metrics = new FrameMetrics(TEST_CAPACITY);

    // One very expensive frame, then enough cheap frames to push it out.
    metrics.addSimulationTime(100);
    metrics.commitRenderedFrame(0);
    expect(metrics.summary().maxTotalMs).toBeCloseTo(100);

    for (let frame = 0; frame < TEST_CAPACITY; frame += 1) {
      metrics.addSimulationTime(1);
      metrics.commitRenderedFrame(0);
    }

    expect(metrics.summary().maxTotalMs).toBeCloseTo(1);
  });
});

describe('FrameMetrics summary', () => {
  it('reports zeros on an empty buffer instead of reading an unwritten slot', () => {
    const metrics = new FrameMetrics(TEST_CAPACITY);

    expect(metrics.summary()).toEqual({
      lastSimulationMs: 0,
      lastRenderMs: 0,
      lastTotalMs: 0,
      averageSimulationMs: 0,
      averageRenderMs: 0,
      averageTotalMs: 0,
      maxSimulationMs: 0,
      maxRenderMs: 0,
      maxTotalMs: 0,
    });
  });

  it('adds simulation and render time into the frame total', () => {
    const metrics = new FrameMetrics(TEST_CAPACITY);

    metrics.addSimulationTime(3);
    metrics.commitRenderedFrame(1.25);

    const summary = metrics.summary();

    expect(summary.lastTotalMs).toBeCloseTo(summary.lastSimulationMs + summary.lastRenderMs);
    expect(summary.lastTotalMs).toBeCloseTo(4.25);
  });

  it('takes the peak over the whole window, not just the newest frame', () => {
    const metrics = new FrameMetrics(TEST_CAPACITY);

    metrics.addSimulationTime(2);
    metrics.commitRenderedFrame(0);
    metrics.addSimulationTime(9);
    metrics.commitRenderedFrame(0);
    metrics.addSimulationTime(1);
    metrics.commitRenderedFrame(0);

    const summary = metrics.summary();

    expect(summary.lastTotalMs).toBeCloseTo(1);
    expect(summary.maxTotalMs).toBeCloseTo(9);
  });
});

describe('FrameMetrics averages', () => {
  it('averages over the samples present, not over the whole capacity', () => {
    // A half-filled buffer must not be diluted by the slots nobody wrote to,
    // otherwise the panel would read far too low right after a round starts.
    const metrics = new FrameMetrics(TEST_CAPACITY);

    metrics.addSimulationTime(2);
    metrics.commitRenderedFrame(0);
    metrics.addSimulationTime(4);
    metrics.commitRenderedFrame(0);

    expect(metrics.summary().averageSimulationMs).toBeCloseTo(3);
  });

  it('recovers a fractional average from measurements the browser rounded', () => {
    // This is the whole point of the averages: browsers coarsen
    // performance.now() (Firefox to 1 ms), so every sample arrives as an
    // integer. Three of four frames costing 1 ms really means 0.75 ms.
    const metrics = new FrameMetrics(TEST_CAPACITY);

    for (const measuredMs of [1, 1, 1, 0]) {
      metrics.addSimulationTime(measuredMs);
      metrics.commitRenderedFrame(0);
    }

    expect(metrics.summary().averageSimulationMs).toBeCloseTo(0.75);
  });

  it('adds the two averages into the frame average', () => {
    const metrics = new FrameMetrics(TEST_CAPACITY);

    metrics.addSimulationTime(1);
    metrics.commitRenderedFrame(3);
    metrics.addSimulationTime(3);
    metrics.commitRenderedFrame(1);

    const summary = metrics.summary();

    expect(summary.averageSimulationMs).toBeCloseTo(2);
    expect(summary.averageRenderMs).toBeCloseTo(2);
    expect(summary.averageTotalMs).toBeCloseTo(4);
  });

  it('drops samples out of the average once they leave the window', () => {
    const metrics = new FrameMetrics(TEST_CAPACITY);

    metrics.addSimulationTime(100);
    metrics.commitRenderedFrame(0);

    for (let frame = 0; frame < TEST_CAPACITY; frame += 1) {
      metrics.addSimulationTime(2);
      metrics.commitRenderedFrame(0);
    }

    expect(metrics.summary().averageSimulationMs).toBeCloseTo(2);
  });
});

describe('FrameMetrics per-series peaks', () => {
  it('tracks the simulation and draw peaks independently of the frame peak', () => {
    // The graph scales two separate curves against the larger of the two peaks,
    // so a peak that only ever existed as a sum would waste the panel's height.
    const metrics = new FrameMetrics(TEST_CAPACITY);

    metrics.addSimulationTime(5);
    metrics.commitRenderedFrame(1);
    metrics.addSimulationTime(1);
    metrics.commitRenderedFrame(3);

    const summary = metrics.summary();

    expect(summary.maxSimulationMs).toBeCloseTo(5);
    expect(summary.maxRenderMs).toBeCloseTo(3);
    // No single frame ever cost 8 ms — the two peaks are in different frames.
    expect(summary.maxTotalMs).toBeCloseTo(6);
  });
});

describe('FrameMetrics reset', () => {
  it('clears the history so the graph starts empty on the next round', () => {
    const metrics = new FrameMetrics(TEST_CAPACITY);

    metrics.addSimulationTime(5);
    metrics.commitRenderedFrame(5);
    metrics.reset();

    expect(metrics.sampleCount).toBe(0);
    expect(metrics.oldestIndex()).toBe(0);
    expect(metrics.summary().maxTotalMs).toBe(0);
  });

  it('drops a half-collected sample instead of billing it to the next round', () => {
    const metrics = new FrameMetrics(TEST_CAPACITY);

    // Simulation time measured before the reset belongs to the old round.
    metrics.addSimulationTime(20);
    metrics.reset();
    metrics.addSimulationTime(1);
    metrics.commitRenderedFrame(0);

    expect(metrics.summary().lastSimulationMs).toBeCloseTo(1);
  });

  it('writes to slot 0 again after a reset', () => {
    const metrics = new FrameMetrics(TEST_CAPACITY);

    for (let frame = 0; frame < TEST_CAPACITY + 1; frame += 1) {
      metrics.commitRenderedFrame(1);
    }
    metrics.reset();
    metrics.addSimulationTime(7);
    metrics.commitRenderedFrame(0);

    expect(metrics.sampleCount).toBe(1);
    expect(metrics.simulationSamples[0]).toBeCloseTo(7);
  });
});
