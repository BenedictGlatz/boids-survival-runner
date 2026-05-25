import { CanvasRenderer } from './canvasRenderer.js';

/**
 * Renderer abstraction. Delegates to a concrete renderer implementation.
 * Swap `CanvasRenderer` for a WebGL implementation without changing callers.
 */
export class Renderer {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this._impl = new CanvasRenderer(canvas);
  }

  /** @param {object} frame - data returned from the WASM engine tick */
  drawFrame(frame, playerPosition, renderState = {}) {
    this._impl.drawFrame(frame, playerPosition, renderState);
  }

  resize(width, height) {
    this._impl.resize(width, height);
  }
}
