import { describe, expect, it } from 'vitest';

import { timeArcAlpha, timeArcSweep } from '../timeArc.js';

describe('timeArcSweep', () => {
  it('is a whole circle while the time is untouched and nothing when it is gone', () => {
    expect(timeArcSweep(1)).toBeCloseTo(Math.PI * 2, 10);
    expect(timeArcSweep(0)).toBe(0);
  });

  it('drains in proportion to the time left', () => {
    expect(timeArcSweep(0.5)).toBeCloseTo(Math.PI, 10);
    expect(timeArcSweep(0.25)).toBeCloseTo(Math.PI / 2, 10);
  });

  it('clamps at both ends rather than winding a second turn', () => {
    // A fraction above 1 can happen for a step after a buff is re-granted at full duration.
    expect(timeArcSweep(1.4)).toBeCloseTo(Math.PI * 2, 10);
    expect(timeArcSweep(-1)).toBe(0);
  });
});

describe('timeArcAlpha', () => {
  it('holds one steady opacity while there is time left, whatever the clock says', () => {
    const atStart = timeArcAlpha(1, 0);

    expect(timeArcAlpha(1, 0.1)).toBe(atStart);
    expect(timeArcAlpha(0.5, 12.34)).toBe(atStart);
    // Just above the blink threshold: still not blinking.
    expect(timeArcAlpha(0.2, 0.2)).toBe(atStart);
  });

  it('blinks once the time is nearly out', () => {
    // A quarter of the way into a 4 Hz period the sine is positive, three quarters in it is
    // negative — so these two have to differ, and that difference *is* the blink.
    const lit = timeArcAlpha(0.05, 0.25 / 4);
    const dark = timeArcAlpha(0.05, 0.75 / 4);

    expect(dark).toBeLessThan(lit);
    expect(lit).toBe(timeArcAlpha(1, 0));
  });

  it('blinks at 4 Hz, so one second holds four dark halves', () => {
    // Sampled every 25 ms across one second, offset by half a step so no sample lands on a zero
    // crossing of the sine — exactly there the sign is decided by floating-point noise rather
    // than by the rate under test.
    const samples = [];
    for (let sample = 0; sample < 40; sample += 1) {
      samples.push(timeArcAlpha(0.05, (sample + 0.5) * 0.025));
    }

    let switches = 0;
    for (let sample = 1; sample < samples.length; sample += 1) {
      if (samples[sample] !== samples[sample - 1]) {
        switches += 1;
      }
    }

    // Four lit halves and four dark ones are eight runs, so seven switches between them.
    expect(switches).toBe(7);
  });

  it('does not blink on a frozen frame, which hands over a clock of zero', () => {
    // sin(0) is 0 and therefore not negative, so a paused round shows a steady arc rather than
    // one stuck mid-blink.
    expect(timeArcAlpha(0.01, 0)).toBe(timeArcAlpha(1, 0));
  });
});
