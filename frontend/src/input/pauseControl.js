/**
 * The two things that hold a running round: the Escape key and losing the window focus.
 *
 * Why one listener owns *both* directions rather than pausing here and resuming through the
 * menu's existing Escape handler: both listeners sit on `window` and see the same event, and
 * `ui/menuNavigation.js` gates on the overlay being visible — which the other handler
 * changes synchronously inside that same event. Whichever order they are bound in, the
 * split version breaks. The pause listener first: Escape pauses, the overlay becomes
 * visible, and the menu handler then goes "back" on the card it just opened. The menu
 * listener first: Escape resumes, the overlay is hidden and the state is PLAYING again, and
 * this listener pauses a second time. Both read as a dead key.
 *
 * With one listener the state is read once and acted on once, so the binding order stops
 * mattering. `Menu._goBack()` stays exactly as it is — on the pause card it is a no-op,
 * because a round can only be started from the root view of the menu.
 *
 * Bound at window level and gated on the game state, never on the overlay: this decides a
 * game state, and it has to work while no overlay exists at all. Like `menuNavigation.js`
 * it touches `window` and is therefore covered by the Playwright suite rather than Vitest.
 *
 * It is deliberately not part of `InputManager`. That class documents that no key is its own
 * outside a round, while pause has to be heard in both directions — including while
 * gameplay input is switched off. A latch there would also be cleared by
 * `setGameplayActive(false)`, which is to say by the act of pausing.
 */

import { STATE } from '../gameState.js';

const PAUSE_KEY = 'Escape';

/**
 * Attaches the pause key and the auto-pause on focus loss.
 * @param {import('../gameState.js').GameState} state - Read to decide which way to toggle.
 * @param {{onPause: () => void, onResume: () => void}} handlers - The two transitions.
 * @returns {void}
 */
export function bindPauseControl(state, { onPause, onResume }) {
  window.addEventListener('keydown', (event) => {
    if (event.key !== PAUSE_KEY) {
      return;
    }

    // Holding the key repeats the event. The menu's Escape can ignore that because going
    // back is idempotent; toggling a pause is not, and a held key would otherwise pause and
    // resume at the repeat rate of the keyboard. Same guard as the dash, same reason.
    if (event.repeat) {
      return;
    }

    // Claimed only when this really acts, so Escape in a menu still belongs to the menu.
    if (state.is(STATE.PLAYING)) {
      event.preventDefault();
      onPause();
      return;
    }

    if (state.is(STATE.PAUSED)) {
      event.preventDefault();
      onResume();
    }
  });

  // Leaving the window pauses; coming back does not resume. Whoever returns should see the
  // swarm standing still before it moves again.
  //
  // This is a fix as much as a convenience: without it, a frame arriving after a long
  // absence hands the scheduler the whole span as simulation debt, which is clamped and then
  // spent as a burst of catch-up steps — moving the flock towards a player who was not
  // there to react. `blur` and not `visibilitychange`, because `InputManager` already
  // forgets its held keys on `blur` and the two have to agree on when a round is unattended.
  window.addEventListener('blur', () => {
    if (state.is(STATE.PLAYING)) {
      onPause();
    }
  });
}
