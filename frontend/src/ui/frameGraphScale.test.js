import { describe, expect, it } from 'vitest';

import { resolveAxis } from './frameGraphScale.js';

/** Mirrors FRAME_GRAPH_HEADROOM_FACTOR without importing the config. */
const HEADROOM = 2;

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
