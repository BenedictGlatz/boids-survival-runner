/**
 * The arena floor, baked once instead of redrawn every frame.
 *
 * Everything in here is constant for as long as the window keeps its size: the void outside
 * the world, the arena surface, both grid lattices and the world edge. It was nevertheless
 * being rebuilt on every single frame — two full-canvas fills and sixty-six stroked lattice
 * segments — which on an integrated GPU is the largest single item in the frame. Baked into
 * an offscreen canvas at device resolution, the whole thing becomes one `drawImage`.
 *
 * Why the result is pixel-identical rather than merely similar: the bake uses the *same*
 * composed transform the visible canvas carries (`worldTransformMatrix`), at the same device
 * size, and is then blitted at the identity transform to `0, 0`. There is no resampling
 * anywhere, so the fractional offsets `fitWorldToCanvas` produces land on exactly the same
 * sub-pixels they land on today.
 *
 * The lazy-build-and-cache shape, including the guard for an environment without `document`,
 * is the one `obstacleLayer.js` already uses for its hatch pattern. The fallback matters for
 * more than tidiness: without it the module would be unusable under Vitest and unusable if a
 * browser ever refuses the second canvas, and a renderer that throws is worse than one that
 * draws the background the slow way.
 */

import { drawArena, drawLetterboxMargins, drawWorldEdge } from './arenaLayer.js';
import { worldTransformMatrix } from './worldTransform.js';

/** The baked arena floor for one canvas size. */
export class ArenaBackground {
  constructor() {
    this._canvas = null;
    this._deviceWidth = 0;
    this._deviceHeight = 0;
  }

  /**
   * Bakes the background for a canvas of the given device size and world placement.
   *
   * Called from `resize`, which is the only moment any of its inputs can change. Rebuilding
   * unconditionally rather than comparing the arguments: a resize is rare, and a cache that
   * decides for itself whether it is stale is a bug waiting for the one input somebody forgets
   * to include in the comparison.
   * @param {number} deviceWidth - Canvas backing-store width in device pixels.
   * @param {number} deviceHeight - Canvas backing-store height in device pixels.
   * @param {number} pixelRatio - Device pixels per CSS pixel.
   * @param {{scale: number, offsetX: number, offsetY: number}} view - From `fitWorldToCanvas`.
   * @returns {boolean} Whether a baked image is available. `false` means callers get the
   *   direct path from `draw`, which produces the same picture at the old cost.
   */
  rebuild(deviceWidth, deviceHeight, pixelRatio, view) {
    this._deviceWidth = deviceWidth;
    this._deviceHeight = deviceHeight;
    this._pixelRatio = pixelRatio;
    this._view = view;
    this._canvas = null;

    // A zero-sized canvas is what a window mid-minimise reports. Baking one would throw, and
    // there is nothing to look at anyway.
    if (typeof document === 'undefined' || deviceWidth <= 0 || deviceHeight <= 0) {
      return false;
    }

    const baked = document.createElement('canvas');
    baked.width = deviceWidth;
    baked.height = deviceHeight;

    const bakedCtx = baked.getContext('2d');

    if (!bakedCtx || typeof bakedCtx.setTransform !== 'function') {
      return false;
    }

    // Screen space first, for the one thing that has to reach outside the world.
    drawLetterboxMargins(bakedCtx, deviceWidth, deviceHeight);

    const matrix = worldTransformMatrix(pixelRatio, view);
    bakedCtx.setTransform(...matrix);
    drawArena(bakedCtx);
    drawWorldEdge(bakedCtx, view.scale);

    this._canvas = baked;

    return true;
  }

  /**
   * Puts the background on the canvas, in screen space.
   *
   * The blit is opaque and covers the full surface, so it is also the frame's wipe — no
   * `clearRect` is needed before it, and none should be added: clearing a surface that is
   * about to be fully overwritten is a second pass over every pixel for no effect.
   * @param {CanvasRenderingContext2D} ctx - Context with its transform reset to screen space.
   * @param {number} screenWidth - Full canvas width in device pixels.
   * @param {number} screenHeight - Full canvas height in device pixels.
   * @returns {void}
   */
  draw(ctx, screenWidth, screenHeight) {
    if (this._canvas && typeof ctx.drawImage === 'function') {
      ctx.drawImage(this._canvas, 0, 0);

      return;
    }

    // No bake available. Draw the same four things directly — slower, identical result.
    drawLetterboxMargins(ctx, screenWidth, screenHeight);

    if (!this._view || typeof ctx.setTransform !== 'function') {
      return;
    }

    ctx.setTransform(...worldTransformMatrix(this._pixelRatio, this._view));
    drawArena(ctx);
    drawWorldEdge(ctx, this._view.scale);
  }
}
