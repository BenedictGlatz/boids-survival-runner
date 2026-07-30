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

  /**
   * @param {object} frame - Data returned from the WASM engine tick.
   * @param {{x: number, y: number}} playerPosition - Current player position.
   * @param {object} [renderState] - HUD-adjacent state (lives, dash cooldown, countdown, ...).
   */
  drawFrame(frame, playerPosition, renderState = {}) {
    this._impl.drawFrame(frame, playerPosition, renderState);
  }

  /**
   * Leaves the canvas transparent, so whatever sits behind it shows through.
   * @returns {void}
   */
  clear() {
    this._impl.clear();
  }

  /**
   * Drops every dash trail, so a new round starts without the previous one's ribbons.
   * @returns {void}
   */
  resetTrails() {
    this._impl.resetTrails();
  }

  /**
   * @param {number} width - CSS pixels.
   * @param {number} height - CSS pixels.
   */
  resize(width, height) {
    this._impl.resize(width, height);
  }
}
