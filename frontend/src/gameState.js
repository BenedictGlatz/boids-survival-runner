/**
 * Finite-state machine for game-flow states.
 * Owns transitions only — no rendering or simulation logic.
 */
export const STATE = Object.freeze({
  MENU: 'menu',
  PLAYING: 'playing',
  GAME_OVER: 'game_over',
});

export class GameState {
  constructor() {
    this.current = STATE.MENU;
  }

  transition(next) {
    this.current = next;
  }

  is(state) {
    return this.current === state;
  }
}
