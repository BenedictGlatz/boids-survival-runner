import { describe, expect, it } from 'vitest';
import { FrameScheduler } from './frameScheduler.js';

// Round numbers on purpose. The scheduler divides by its step length, so mirroring
// the real 1000/60 everywhere would test floating-point luck rather than the
// arithmetic. One test below uses the real value to check the 60 Hz case itself.
const STEP_MS = 10;
const MAX_STEPS_PER_FRAME = 5;
const UNCAPPED_FPS = 120;
const TOLERANCE_MS = 2;

function makeScheduler() {
  return new FrameScheduler(STEP_MS, MAX_STEPS_PER_FRAME, UNCAPPED_FPS, TOLERANCE_MS);
}

describe('FrameScheduler.beginFrame', () => {
  it('runs no step on the first frame and only seeds the clock', () => {
    // The first requestAnimationFrame timestamp is time since page load, not since
    // the round started. Treating it as elapsed time would open every round with a
    // catch-up burst of the maximum step count.
    expect(makeScheduler().beginFrame(5000)).toBe(0);
  });

  it('runs exactly one step for one step worth of elapsed time', () => {
    const scheduler = makeScheduler();
    scheduler.beginFrame(0);

    expect(scheduler.beginFrame(STEP_MS)).toBe(1);
  });

  it('runs one step for a 60 Hz frame at the real step length', () => {
    const stepMs = 1000 / 60;
    const scheduler = new FrameScheduler(stepMs, MAX_STEPS_PER_FRAME, UNCAPPED_FPS, TOLERANCE_MS);
    scheduler.beginFrame(0);

    expect(scheduler.beginFrame(stepMs)).toBe(1);
  });

  it('runs several steps for a frame that took several steps worth of time', () => {
    const scheduler = makeScheduler();
    scheduler.beginFrame(0);

    expect(scheduler.beginFrame(3 * STEP_MS)).toBe(3);
  });

  it('runs no step for a frame shorter than one step', () => {
    const scheduler = makeScheduler();
    scheduler.beginFrame(0);

    expect(scheduler.beginFrame(STEP_MS - 1)).toBe(0);
  });

  it('carries the leftover time into the following frame', () => {
    // Two frames of 1.5 steps each must add up to three steps, not two. Dropping
    // the remainder would make the simulation run slow at any framerate that is
    // not an exact multiple of the step length.
    const scheduler = makeScheduler();
    scheduler.beginFrame(0);

    expect(scheduler.beginFrame(1.5 * STEP_MS)).toBe(1);
    expect(scheduler.beginFrame(3 * STEP_MS)).toBe(2);
  });

  it('treats a timestamp that moved backwards as no elapsed time', () => {
    const scheduler = makeScheduler();
    scheduler.beginFrame(1000);

    expect(scheduler.beginFrame(500)).toBe(0);
  });

  it('caps the catch-up at the step limit instead of replaying a long stall', () => {
    // Ten seconds of debt is 1000 steps. Running them would freeze the tab for
    // seconds; the scheduler drops the excess and lets the world run in slow
    // motion until frames get cheap again.
    const scheduler = makeScheduler();
    scheduler.beginFrame(0);

    expect(scheduler.beginFrame(10_000)).toBe(MAX_STEPS_PER_FRAME);
  });

  it('does not keep replaying dropped debt on the frames after a stall', () => {
    const scheduler = makeScheduler();
    scheduler.beginFrame(0);
    scheduler.beginFrame(10_000);

    expect(scheduler.beginFrame(10_000 + STEP_MS)).toBe(1);
  });
});

describe('FrameScheduler.discardPendingTime', () => {
  it('drops simulation debt that has not been run yet', () => {
    const scheduler = makeScheduler();
    scheduler.beginFrame(0);
    scheduler.beginFrame(STEP_MS - 1);

    scheduler.discardPendingTime();

    expect(scheduler.beginFrame(2 * STEP_MS - 1)).toBe(0);
  });

  it('restarts the frame clock, so a frozen span does not become a catch-up burst', () => {
    // This is the whole point of the method: the world is frozen during the
    // countdown, on death, and for as long as the game is paused. Without the clock
    // reset the next frame would measure from the last active frame and open the
    // round with a burst — which is why a pause of any length needs no test of its
    // own here. Sixty seconds is already the case this pins.
    const scheduler = makeScheduler();
    scheduler.beginFrame(0);

    scheduler.discardPendingTime();

    expect(scheduler.beginFrame(60_000)).toBe(0);
    expect(scheduler.beginFrame(60_000 + STEP_MS)).toBe(1);
  });
});

describe('FrameScheduler.shouldRenderNow', () => {
  it('draws the very first frame at any target framerate', () => {
    expect(makeScheduler().shouldRenderNow(0, 30)).toBe(true);
  });

  it('never throttles at or above the uncapped target', () => {
    // requestAnimationFrame is already capped by the display refresh rate, so the
    // highest option means "do not throttle" rather than a rate to hit.
    const scheduler = makeScheduler();
    scheduler.markRendered(1000);

    expect(scheduler.shouldRenderNow(1001, UNCAPPED_FPS)).toBe(true);
  });

  it('throttles a frame that arrives too soon for the chosen framerate', () => {
    const scheduler = makeScheduler();
    scheduler.markRendered(1000);

    // 30 FPS wants 33.3 ms between frames; the gate allows TOLERANCE_MS of slack,
    // so 31 ms is still too early and 32 ms is close enough.
    expect(scheduler.shouldRenderNow(1031, 30)).toBe(false);
    expect(scheduler.shouldRenderNow(1032, 30)).toBe(true);
  });

  it('draws again once a full interval has passed', () => {
    const scheduler = makeScheduler();
    scheduler.markRendered(1000);

    expect(scheduler.shouldRenderNow(1100, 30)).toBe(true);
  });

  it('moves the gate forward only when a frame was actually drawn', () => {
    const scheduler = makeScheduler();
    scheduler.markRendered(1000);
    scheduler.shouldRenderNow(1010, 30);

    // Asking does not count as drawing: the gate still measures from 1000.
    expect(scheduler.shouldRenderNow(1031, 30)).toBe(false);

    scheduler.markRendered(1040);
    expect(scheduler.shouldRenderNow(1060, 30)).toBe(false);
  });
});

describe('FrameScheduler.secondsSinceRender', () => {
  it('is zero before anything has been drawn', () => {
    // There is no previous drawn frame to measure against, and the caller needs a number it
    // can hand to an animation without it jumping — not the page's whole uptime.
    expect(makeScheduler().secondsSinceRender(5000)).toBe(0);
  });

  it('reports the wall-clock gap between two drawn frames, in seconds', () => {
    const scheduler = makeScheduler();
    scheduler.markRendered(1000);

    expect(scheduler.secondsSinceRender(1016)).toBeCloseTo(0.016);
  });

  it('measures from the last drawn frame, not the last asked-about one', () => {
    const scheduler = makeScheduler();
    scheduler.markRendered(1000);
    scheduler.shouldRenderNow(1010, 30);
    scheduler.markRendered(1040);

    expect(scheduler.secondsSinceRender(1060)).toBeCloseTo(0.02);
  });

  it('never goes negative on a timestamp that moved backwards', () => {
    const scheduler = makeScheduler();
    scheduler.markRendered(1000);

    expect(scheduler.secondsSinceRender(900)).toBe(0);
  });
});
