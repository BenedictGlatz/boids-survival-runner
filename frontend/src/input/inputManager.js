const MOVEMENT_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowLeft',
  'ArrowDown',
  'ArrowRight',
]);

/**
 * Captures keyboard input and exposes a normalised movement direction.
 * It does not own player physics, rendering, or simulation state.
 */
export class InputManager {
  constructor() {
    this._pressedKeys = new Set();

    window.addEventListener('keydown', (event) => {
      if (!MOVEMENT_KEYS.has(event.code)) return;

      event.preventDefault();
      this._pressedKeys.add(event.code);
    });

    window.addEventListener('keyup', (event) => {
      if (!MOVEMENT_KEYS.has(event.code)) return;

      event.preventDefault();
      this._pressedKeys.delete(event.code);
    });

    window.addEventListener('blur', () => {
      this._pressedKeys.clear();
    });
  }

  /** Returns a unit-length direction vector from WASD or arrow-key input. */
  getMovementDirection() {
    const horizontal = movementAxis(
      this._pressedKeys.has('KeyA') || this._pressedKeys.has('ArrowLeft'),
      this._pressedKeys.has('KeyD') || this._pressedKeys.has('ArrowRight'),
    );
    const vertical = movementAxis(
      this._pressedKeys.has('KeyW') || this._pressedKeys.has('ArrowUp'),
      this._pressedKeys.has('KeyS') || this._pressedKeys.has('ArrowDown'),
    );

    const length = Math.hypot(horizontal, vertical);
    if (length === 0) {
      return { x: 0, y: 0 };
    }

    return {
      x: horizontal / length,
      y: vertical / length,
    };
  }
}

function movementAxis(negativePressed, positivePressed) {
  if (negativePressed === positivePressed) {
    return 0;
  }

  return negativePressed ? -1 : 1;
}
