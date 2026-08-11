import { describe, expect, it } from 'vitest';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../../gameConfig.js';
import { fitWorldToCanvas, worldTransformMatrix } from '../worldTransform.js';

/**
 * Canvas sizes that are deliberately not all 16:9 and not all round numbers — the shapes a
 * real window takes while it is being dragged.
 */
const ODD_CANVAS_SIZES = [
  [1920, 1080],
  [3840, 2160],
  [1280, 720],
  [1366, 768],
  [2560, 1080],
  [1080, 1920],
  [1517, 843],
  [640, 1013],
  [4096, 1200],
  [317, 199],
];

/** Fits the real world size, which is what every caller in the game passes. */
function fitTheGameWorld(canvasWidth, canvasHeight) {
  return fitWorldToCanvas(canvasWidth, canvasHeight, WORLD_WIDTH, WORLD_HEIGHT);
}

describe('fitWorldToCanvas', () => {
  it('leaves the world alone on a canvas of exactly its size', () => {
    const view = fitTheGameWorld(WORLD_WIDTH, WORLD_HEIGHT);

    expect(view.scale).toBe(1);
    expect(view.offsetX).toBe(0);
    expect(view.offsetY).toBe(0);
  });

  it('shrinks the world onto a smaller canvas of the same shape without any margin', () => {
    // The case the Playwright suite actually runs at: 1280x720 is exactly 16:9, so the
    // world scales down on both axes at once and there is nothing left over.
    const view = fitTheGameWorld(1280, 720);

    expect(view.scale).toBeCloseTo(720 / WORLD_HEIGHT, 10);
    expect(view.offsetX).toBeCloseTo(0, 10);
    expect(view.offsetY).toBeCloseTo(0, 10);
  });

  it('puts the leftover space of a wide canvas into two equal side margins', () => {
    const canvasWidth = 2560;
    const canvasHeight = 1080;
    const view = fitTheGameWorld(canvasWidth, canvasHeight);

    // Height is the binding axis, so the world reaches top and bottom exactly.
    expect(view.scale).toBeCloseTo(canvasHeight / WORLD_HEIGHT, 10);
    expect(view.offsetY).toBeCloseTo(0, 10);
    expect(view.offsetX).toBeGreaterThan(0);
    // Centred, with no rounding drift: the two margins plus the world are the canvas.
    expect(view.offsetX * 2 + WORLD_WIDTH * view.scale).toBeCloseTo(canvasWidth, 10);
  });

  it('puts the leftover space of a tall canvas into two equal top and bottom margins', () => {
    const canvasWidth = 1080;
    const canvasHeight = 1920;
    const view = fitTheGameWorld(canvasWidth, canvasHeight);

    expect(view.scale).toBeCloseTo(canvasWidth / WORLD_WIDTH, 10);
    expect(view.offsetX).toBeCloseTo(0, 10);
    expect(view.offsetY).toBeGreaterThan(0);
    expect(view.offsetY * 2 + WORLD_HEIGHT * view.scale).toBeCloseTo(canvasHeight, 10);
  });

  it('never stretches the world, whatever shape the canvas is', () => {
    // One scale for both axes is the whole point: a per-axis fit would turn every
    // obstacle capsule into an ellipse. Checking the drawn aspect ratio is what catches
    // an accidental stretch fit, because a single returned `scale` cannot express one.
    const worldAspect = WORLD_WIDTH / WORLD_HEIGHT;

    for (const [canvasWidth, canvasHeight] of ODD_CANVAS_SIZES) {
      const view = fitTheGameWorld(canvasWidth, canvasHeight);
      const drawnWidth = WORLD_WIDTH * view.scale;
      const drawnHeight = WORLD_HEIGHT * view.scale;

      expect(drawnWidth / drawnHeight).toBeCloseTo(worldAspect, 10);
    }
  });

  it('keeps the whole world inside the canvas', () => {
    // A torus world means every threat enters through an edge, so a world that does not
    // fit completely would hide the band the next boid arrives from.
    for (const [canvasWidth, canvasHeight] of ODD_CANVAS_SIZES) {
      const view = fitTheGameWorld(canvasWidth, canvasHeight);

      expect(view.offsetX + WORLD_WIDTH * view.scale).toBeLessThanOrEqual(canvasWidth + 1e-6);
      expect(view.offsetY + WORLD_HEIGHT * view.scale).toBeLessThanOrEqual(canvasHeight + 1e-6);
      expect(view.offsetX).toBeGreaterThanOrEqual(0);
      expect(view.offsetY).toBeGreaterThanOrEqual(0);
    }
  });

  it('survives a canvas of zero width or height', () => {
    // A window mid-minimise reports zero. A scale of 0 would collapse the frame onto a
    // point, and the world-edge hairline divides by the scale, so it would go infinite.
    for (const [canvasWidth, canvasHeight] of [
      [0, 720],
      [1280, 0],
      [0, 0],
    ]) {
      const view = fitTheGameWorld(canvasWidth, canvasHeight);

      expect(view.scale).toBeGreaterThan(0);
      expect(Number.isFinite(view.scale)).toBe(true);
      expect(Number.isFinite(view.offsetX)).toBe(true);
      expect(Number.isFinite(view.offsetY)).toBe(true);
    }
  });

  it('fits a world that is wider than the canvas on one axis only', () => {
    // Narrower than the world but taller than it: width has to bind, and the vertical
    // margins have to be large rather than negative.
    const view = fitTheGameWorld(800, 1400);

    expect(view.scale).toBeCloseTo(800 / WORLD_WIDTH, 10);
    expect(WORLD_HEIGHT * view.scale).toBeLessThan(1400);
    expect(view.offsetY).toBeGreaterThan(0);
  });
});

