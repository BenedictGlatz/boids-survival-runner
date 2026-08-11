import { describe, expect, it } from 'vitest';

import { formatLoadRow, resolveAxis } from '../frameGraphScale.js';

/** Mirrors FRAME_GRAPH_HEADROOM_FACTOR without importing the config. */
const HEADROOM = 2;

/** Stand-ins for the translated unit words the graph passes in. */
const LABELS = { framesPerSecond: 'fps', drawCalls: 'draws', pixels: 'px', millions: 'M' };

describe('resolveAxis', () => {
  it('puts the budget line at the frame time of the target framerate', () => {
    expect(resolveAxis(60, HEADROOM).budgetMs).toBeCloseTo(16.667, 3);
  });

  it('leaves headroom above the budget for spikes', () => {
    // Without it a frame that misses its budget would be clipped right at the
    // line, and every overshoot would look equally bad.
    expect(resolveAxis(60, HEADROOM).topMs).toBeCloseTo(33.333, 3);
  });

  it('moves the whole axis when a lower framerate is selected', () => {
    const axis = resolveAxis(30, HEADROOM);

    expect(axis.budgetMs).toBeCloseTo(33.333, 3);
    expect(axis.topMs).toBeCloseTo(66.667, 3);
  });

  it('shrinks the axis for a higher framerate', () => {
    // 120 fps buys a third of the budget of 30 fps, so the same measured frame
    // has to look three times as tall.
    const axis = resolveAxis(120, HEADROOM);

    expect(axis.budgetMs).toBeCloseTo(8.333, 3);
    expect(axis.topMs).toBeCloseTo(16.667, 3);
  });

  it('keeps the budget line at a fixed share of the axis', () => {
    // What makes the line readable at a glance: it sits at the same height no
    // matter which framerate is selected.
    for (const fps of [30, 60, 120]) {
      const axis = resolveAxis(fps, HEADROOM);

      expect(axis.budgetMs / axis.topMs).toBeCloseTo(1 / HEADROOM, 6);
    }
  });
});

describe('formatLoadRow', () => {
  it('states all three figures with their units', () => {
    const row = formatLoadRow({ drawnFps: 60, drawCalls: 412, pixels: 8_294_400 }, LABELS);

    expect(row).toBe('60 fps · 412 draws · 8.3M px');
  });

  it('rounds the framerate, because a fraction of a frame is not a frame', () => {
    expect(formatLoadRow({ drawnFps: 59.94, drawCalls: 1, pixels: 0 }, LABELS)).toContain('60 fps');
  });

  it('reads unknown rather than zero before anything was measured', () => {
    // The distinction that matters on the first frame: the counter attaches on its first
    // read, so it genuinely has nothing to report — which is not the same as "no drawing".
    const row = formatLoadRow({ drawnFps: null, drawCalls: undefined, pixels: undefined }, LABELS);

    expect(row).toBe('— fps · — draws · — px');
  });

  it('treats NaN as missing', () => {
    // What a rate computed over a zero-length window would produce.
    expect(formatLoadRow({ drawnFps: Number.NaN, drawCalls: 5, pixels: 1 }, LABELS)).toContain(
      '— fps',
    );
  });

  it('reports a genuine zero as zero', () => {
    // A frame that drew nothing at all is a real and interesting state — it is what a
    // gated static picture should look like — so it must not read as unknown.
    expect(formatLoadRow({ drawnFps: 0, drawCalls: 0, pixels: 0 }, LABELS)).toBe(
      '0 fps · 0 draws · 0.0M px',
    );
  });

  it('keeps megapixels readable across the range a real display spans', () => {
    // 1280×720 at ratio 1 up to 2560×1440 at ratio 2 — the span the pixel figure exists to
    // make visible, and one decimal has to tell its ends apart.
    expect(formatLoadRow({ drawnFps: 1, drawCalls: 1, pixels: 921_600 }, LABELS)).toContain('0.9M');
    expect(formatLoadRow({ drawnFps: 1, drawCalls: 1, pixels: 14_745_600 }, LABELS)).toContain(
      '14.7M',
    );
  });
});
