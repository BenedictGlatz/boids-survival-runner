/**
 * The three-value stat row shared by the personal-best panel and the game-over card, plus
 * the time formatting both of them need.
 *
 * It exists as its own module because the two screens must not disagree about how a run is
 * summarised: same order, same labels, same clock format, whether it is being remembered
 * or just having happened.
 */

import { t } from './i18n.js';

/**
 * Wave, time and boid count of one run, as a row of three columns.
 * @param {{wave: number, timeSeconds: number, boids?: number}} run - The run to summarise.
 * @returns {string} HTML for the stat row.
 */
export function renderRunStats(run) {
  const columns = [
    { label: t('hud.wave'), value: String(run.wave).padStart(2, '0') },
    { label: t('hud.timer'), value: formatDuration(run.timeSeconds) },
    { label: t('hud.boids'), value: String(run.boids ?? 0) },
  ];

  return `
    <div class="stat-row">
      ${columns.map(renderStat).join('')}
    </div>
  `;
}

/**
 * A run's duration as `MM:SS`.
 *
 * Its own function rather than the HUD's: the HUD formats a clock that is running, this
 * formats one that has stopped, and only one of the two may ever be re-seeded.
 * @param {number} totalSeconds - Seconds the run lasted.
 * @returns {string} The duration as `MM:SS`.
 */
export function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds ?? 0));
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (safeSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function renderStat({ label, value }) {
  return `
    <div class="stat">
      <span class="kicker kicker--tight">${label}</span>
      <span class="stat__value">${value}</span>
    </div>
  `;
}