describe('worldTransformMatrix', () => {
  /** Applies the matrix to a world point the way a canvas would. */
  function project([a, b, c, d, e, f], x, y) {
    return { x: a * x + c * y + e, y: b * x + d * y + f };
  }

  it('scales by the ratio and the fit together', () => {
    const matrix = worldTransformMatrix(2, { scale: 0.75, offsetX: 0, offsetY: 0 });

    expect(matrix[0]).toBeCloseTo(1.5, 10);
    expect(matrix[3]).toBeCloseTo(1.5, 10);
  });

  it('multiplies the offsets by the ratio as well', () => {
    // The part that is easy to get wrong: the offsets come out of `fitWorldToCanvas` in CSS
    // pixels, so leaving them unscaled would place the world a whole margin off on a 2x panel.
    const matrix = worldTransformMatrix(2, { scale: 1, offsetX: 45, offsetY: 90 });

    expect(matrix[4]).toBeCloseTo(90, 10);
    expect(matrix[5]).toBeCloseTo(180, 10);
  });

  it('never shears or rotates', () => {
    const matrix = worldTransformMatrix(1.5, { scale: 0.4, offsetX: 7, offsetY: 3 });

    expect(matrix[1]).toBe(0);
    expect(matrix[2]).toBe(0);
  });

  it('puts the world origin at the top-left corner of the fitted area', () => {
    const view = fitWorldToCanvas(1440, 900, WORLD_WIDTH, WORLD_HEIGHT);
    const matrix = worldTransformMatrix(2, view);
    const origin = project(matrix, 0, 0);

    expect(origin.x).toBeCloseTo(2 * view.offsetX, 10);
    expect(origin.y).toBeCloseTo(2 * view.offsetY, 10);
  });

  it('lands the far corner of the world inside the backing store', () => {
    // 1440x900 CSS at ratio 2 is the 2880x1800 panel this was first measured on. The world is
    // 16:9 and the window 16:10, so the fit binds on width and leaves vertical margins.
    const view = fitWorldToCanvas(1440, 900, WORLD_WIDTH, WORLD_HEIGHT);
    const matrix = worldTransformMatrix(2, view);
    const corner = project(matrix, WORLD_WIDTH, WORLD_HEIGHT);

    expect(corner.x).toBeCloseTo(2880, 6);
    expect(corner.y).toBeLessThan(1800);
    expect(corner.y).toBeCloseTo(1800 - 2 * view.offsetY, 6);
  });

  it('reproduces the composition the renderer used to spell out inline', () => {
    // A regression guard for the extraction: `_applyWorldTransform` carried these six
    // expressions by hand before the baked background needed the same matrix. An odd canvas
    // size and a non-integer ratio, because a mistake in the offset term hides at ratio 1.
    const view = fitWorldToCanvas(1287, 733, WORLD_WIDTH, WORLD_HEIGHT);
    const pixelRatio = 1.25;
    const combinedScale = pixelRatio * view.scale;

    expect(worldTransformMatrix(pixelRatio, view)).toEqual([
      combinedScale,
      0,
      0,
      combinedScale,
      pixelRatio * view.offsetX,
      pixelRatio * view.offsetY,
    ]);
  });
});
