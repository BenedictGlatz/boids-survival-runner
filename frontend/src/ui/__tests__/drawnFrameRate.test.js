import { describe, expect, it } from 'vitest';
import { DrawnFrameRate } from '../drawnFrameRate.js';

/**
 * Feeds `frames` evenly spaced samples across `spanMs`, the last one landing exactly on
 * `startMs + spanMs`. It does **not** send the boundary sample at `startMs` itself — that one
 * either opened the window in an earlier call or closed the previous one.
 */
function feed(counter, frames, spanMs, startMs = 0) {
  let reported = null;

  for (let frame = 1; frame <= frames; frame += 1) {
    reported = counter.sample(startMs + (spanMs * frame) / frames);
  }

  return reported;
}

describe('DrawnFrameRate', () => {
  it('reports nothing before the first second is over', () => {
    const counter = new DrawnFrameRate();

    expect(counter.sample(0)).toBe(null);
    expect(feed(counter, 30, 500)).toBe(null);
  });

  it('reports the count once a full window has passed', () => {
    const counter = new DrawnFrameRate();

    counter.sample(0);

    expect(feed(counter, 60, 1000)).toBeCloseTo(60, 6);
  });

  it('does not count the frame that opens the window', () => {
    // Sixty gaps between sixty-one frames is 60 fps, not 61. This is the whole reason the
    // opening sample returns early instead of incrementing.
    const counter = new DrawnFrameRate();

    counter.sample(0);

    expect(feed(counter, 60, 1000)).not.toBeCloseTo(61, 1);
  });

  it('tells 60 apart from 144 over the same window', () => {
    // The whole reason the counter exists: a frame duration cannot distinguish a capped 60
    // from an uncapped 144 on a 144 Hz panel, a count over a second can.
    const capped = new DrawnFrameRate();
    const uncapped = new DrawnFrameRate();

    capped.sample(0);
    uncapped.sample(0);

    expect(feed(capped, 60, 1000)).toBeCloseTo(60, 6);
    expect(feed(uncapped, 144, 1000)).toBeCloseTo(144, 6);
  });

  it('scales by the window it actually measured, not by the frame count alone', () => {
    // The boundary is crossed by whichever frame happens to land past it, so the window is
    // almost never exactly 1000 ms. Dividing by the real span is what keeps a steady 60 from
    // drifting every time the closing frame overshoots.
    const counter = new DrawnFrameRate();

    counter.sample(0);

    expect(feed(counter, 61, 1016.7)).toBeCloseTo(60, 1);
  });

  it('holds the last value between windows instead of blanking', () => {
    const counter = new DrawnFrameRate();

    counter.sample(0);
    feed(counter, 60, 1000);

    // Half way into the next window: still last second's answer, not null and not a
    // half-formed count.
    expect(feed(counter, 30, 500, 1000)).toBeCloseTo(60, 6);
  });

  it('starts a fresh window rather than accumulating across them', () => {
    const counter = new DrawnFrameRate();

    counter.sample(0);

    expect(feed(counter, 120, 1000)).toBeCloseTo(120, 6);
    expect(feed(counter, 30, 1000, 1000)).toBeCloseTo(30, 6);
  });

  it('survives a clock that jumps backwards', () => {
    const counter = new DrawnFrameRate();

    counter.sample(0);
    feed(counter, 60, 1000);

    expect(counter.sample(-5000)).toBeCloseTo(60, 6);
    // The window restarted at the new reading, so a full second from there reports again.
    expect(feed(counter, 45, 1000, -5000)).toBeCloseTo(45, 6);
  });

  it('forgets everything on reset', () => {
    const counter = new DrawnFrameRate();

    counter.sample(0);

    expect(feed(counter, 60, 1000)).toBeCloseTo(60, 6);

    counter.reset();

    expect(counter.sample(2000)).toBe(null);
  });

  it('does not blame the game for a pause it did not draw through', () => {
    // Without the reset, the window spanning a five-minute pause reports a rate near zero,
    // which describes the pause rather than the game.
    const counter = new DrawnFrameRate();

    counter.sample(0);
    feed(counter, 60, 1000);
    counter.reset();

    expect(counter.sample(301_000)).toBe(null);
    expect(feed(counter, 60, 1000, 301_000)).toBeCloseTo(60, 6);
  });
});
