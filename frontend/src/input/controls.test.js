import { describe, expect, it } from 'vitest';
import { buildControls } from './controls.js';

// A hand-written stand-in rather than a mocking library: the InputManager surface
// that controls.js touches is two methods, and counting the calls by hand is what
// the interesting test below needs anyway.
function fakeInputManager({ direction = { x: 0, y: 0 }, dashRequests = 0 } = {}) {
  return {
    consumeDashRequestCalls: 0,
    remainingDashRequests: dashRequests,
    getMovementDirection() {
      return direction;
    },
    consumeDashRequest() {
      this.consumeDashRequestCalls += 1;

      // Mirrors the real latch: the request is cleared by reading it.
      if (this.remainingDashRequests > 0) {
        this.remainingDashRequests -= 1;
        return true;
      }

      return false;
    },
  };
}

describe('buildControls', () => {
  it('passes the movement direction through unchanged', () => {
    const input = fakeInputManager({ direction: { x: -1, y: 0.5 } });

    expect(buildControls(input).direction).toEqual({ x: -1, y: 0.5 });
  });

  it('reports a pending dash request', () => {
    const input = fakeInputManager({ dashRequests: 1 });

    expect(buildControls(input).dashRequested).toBe(true);
  });

  it('reports no dash when nothing was pressed', () => {
    expect(buildControls(fakeInputManager()).dashRequested).toBe(false);
  });

  it('consumes the dash request exactly once per call', () => {
    // The load-bearing property. A fixed-timestep frame can run up to five
    // simulation steps, and buildControls runs once per step. Reading the dash as
    // held state instead of consuming a latch would turn one space-bar press into
    // up to five dashes in a single frame.
    const input = fakeInputManager({ dashRequests: 1 });

    buildControls(input);

    expect(input.consumeDashRequestCalls).toBe(1);
  });

  it('gives one key press to exactly one step of a multi-step frame', () => {
    const input = fakeInputManager({ direction: { x: 1, y: 0 }, dashRequests: 1 });

    const steps = [];
    for (let step = 0; step < 5; step += 1) {
      steps.push(buildControls(input).dashRequested);
    }

    expect(steps).toEqual([true, false, false, false, false]);
  });

  it('returns a fresh object per step rather than a shared one', () => {
    // index.js hands this object to the player integrator each step. A reused
    // object would let a later step see the previous step's dash flag.
    const input = fakeInputManager();

    expect(buildControls(input)).not.toBe(buildControls(input));
  });
});
