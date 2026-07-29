import { describe, expect, it } from 'vitest';
import { GameState, STATE } from './gameState.js';

describe('STATE', () => {
  it('is frozen, so a typo cannot quietly add a fourth state', () => {
    // Every caller compares against these values. A state that exists in one
    // module but not in the machine would read as "not playing" everywhere and
    // silently stop the loop instead of failing loudly.
    expect(Object.isFrozen(STATE)).toBe(true);
  });

  it('refuses an overwrite loudly rather than silently', () => {
    // ES modules are strict mode, so writing to the frozen object throws instead
    // of being ignored. A mistake here fails at the line that made it.
    expect(() => {
      STATE.MENU = 'something-else';
    }).toThrow(TypeError);
    expect(STATE.MENU).toBe('menu');
  });
});

describe('GameState', () => {
  it('starts in the menu', () => {
    expect(new GameState().current).toBe(STATE.MENU);
  });

  it('reports the state it is in', () => {
    const state = new GameState();

    expect(state.is(STATE.MENU)).toBe(true);
    expect(state.is(STATE.PLAYING)).toBe(false);
  });

  it('moves to the state it is told to move to', () => {
    const state = new GameState();

    state.transition(STATE.PLAYING);

    expect(state.current).toBe(STATE.PLAYING);
    expect(state.is(STATE.PLAYING)).toBe(true);
    expect(state.is(STATE.MENU)).toBe(false);
  });

  it('walks the whole round cycle back to a new round', () => {
    const state = new GameState();

    state.transition(STATE.PLAYING);
    state.transition(STATE.GAME_OVER);
    state.transition(STATE.PLAYING);

    expect(state.current).toBe(STATE.PLAYING);
  });

  it('gives every instance its own state', () => {
    const first = new GameState();
    const second = new GameState();

    first.transition(STATE.PLAYING);

    expect(second.current).toBe(STATE.MENU);
  });
});
