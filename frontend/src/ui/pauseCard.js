/**
 * The pause card. The same card as the game-over one, in amber instead of red: the arena
 * behind it is frozen rather than lost, and the only difference that matters is that this
 * one has a way back into the round.
 *
 * It carries the run's numbers even though the HUD is still on screen, because the scrim
 * covers the HUD — whoever is deciding whether to give up a run has to be able to see what
 * they would be giving up. There is deliberately no record shown next to the score: pausing
 * touches the stored runs in neither direction.
 *
 * Templates only — no state, no event handling, no game logic.
 */

import { t } from './i18n.js';
import { renderRunStats } from './runStats.js';

/**
 * @param {{score: number, wave: number, timeSeconds: number, boids: number}} run - The run
 *   currently on hold, as `runSummary` reports it.
 * @returns {string} HTML for the card and the scrim behind it.
 */
export function renderPauseCard(run) {
  return `
    <div class="card-scrim card-scrim--paused"></div>
    <div class="card card--paused">
      <div>
        <span class="card__kicker">${t('menu.swarmWaits')}</span>
        <h1 class="card__title">${t('menu.paused')}</h1>
      </div>

      <div class="card__result">
        <span class="kicker">${t('hud.score')}</span>
        <p class="card__score-line">
          <span class="card__score">${run.score}</span>
        </p>
      </div>

      ${renderRunStats(run)}

      <div class="card__actions card__actions--stacked">
        <button id="btn-resume" type="button" class="btn-primary">
          <span>${t('menu.resume')}</span>
          <span class="key key--on-primary">Space</span>
        </button>
        <div class="card__actions-row">
          <button id="btn-pause-restart" type="button" class="btn-ghost">
            ${t('menu.restart')}
          </button>
          <button id="btn-pause-menu" type="button" class="btn-ghost">
            ${t('menu.mainMenu')}
          </button>
        </div>
      </div>
    </div>
  `;
}
