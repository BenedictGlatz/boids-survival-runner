/**
 * The game-over card. A card rather than a full-screen overlay, so the arena stays
 * visible behind it: the swarm and the obstacles of the moment you died are still there,
 * merely dimmed.
 *
 * Templates only — no state, no event handling, no game logic.
 */

import { t } from './i18n.js';
import { renderRunStats } from './runStats.js';

/**
 * @param {{score: number, wave: number, timeSeconds: number, boids: number}} run - The
 *   round that just ended.
 * @param {?{score: number}} best - The record after this round, or null if none is stored.
 * @returns {string} HTML for the card and the scrim behind it.
 */
export function renderGameOverCard(run, best) {
  return `
    <div class="gameover-scrim"></div>
    <div class="gameover-card">
      <div>
        <span class="gameover-card__kicker">${t('menu.swarmWins')}</span>
        <h1 class="gameover-card__title">${t('menu.gameover')}</h1>
      </div>

      <div class="gameover-card__result">
        <span class="kicker">${t('menu.finalScore')}</span>
        <p class="gameover-card__score-line">
          <span class="gameover-card__score">${run.score}</span>
          ${best ? `<span class="kicker kicker--faint">${t('menu.best')} ${best.score}</span>` : ''}
        </p>
      </div>

      ${renderRunStats(run)}

      <div class="gameover-card__actions">
        <button id="btn-restart" type="button" class="btn-primary">
          <span>${t('menu.restart')}</span>
          <span class="key key--on-primary">Space</span>
        </button>
        <button id="btn-main-menu" type="button" class="btn-ghost">${t('menu.mainMenu')}</button>
      </div>
    </div>
  `;
}
