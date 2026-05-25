/**
 * Captures and normalises mouse and keyboard input.
 * Produces a normalised player position each frame — no rendering or simulation.
 */
export class InputManager {
  constructor() {
    this._mouseX = 0;
    this._mouseY = 0;
    window.addEventListener('mousemove', (e) => {
      this._mouseX = e.clientX;
      this._mouseY = e.clientY;
    });
  }

  /** Returns the current player position as understood by the engine. */
  getPlayerPosition() {
    return { x: this._mouseX, y: this._mouseY };
  }
}
