import { describe, expect, it } from 'vitest';
import { drawObstacles } from '../obstacleLayer.js';
import { OBSTACLE_STRIDE } from '../../gameConfig.js';

// The drawing modules are normally left to the Playwright suite, but this one decodes
// a flat buffer, and a decode is exactly the kind of arithmetic worth asserting on: an
// off-by-one in the stride would draw every obstacle in the wrong place rather than
// failing. A recording stub stands in for the canvas context, so no browser is needed.
//
// The stub deliberately has no `createPattern`, which is the path the module falls back
// to under Node: the hatch pattern needs a real canvas, so here the body is stroked in
// the plain body colour. That makes the hatching itself unobservable in this suite — it
// is checked by eye and by the Playwright pixel probe — while the geometry, the phase
// colours and the opacity, which is what can silently break, stay covered.

function makeContextStub() {
  const calls = [];
  const stub = {
    calls,
    lineCap: '',
    lineWidth: 0,
    strokeStyle: '',
    globalAlpha: 1,
    save: () => calls.push(['save']),
    restore: () => calls.push(['restore']),
    beginPath: () => calls.push(['beginPath']),
    moveTo: (x, y) => calls.push(['moveTo', x, y]),
    lineTo: (x, y) => calls.push(['lineTo', x, y]),
    stroke: () =>
      calls.push(['stroke', stub.lineWidth, stub.strokeStyle, stub.lineCap, stub.globalAlpha]),
  };

  return stub;
}

/**
 * A frame holding obstacles built from
 * `[startX, startY, endX, endY, radius, renderPhase, hitFlash]`. A shorter array leaves
 * the values it omits at zero, so an obstacle nobody hit is written without a flash.
 */
function frameWith(...obstacles) {
  const buffer = new Float32Array(obstacles.length * OBSTACLE_STRIDE);
  obstacles.forEach((obstacle, index) => buffer.set(obstacle, index * OBSTACLE_STRIDE));

  return { obstacleCount: obstacles.length, obstacles: buffer };
}

/** Half of a fresh obstacle's life gone, so neither fade window is in the way. */
const SOLID = 0.5;
/** Inside the closing fade window (`OBSTACLE_FADE_SHARE` is 0.06), halfway through it. */
const EXPIRING = 0.03;
/**
 * Halfway through the engine's arming window: the render phase is negative for as long
 * as an obstacle is still materialising, and -0.5 is halfway along that ramp.
 */
const SPAWNING = -0.5;

/** Wide enough for the darkened core, and thin enough to lose it. */
const THICK_RADIUS = 30;
const THIN_RADIUS = 6;

function movesOf(ctx) {
  return ctx.calls.filter(([name]) => name === 'moveTo');
}

function strokesOf(ctx) {
  return ctx.calls.filter(([name]) => name === 'stroke');
}

