import { describe, expect, it } from 'vitest';
import { DASH_AIM_STRIDE } from '../gameConfig.js';
import { drawDashAimLines } from './dashAimLayer.js';

// Drawing modules are normally left to the Playwright suite, but this one decodes a flat
// buffer, and a decode is worth asserting on: an off-by-one in the stride would draw every
// warning line from the wrong place to the wrong place rather than failing. A recording stub
// stands in for the canvas context, so no browser and no built WASM package are needed.
//
// What is asserted is the geometry and the state hygiene. The colour and the exact dash
// pattern are look, and the look is allowed to change — the line ending where the engine says
// the dash ends is not.

function makeContextStub() {
  const calls = [];
  const stub = {
    calls,
    lineWidth: 0,
    strokeStyle: '',
    setLineDash: (pattern) => calls.push(['setLineDash', pattern]),
    save: () => calls.push(['save']),
    restore: () => calls.push(['restore']),
    beginPath: () => calls.push(['beginPath']),
    moveTo: (x, y) => calls.push(['moveTo', x, y]),
    lineTo: (x, y) => calls.push(['lineTo', x, y]),
    stroke: () => calls.push(['stroke', stub.lineWidth, stub.strokeStyle]),
  };

  return stub;
}

/** A frame holding aim lines built from `[startX, startY, endX, endY, chargeProgress]`. */
function frameWith(...lines) {
  const buffer = new Float32Array(lines.length * DASH_AIM_STRIDE);
  lines.forEach((line, index) => buffer.set(line, index * DASH_AIM_STRIDE));

  return { dashAimCount: lines.length, dashAims: buffer };
}

/** Every segment the module put on the context, as `[startX, startY, endX, endY]`. */
function segmentsOf(stub) {
  const segments = [];

  for (let index = 0; index < stub.calls.length; index += 1) {
    if (stub.calls[index][0] !== 'moveTo') continue;

    const [, startX, startY] = stub.calls[index];
    const [, endX, endY] = stub.calls[index + 1];
    segments.push([startX, startY, endX, endY]);
  }

  return segments;
}

describe('drawDashAimLines', () => {
  it('draws nothing while nobody is charging', () => {
    // By far the most common frame: the buffer is empty except in the half second before a
    // lunge, and empty entirely below wave three.
    const stub = makeContextStub();

    drawDashAimLines(stub, { dashAimCount: 0, dashAims: new Float32Array() });

    expect(stub.calls).toEqual([]);
  });

  it('draws nothing when the engine sent no buffer at all', () => {
    const stub = makeContextStub();

    drawDashAimLines(stub, {});

    expect(stub.calls).toEqual([]);
  });

  it('draws each line from its own start to its own end', () => {
    // The assertion that catches a wrong stride: read five values apart the second line is
    // its own, read four apart it starts in the middle of the first.
    const stub = makeContextStub();

    drawDashAimLines(stub, frameWith([100, 200, 300, 400, 0.5], [900, 800, 700, 600, 0.5]));

    expect(segmentsOf(stub)).toEqual([
      [100, 200, 300, 400],
      [900, 800, 700, 600],
    ]);
  });

  it('draws one line per charging boid', () => {
    // A whole dash group charges together — up to six of them, all announcing the same
    // strike — so the layer has to survive more than one entry.
    const stub = makeContextStub();
    const lines = [
      [100, 100, 300, 100, 0.2],
      [120, 140, 320, 140, 0.2],
      [140, 180, 340, 180, 0.2],
    ];

    drawDashAimLines(stub, frameWith(...lines));

    expect(stub.calls.filter((call) => call[0] === 'stroke')).toHaveLength(lines.length);
  });

  it('brackets its work in save/restore so it cannot leak state', () => {
    // Not optional here: the dash pattern is part of the canvas drawing state, so a leak
    // would break up the boid outlines and the player's own circle drawn after this layer.
    const stub = makeContextStub();

    drawDashAimLines(stub, frameWith([100, 200, 300, 400, 0.5]));

    expect(stub.calls[0]).toEqual(['save']);
    expect(stub.calls[stub.calls.length - 1]).toEqual(['restore']);
  });

  it('strokes a dashed pattern rather than a solid line', () => {
    const stub = makeContextStub();

    drawDashAimLines(stub, frameWith([100, 200, 300, 400, 0.5]));

    const [, pattern] = stub.calls.find((call) => call[0] === 'setLineDash');

    expect(pattern.length).toBeGreaterThan(1);
    expect(Math.min(...pattern)).toBeGreaterThan(0);
  });

  it('sets the dash pattern once for the whole layer', () => {
    // Per line it would be three redundant state changes per frame for an identical result.
    const stub = makeContextStub();

    drawDashAimLines(stub, frameWith([1, 1, 2, 2, 0.3], [3, 3, 4, 4, 0.3], [5, 5, 6, 6, 0.3]));

    expect(stub.calls.filter((call) => call[0] === 'setLineDash')).toHaveLength(1);
  });

  it('draws a line more strongly the closer the lunge is', () => {
    const early = makeContextStub();
    const late = makeContextStub();

    drawDashAimLines(early, frameWith([100, 200, 300, 400, 0.05]));
    drawDashAimLines(late, frameWith([100, 200, 300, 400, 0.95]));

    const alphaOf = (stub) => {
      const [, , colour] = stub.calls.find((call) => call[0] === 'stroke');

      return Number(colour.match(/([\d.]+)\)$/)[1]);
    };

    expect(alphaOf(late)).toBeGreaterThan(alphaOf(early));
  });

  it('never builds a colour string of its own while drawing', () => {
    // The tell that the precomputed shade table is being used: two lines at the same
    // progress have to be handed the very same string object, not two equal ones.
    const stub = makeContextStub();

    drawDashAimLines(stub, frameWith([1, 1, 2, 2, 0.4], [3, 3, 4, 4, 0.4]));

    const colours = stub.calls.filter((call) => call[0] === 'stroke').map((call) => call[2]);

    expect(colours[0]).toBe(colours[1]);
  });
});
