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
    // No keyboard input is ours outside a round. The space bar belongs to the menu,
    // where every row and every option is a plain button activated with Enter or
    // Space, and the arrow keys belong to the menu list, whose footer promises that
    // they navigate. Swallowing either there would make the menu unusable by keyboard.
    this._gameplayActive = false;

    window.addEventListener('keydown', (event) => {
      if (event.code === DASH_KEY) {
        this._handleDashKeyDown(event);
        return;
      }

      if (!this._gameplayActive || !MOVEMENT_KEYS.has(event.code)) return;

      event.preventDefault();
      this._pressedKeys.add(event.code);
    });

    window.addEventListener('keyup', (event) => {
      if (!MOVEMENT_KEYS.has(event.code)) return;

      // Not gated on the round: a key pressed during a round and released after it
      // ended has to be forgotten, or it would still count as held next round.
      event.preventDefault();
      this._pressedKeys.delete(event.code);
    });

    window.addEventListener('blur', () => {
      this._pressedKeys.clear();
      this._dashRequested = false;
    });
  }

  /**
   * @param {boolean} active - Whether a round is currently running.
   * @returns {void}
   */
  setGameplayActive(active) {
    this._gameplayActive = active;

    if (!active) {
      // Both are dropped, so a key still held when the round ends cannot carry into
      // the menu or into the next round.
      this._pressedKeys.clear();
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
   * @returns {boolean} Whether a dash was requested.
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

  /** @returns {{x: number, y: number}} A unit-length direction vector, or zero if idle. */
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
