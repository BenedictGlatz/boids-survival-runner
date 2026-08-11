import { describe, expect, it } from 'vitest';
import { drawSpawnMarkers } from '../spawnMarkerLayer.js';
import { SPAWN_MARKER_RADIUS, SPAWN_MARKER_STRIDE } from '../../gameConfig.js';

// Drawing modules are normally left to the Playwright suite, but this one decodes a flat
// buffer, and a decode is exactly the kind of arithmetic worth asserting on: an off-by-one
// in the stride would draw every marker in the wrong place rather than failing. A recording
// stub stands in for the canvas context, so no browser is needed.
//
// What is deliberately *not* asserted on is the look — the colours and the exact radii are
// a placeholder graphic and are meant to be replaced. The geometry, the stride and the
// direction the ring travels in are what a redesign must not silently break.

function makeContextStub() {
  const calls = [];
  const stub = {
    calls,
    lineWidth: 0,
    strokeStyle: '',
    fillStyle: '',
    save: () => calls.push(['save']),
    restore: () => calls.push(['restore']),
    beginPath: () => calls.push(['beginPath']),
    arc: (x, y, radius) => calls.push(['arc', x, y, radius]),
    fill: () => calls.push(['fill', stub.fillStyle]),
    stroke: () => calls.push(['stroke', stub.lineWidth, stub.strokeStyle]),
  };

  return stub;
}

/** A frame holding markers built from `[x, y, warningProgress]`. */
function frameWith(...markers) {
  const buffer = new Float32Array(markers.length * SPAWN_MARKER_STRIDE);
  markers.forEach((marker, index) => buffer.set(marker, index * SPAWN_MARKER_STRIDE));

  return { spawnMarkerCount: markers.length, spawnMarkers: buffer };
}

/** Every circle the module put on the context, in order. */
function arcsOf(stub) {
  return stub.calls.filter((call) => call[0] === 'arc');
}

describe('drawSpawnMarkers', () => {
  it('draws nothing when no wave is announced', () => {
    // The ordinary frame: a wave is only pending for about two of the thirty seconds
    // between waves, so this path runs far more often than the other one.
    const stub = makeContextStub();

    drawSpawnMarkers(stub, { spawnMarkerCount: 0, spawnMarkers: new Float32Array() }, 0);

    expect(stub.calls).toEqual([]);
  });

  it('draws nothing when the engine sent no buffer at all', () => {
    const stub = makeContextStub();

    drawSpawnMarkers(stub, {}, 0);

    expect(stub.calls).toEqual([]);
  });

  it('decodes each marker at its own position', () => {
    // The assertion that catches a wrong stride: with the marker count and the stride out
    // of step, the second marker would be read from the middle of the first.
    const stub = makeContextStub();

    drawSpawnMarkers(stub, frameWith([10, 500, 0.5], [1910, 200, 0.5]), 0);

    const positions = arcsOf(stub).map((call) => [call[1], call[2]]);

    expect(positions).toContainEqual([10, 500]);
    expect(positions).toContainEqual([1910, 200]);
  });

  it('draws every marker in the buffer', () => {
    const stub = makeContextStub();
    const markers = [
      [10, 100, 0.2],
      [10, 140, 0.2],
      [10, 180, 0.2],
      [10, 220, 0.2],
    ];

    drawSpawnMarkers(stub, frameWith(...markers), 0);

    // Three circles per marker: the glow, the bright centre dot, and the closing ring.
    expect(arcsOf(stub)).toHaveLength(markers.length * 3);
  });

  it('brackets its work in save/restore so it cannot leak state', () => {
    // The renderer sets a lineWidth and a fillStyle for the layers after this one, and a
    // layer that left its own behind would tint them.
    const stub = makeContextStub();

    drawSpawnMarkers(stub, frameWith([10, 500, 0.5]), 0);

    expect(stub.calls[0]).toEqual(['save']);
    expect(stub.calls[stub.calls.length - 1]).toEqual(['restore']);
  });

  it('draws the ring outside the glow and closing in over the warning', () => {
    // The direction is what the marker says about *when*, so it is worth pinning: a ring
    // that grew would announce an arrival moving away.
    const early = makeContextStub();
    const late = makeContextStub();

    drawSpawnMarkers(early, frameWith([10, 500, 0]), 0);
    drawSpawnMarkers(late, frameWith([10, 500, 0.95]), 0);

    const widestEarly = Math.max(...arcsOf(early).map((call) => call[3]));
    const widestLate = Math.max(...arcsOf(late).map((call) => call[3]));

    expect(widestEarly).toBeGreaterThan(SPAWN_MARKER_RADIUS);
    expect(widestLate).toBeLessThan(widestEarly);
    expect(widestLate).toBeGreaterThanOrEqual(SPAWN_MARKER_RADIUS);
  });

  it('marks the exact spot with a dot smaller than the glow around it', () => {
    // A gate's glows merge into one arc, so the dot is the only thing left that says
    // *exactly* where a boid will appear.
    const stub = makeContextStub();

    drawSpawnMarkers(stub, frameWith([10, 500, 0.5]), 0);

    const radii = arcsOf(stub).map((call) => call[3]);

    expect(Math.min(...radii)).toBeLessThan(SPAWN_MARKER_RADIUS);
  });

  it('beats every marker of a frame together', () => {
    // One flicker per frame rather than per marker: the boids of a gate are announcing
    // the same arrival, so a per-marker phase would break the gate into flickering dots.
    const stub = makeContextStub();

    drawSpawnMarkers(stub, frameWith([10, 100, 0.5], [10, 140, 0.5]), 0.31);

    const fills = stub.calls.filter((call) => call[0] === 'fill').map((call) => call[1]);

    expect(fills[0]).toBe(fills[2]);
    expect(fills[1]).toBe(fills[3]);
  });
});
