/**
 * Finite-state machine for game-flow states.
 * Owns transitions only — no rendering or simulation logic.
 */
export const STATE = Object.freeze({
  MENU: 'menu',
  PLAYING: 'playing',
  // The only state the world returns to PLAYING from, and reachable only from it. That
  // restriction is not enforced here — `transition` deliberately validates nothing — but
  // by the two guards in `index.js` that own the pair of transitions.
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
});

/** Owns the current game-flow state and nothing else. */
export class GameState {
  constructor() {
    this.current = STATE.MENU;
  }

  /** @param {string} next - One of the `STATE` values. */
  transition(next) {
    this.current = next;
  }

  /**
   * @param {string} state - One of the `STATE` values.
   * @returns {boolean} Whether the current state matches.
   */
  is(state) {
    return this.current === state;
  }
}
