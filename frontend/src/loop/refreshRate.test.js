import { describe, expect, it } from 'vitest';
import { availableTargetFpsOptions, estimateRefreshRateHz } from './refreshRate.js';

// The intervals a real display produces, to the precision the browser reports them.
const SIXTY_HZ_MS = 1000 / 59.94;
const HUNDRED_TWENTY_HZ_MS = 1000 / 119.88;
const HUNDRED_FORTY_FOUR_HZ_MS = 1000 / 144;

/** Repeats one interval, as a steady display would. */
function steadyIntervals(intervalMs, count = 11) {
  return new Array(count).fill(intervalMs);
}

describe('estimateRefreshRateHz', () => {
  it('reads a steady 60 Hz display as 60 Hz', () => {
    expect(estimateRefreshRateHz(steadyIntervals(SIXTY_HZ_MS))).toBeCloseTo(59.94, 1);
  });

  it('ignores a single long frame instead of halving the estimate', () => {
    // The reason for the median: one stalled frame during start-up is normal, and
    // an average over these samples would land near 46 Hz.
    const intervals = steadyIntervals(SIXTY_HZ_MS);
    intervals[4] = 250;

    expect(estimateRefreshRateHz(intervals)).toBeCloseTo(59.94, 1);
  });

  it('skips intervals that cannot be measured', () => {
    expect(estimateRefreshRateHz([0, -5, Number.NaN, SIXTY_HZ_MS, SIXTY_HZ_MS])).toBeCloseTo(
      59.94,
      1,
    );
  });

  it('reports nothing for an empty sample', () => {
    expect(estimateRefreshRateHz([])).toBeNull();
  });

  it('reports nothing for a throttled tab', () => {
    // A backgrounded tab gets about one animation frame per second. That is not a
    // display rate, and taking it for one would leave the player at 30 fps.
    expect(estimateRefreshRateHz(steadyIntervals(1000))).toBeNull();
  });

  it('reports nothing for an implausibly fast sample', () => {
    expect(estimateRefreshRateHz(steadyIntervals(0.5))).toBeNull();
  });

  it('reads a high-refresh display at its real rate', () => {
    expect(estimateRefreshRateHz(steadyIntervals(HUNDRED_FORTY_FOUR_HZ_MS))).toBeCloseTo(144, 1);
  });
});

describe('availableTargetFpsOptions', () => {
  it('drops 120 on a 60 Hz display', () => {
    expect(availableTargetFpsOptions(59.94)).toEqual([30, 60]);
  });

  it('keeps every option on a 120 Hz display', () => {
    expect(availableTargetFpsOptions(119.88)).toEqual([30, 60, 120]);
  });

  it('keeps every option on a display faster than the fastest option', () => {
    // 144 Hz cannot be offered as such — the list is fixed — so 120 stays the top
    // option there and simply renders unthrottled.
    expect(availableTargetFpsOptions(144)).toEqual([30, 60, 120]);
  });

  it('keeps the slowest option on a display slower than any of them', () => {
    // Never an empty group: something has to be selectable, even at 24 Hz.
    expect(availableTargetFpsOptions(24)).toEqual([30]);
  });

  it('offers everything when the rate could not be measured', () => {
    expect(availableTargetFpsOptions(null)).toEqual([30, 60, 120]);
  });
});

describe('the two together', () => {
  it('turns a measured 120 Hz sample into the full option list', () => {
    const refreshRateHz = estimateRefreshRateHz(steadyIntervals(HUNDRED_TWENTY_HZ_MS));

    expect(availableTargetFpsOptions(refreshRateHz)).toEqual([30, 60, 120]);
  });

  it('turns a measured 60 Hz sample into a list without 120', () => {
    const refreshRateHz = estimateRefreshRateHz(steadyIntervals(SIXTY_HZ_MS));

    expect(availableTargetFpsOptions(refreshRateHz)).toEqual([30, 60]);
  });
});
