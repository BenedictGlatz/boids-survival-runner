/**
 * Canvas 2D renderer implementation.
 * Responsible only for drawing — no simulation logic.
 */
export class CanvasRenderer {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this.resize(window.innerWidth, window.innerHeight);
  }

  resize(width, height) {
    this._canvas.width = width;
    this._canvas.height = height;
  }

  /** @param {object} frame */
  drawFrame(frame) {
    const ctx = this._ctx;
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    // TODO: draw entities from frame data
  }
}
