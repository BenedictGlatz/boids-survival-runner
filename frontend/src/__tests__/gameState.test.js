import { describe, expect, it } from 'vitest';
import { GameState, STATE } from '../gameState.js';

describe('STATE', () => {
  it('is frozen, so a typo cannot quietly add a state', () => {
    // Every caller compares against these values. A state that exists in one
    // module but not in the machine would read as "not playing" everywhere and
    // silently stop the loop instead of failing loudly.
    expect(Object.isFrozen(STATE)).toBe(true);
  });

  it('gives every state a value of its own', () => {
    // The failure mode when a state is added by copying a neighbour. `transition`
    // validates nothing, so two states sharing a string would make `is()` answer true
    // for both of them and never throw — the loop would render a paused round as a
    // finished one, or the other way round.
    const values = Object.values(STATE);

    expect(new Set(values).size).toBe(values.length);
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

  it('holds a round and lets it go again', () => {
    // The pause cycle. Nothing here enforces that PAUSED is only reachable from
    // PLAYING — that lives in the two guards in `index.js` — but the round has to
    // survive the round trip and come back as the same state it left.
    const state = new GameState();

    state.transition(STATE.PLAYING);
    state.transition(STATE.PAUSED);

    expect(state.is(STATE.PAUSED)).toBe(true);
    expect(state.is(STATE.PLAYING)).toBe(false);

    state.transition(STATE.PLAYING);

    expect(state.is(STATE.PLAYING)).toBe(true);
  });

  it('leaves a held round for the menu without passing through game over', () => {
    // Giving up a paused run is its own way out of a round, and the only one that
    // stores nothing.
    const state = new GameState();

    state.transition(STATE.PLAYING);
    state.transition(STATE.PAUSED);
    state.transition(STATE.MENU);

    expect(state.current).toBe(STATE.MENU);
  });

  it('gives every instance its own state', () => {
    const first = new GameState();
    const second = new GameState();

    first.transition(STATE.PLAYING);

    expect(second.current).toBe(STATE.MENU);
  });
});