function widthsOf(ctx) {
  return strokesOf(ctx).map(([, lineWidth]) => lineWidth);
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

    drawObstacles(ctx, frameWith([100, 200, 400, 200, THICK_RADIUS, SOLID]));

    expect(ctx.lineCap).toBe('round');
    expect(movesOf(ctx)[0]).toEqual(['moveTo', 100, 200]);
    expect(widthsOf(ctx)[0]).toBe(THICK_RADIUS * 2);
  });

  it('draws a circle through the same path as a bar', () => {
    // A circle is a capsule whose centre line has zero length. The round line cap is
    // what turns it into a circle, so there is no separate shape branch to get wrong.
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([250, 250, 250, 250, 40, SOLID]));

    expect(ctx.lineCap).toBe('round');
    expect(widthsOf(ctx)[0]).toBe(80);
    expect(strokesOf(ctx)).toHaveLength(3);
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

  it('draws a body, a narrower core and a thin edge for each obstacle', () => {
    // The three strokes of the "Hazard Tape" look, in that order: the hatched body at
    // full width, a darkened core that leaves the hatching as a band along the rim,
    // and the sharp edge that carries the danger signal.
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([100, 200, 400, 200, THICK_RADIUS, SOLID]));

    const widths = widthsOf(ctx);
    expect(widths).toHaveLength(3);
    expect(widths[0]).toBe(THICK_RADIUS * 2);
    expect(widths[1]).toBeLessThan(widths[0]);
    expect(widths[2]).toBeLessThan(widths[1]);
  });

  it('leaves the core off a bar too thin to carry one', () => {
    // Below the threshold the core would eat the whole body instead of darkening its
    // middle, so a thin bar is body plus edge and nothing else.
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([100, 200, 400, 200, THIN_RADIUS, SOLID]));

    const widths = widthsOf(ctx);
    expect(widths).toHaveLength(2);
    expect(widths[0]).toBe(THIN_RADIUS * 2);
  });

  it('skips an obstacle that has faded out completely', () => {
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([100, 200, 400, 200, THICK_RADIUS, 0]));

    expect(strokesOf(ctx)).toHaveLength(0);
  });

  it('draws a fading obstacle more faintly than a solid one', () => {
    // The body is stroked with a pattern, which carries no opacity of its own, so its
    // fade travels in globalAlpha. Everything else fades through the colour tables.
    const solid = makeContextStub();
    const fading = makeContextStub();

    drawObstacles(solid, frameWith([100, 200, 400, 200, THICK_RADIUS, SOLID]));
    drawObstacles(fading, frameWith([100, 200, 400, 200, THICK_RADIUS, 0.01]));

    const bodyAlpha = (ctx) => strokesOf(ctx)[0][4];
    expect(bodyAlpha(fading)).toBeLessThan(bodyAlpha(solid));
    expect(strokesOf(fading)[2][2]).not.toBe(strokesOf(solid)[2][2]);
  });

  it('strokes a red edge while an obstacle is live and an amber one while it expires', () => {
    // Amber is the colour of a temporary state everywhere in this game, so an obstacle
    // about to disappear has to leave red rather than merely getting fainter.
    const live = makeContextStub();
    const expiring = makeContextStub();

    drawObstacles(live, frameWith([100, 200, 400, 200, THICK_RADIUS, SOLID]));
    drawObstacles(expiring, frameWith([100, 200, 400, 200, THICK_RADIUS, EXPIRING]));

    expect(strokesOf(live)[2][2]).toContain('rgba(240, 90, 110');
    expect(strokesOf(expiring)[2][2]).toContain('rgba(251, 191, 36');
  });

  it('runs a ring wider than the body while an obstacle appears', () => {
    // The halo is what makes a new obstacle land instead of fading in. It is the same
    // capsule geometry, only thicker, so it must be wider than the body it announces.
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([100, 200, 400, 200, THICK_RADIUS, SPAWNING]));

    const widths = widthsOf(ctx);
    expect(widths).toHaveLength(5);
    expect(widths[0]).toBeGreaterThan(THICK_RADIUS * 2);
  });

  it('draws no spawn ring for a solid obstacle at the start of its life', () => {
    // The guard on the phase itself: a render phase just under 1 used to mean "appearing"
    // and now means "solid and fresh". Announcing this one would put the halo on an
    // obstacle that already costs a life, and take it off the window that does not.
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([100, 200, 400, 200, THICK_RADIUS, 1]));

    expect(widthsOf(ctx)).toHaveLength(3);
    expect(widthsOf(ctx)[0]).toBe(THICK_RADIUS * 2);
  });

  it('draws no extra strokes for an obstacle nobody hit', () => {
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([100, 200, 400, 200, THICK_RADIUS, SOLID, 0]));

    expect(strokesOf(ctx)).toHaveLength(3);
  });

  it('draws a red flash with a white edge over an obstacle the player just hit', () => {
    // The signal that the hit registered. It goes on top of the ordinary three strokes.
    // The edge is white on purpose: the edge underneath is already red, so a red rim
    // would be invisible exactly where it matters.
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([100, 200, 400, 200, THICK_RADIUS, SOLID, 1]));

    const strokes = strokesOf(ctx);
    expect(strokes).toHaveLength(5);
    // Red, and at the full diameter like the body it covers.
    expect(strokes[3][2]).toContain('rgba(220, 38, 38');
    expect(strokes[3][1]).toBe(THICK_RADIUS * 2);
    expect(strokes[4][2]).toContain('rgba(255, 255, 255');
  });

  it('draws a flash that has almost faded more faintly than a fresh one', () => {
    const fresh = makeContextStub();
    const fading = makeContextStub();

    drawObstacles(fresh, frameWith([100, 200, 400, 200, THICK_RADIUS, SOLID, 1]));
    drawObstacles(fading, frameWith([100, 200, 400, 200, THICK_RADIUS, SOLID, 0.1]));

    expect(strokesOf(fading)[3][2]).not.toBe(strokesOf(fresh)[3][2]);
  });

  it('leaves the context state it found', () => {
    // lineCap and lineWidth are shared with every other draw helper, and the boids are
    // drawn straight after — a leaked round cap would change how they look.
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([100, 200, 400, 200, THICK_RADIUS, SOLID]));

    expect(ctx.calls[0]).toEqual(['save']);
    expect(ctx.calls[ctx.calls.length - 1]).toEqual(['restore']);
  });

  it('resets the opacity it raised for the body', () => {
    // globalAlpha is context state like lineCap: leaving it below 1 would fade the
    // boids and the player drawn after this layer.
    const ctx = makeContextStub();

    drawObstacles(ctx, frameWith([100, 200, 400, 200, THICK_RADIUS, 0.01]));

    expect(ctx.globalAlpha).toBe(1);
  });
});
