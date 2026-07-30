import { describe, expect, it } from 'vitest';
import { drawObstacles } from './obstacleLayer.js';
import { OBSTACLE_STRIDE } from '../gameConfig.js';

// The drawing modules are normally left to the Playwright suite, but this one decodes
// a flat buffer, and a decode is exactly the kind of arithmetic worth asserting on: an
// off-by-one in the stride would draw every obstacle in the wrong place rather than
// failing. A recording stub stands in for the canvas context, so no browser is needed.

function makeContextStub() {
  const calls = [];
  const stub = {
    calls,
    lineCap: '',
    lineWidth: 0,
    strokeStyle: '',
    save: () => calls.push(['save']),
    restore: () => calls.push(['restore']),
    beginPath: () => calls.push(['beginPath']),
    moveTo: (x, y) => calls.push(['moveTo', x, y]),
    lineTo: (x, y) => calls.push(['lineTo', x, y]),
    stroke: () => calls.push(['stroke', stub.lineWidth, stub.strokeStyle, stub.lineCap]),
  };

  return stub;
}

/**
 * A frame holding obstacles built from
 * `[startX, startY, endX, endY, radius, life, hitFlash]`. A shorter array leaves the
 * values it omits at zero, so an obstacle nobody hit is written without a flash.
 */
function frameWith(...obstacles) {
  const buffer = new Float32Array(obstacles.length * OBSTACLE_STRIDE);
  obstacles.forEach((obstacle, index) => buffer.set(obstacle, index * OBSTACLE_STRIDE));

  return { obstacleCount: obstacles.length, obstacles: buffer };
}

/** Half of a fresh obstacle's life gone, so the fade is out of the way. */
const SOLID = 0.5;

function movesOf(ctx) {
  return ctx.calls.filter(([name]) => name === 'moveTo');
}

function strokesOf(ctx) {
  return ctx.calls.filter(([name]) => name === 'stroke');
}

describe('drawObstacles', () => {
  it('draws nothing when the frame holds no obstacles', () => {
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith());

    expect(ctx.calls).toEqual([]);
  });

  it('draws nothing when the buffer is missing entirely', () => {
    // The menu and game-over screens render an empty frame, so this is the path taken
    // whenever no round is running.
    const ctx = makeContextStub();

    drawObstacles(ctx, { obstacleCount: 0, obstacles: undefined });

    expect(ctx.calls).toEqual([]);
  });

  it('reads each obstacle from its own slice of the buffer', () => {
    // The assertion that catches a wrong stride: with two obstacles packed back to
    // back, an off-by-one would read the second one's coordinates from the first.
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([100, 110, 200, 210, 15, SOLID], [300, 310, 400, 410, 25, SOLID]));

    const moves = movesOf(ctx);
    expect(moves).toContainEqual(['moveTo', 100, 110]);
    expect(moves).toContainEqual(['moveTo', 300, 310]);
  });

  it('strokes a bar along its centre line at twice the radius', () => {
    // The body is one thick round-capped stroke rather than an outlined shape, so the
    // line width has to be the full diameter.
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([100, 200, 400, 200, 30, SOLID]));

    expect(ctx.lineCap).toBe('round');
    expect(movesOf(ctx)[0]).toEqual(['moveTo', 100, 200]);
    expect(strokesOf(ctx)[0][1]).toBe(60);
  });

  it('draws a circle through the same path as a bar', () => {
    // A circle is a capsule whose centre line has zero length. The round line cap is
    // what turns it into a circle, so there is no separate shape branch to get wrong.
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([250, 250, 250, 250, 40, SOLID]));

    expect(ctx.lineCap).toBe('round');
    expect(strokesOf(ctx)[0][1]).toBe(80);
    expect(strokesOf(ctx)).toHaveLength(2);
  });

  it('gives a zero-length line two distinct endpoints so it actually paints', () => {
    // Some canvas implementations skip a lineTo back to the starting point, which
    // would silently drop every circular obstacle.
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([250, 250, 250, 250, 40, SOLID]));

    const [, lineToX, lineToY] = ctx.calls.find(([name]) => name === 'lineTo');
    expect(lineToX).not.toBe(250);
    expect(lineToX).toBeCloseTo(250, 1);
    expect(lineToY).toBe(250);
  });

  it('draws a body and a thinner rim for each obstacle', () => {
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([100, 200, 400, 200, 30, SOLID]));

    const strokes = strokesOf(ctx);
    expect(strokes).toHaveLength(2);
    expect(strokes[1][1]).toBeLessThan(strokes[0][1]);
  });

  it('skips an obstacle that has faded out completely', () => {
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([100, 200, 400, 200, 30, 0]));

    expect(strokesOf(ctx)).toHaveLength(0);
  });

  it('draws a fading obstacle more faintly than a solid one', () => {
    const solid = makeContextStub();
    const fading = makeContextStub();

    drawObstacles(solid, frameWith([100, 200, 400, 200, 30, SOLID]));
    drawObstacles(fading, frameWith([100, 200, 400, 200, 30, 0.01]));

    expect(strokesOf(fading)[0][2]).not.toBe(strokesOf(solid)[0][2]);
  });

  it('draws no extra strokes for an obstacle nobody hit', () => {
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([100, 200, 400, 200, 30, SOLID, 0]));

    expect(strokesOf(ctx)).toHaveLength(2);
  });

  it('draws a red flash over an obstacle the player just hit', () => {
    // The signal that the hit registered. It goes on top of the ordinary body and rim,
    // so a hit obstacle is drawn four times rather than twice.
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([100, 200, 400, 200, 30, SOLID, 1]));

    const strokes = strokesOf(ctx);
    expect(strokes).toHaveLength(4);
    // Red, and at the full diameter like the body it covers.
    expect(strokes[2][2]).toContain('rgba(220, 38, 38');
    expect(strokes[2][1]).toBe(60);
  });

  it('draws a flash that has almost faded more faintly than a fresh one', () => {
    const fresh = makeContextStub();
    const fading = makeContextStub();

    drawObstacles(fresh, frameWith([100, 200, 400, 200, 30, SOLID, 1]));
    drawObstacles(fading, frameWith([100, 200, 400, 200, 30, SOLID, 0.1]));

    expect(strokesOf(fading)[2][2]).not.toBe(strokesOf(fresh)[2][2]);
  });

  it('leaves the context state it found', () => {
    // lineCap and lineWidth are shared with every other draw helper, and the boids are
    // drawn straight after — a leaked round cap would change how they look.
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([100, 200, 400, 200, 30, SOLID]));

    expect(ctx.calls[0]).toEqual(['save']);
    expect(ctx.calls[ctx.calls.length - 1]).toEqual(['restore']);
  });
});
