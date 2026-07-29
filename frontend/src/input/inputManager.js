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

const DASH_KEY = 'Space';

/**
 * Captures keyboard input and exposes a normalised movement direction plus a
 * one-shot dash request. It does not own player physics, rendering, or
 * simulation state.
 */
export class InputManager {
  constructor() {
    this._pressedKeys = new Set();
    this._dashRequested = false;
    // The dash key is only ours while a round is running. Outside of one the
    // space bar belongs to the menu: every option is a plain button and the
    // developer section is a <details>, all of which are activated with Enter or
    // Space. Swallowing the key there would make the menu unusable by keyboard.
    this._gameplayActive = false;

    window.addEventListener('keydown', (event) => {
      if (event.code === DASH_KEY) {
        this._handleDashKeyDown(event);
        return;
      }

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
      this._dashRequested = false;
    });
  }

  /** Switches the dash key on for a running round and off again afterwards. */
  setGameplayActive(active) {
    this._gameplayActive = active;

    if (!active) {
      this._dashRequested = false;
    }
  }

  /**
   * Returns whether a dash was requested since the last call, and clears the
   * request.
   *
   * The request is latched rather than read as a held key, because a single
   * animation frame can run several simulation steps: asking "is space down"
   * once per step would trigger up to five dashes from one key press.
   */
  consumeDashRequest() {
    const requested = this._dashRequested;
    this._dashRequested = false;

    return requested;
  }

  _handleDashKeyDown(event) {
    if (!this._gameplayActive) return;

    // Without this the space bar would also scroll the page.
    event.preventDefault();

    // Holding the key down repeats the event; only the first press is a dash.
    if (!event.repeat) {
      this._dashRequested = true;
    }
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
