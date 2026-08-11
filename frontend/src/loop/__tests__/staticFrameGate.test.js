import { describe, expect, it } from 'vitest';
import { LIVE_FRAME, StaticFrameGate } from '../staticFrameGate.js';

describe('StaticFrameGate', () => {
  it('draws a still picture once and then stops', () => {
    // The whole point: a pause can last minutes, and every frame after the first would
    // rebuild an identical image — lattice, swarm, trails and all.
    const gate = new StaticFrameGate();

    expect(gate.needsDraw('paused')).toBe(true);
    expect(gate.needsDraw('paused')).toBe(false);
    expect(gate.needsDraw('paused')).toBe(false);
  });

  it('draws again when the still picture changes', () => {
    // Dying out of a pause: both states show a frozen arena, but not the same one, and the
    // card above it is a different card.
    const gate = new StaticFrameGate();
    gate.needsDraw('paused');

    expect(gate.needsDraw('gameover')).toBe(true);
    expect(gate.needsDraw('gameover')).toBe(false);
  });

  it('always draws a live frame', () => {
    const gate = new StaticFrameGate();

    for (let frame = 0; frame < 5; frame += 1) {
      expect(gate.needsDraw(LIVE_FRAME)).toBe(true);
    }
  });

  it('redraws a still picture that returns after a live one', () => {
    // Pause, resume, pause again. Without the live frame clearing the latch, the second
    // pause would find its own signature still latched and never repaint — leaving whatever
    // the running round last drew standing under the card.
    const gate = new StaticFrameGate();

    expect(gate.needsDraw('paused')).toBe(true);
    expect(gate.needsDraw(LIVE_FRAME)).toBe(true);
    expect(gate.needsDraw('paused')).toBe(true);
  });

  it('draws once more after being invalidated', () => {
    // A resize changes the picture without changing the state — the one case a signature
    // cannot see.
    const gate = new StaticFrameGate();
    gate.needsDraw('paused');

    gate.invalidate();

    expect(gate.needsDraw('paused')).toBe(true);
    expect(gate.needsDraw('paused')).toBe(false);
  });

  it('does not need a state to have been seen before it can be invalidated', () => {
    const gate = new StaticFrameGate();

    gate.invalidate();

    expect(gate.needsDraw('gameover')).toBe(true);
  });

  it('starts out with nothing latched', () => {
    const gate = new StaticFrameGate();

    expect(gate.needsDraw(LIVE_FRAME)).toBe(true);
    expect(gate.needsDraw('paused')).toBe(true);
  });
});
