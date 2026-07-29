import { t } from './i18n.js';

/**
 * In-game heads-up display (score, lives, etc.).
 * Reads game state and updates DOM elements — no simulation logic.
 */
export class Hud {
  constructor(root = document.getElementById('ui-overlay')) {
    this._el = document.createElement('div');
    this._el.id = 'hud';
    root.appendChild(this._el);

    this._panels = {
      timer: createPanel('top-center'),
      wave: createPanel('top-right'),
      score: createPanel('bottom-left'),
      boids: createPanel('bottom-right'),
    };

    for (const panel of Object.values(this._panels)) {
      this._el.appendChild(panel);
    }
  }

  /**
   * @param {{timerSeconds: number, wave: number, score: number, entityCount: number}} data -
   *   Current round state to display.
   */
  update(data) {
    this._panels.timer.textContent = `${t('hud.timer')}: ${formatTime(data.timerSeconds)}`;
    this._panels.wave.textContent = `${t('hud.wave')}: ${data.wave}`;
    this._panels.score.textContent = `${t('hud.score')}: ${data.score}`;
    this._panels.boids.textContent = `${t('hud.boids')}: ${data.entityCount}`;
  }

  /** Hides the whole HUD. */
  hide() {
    this._el.style.display = 'none';
  }

  /** Shows the whole HUD. */
  show() {
    this._el.style.display = 'flex';
  }
}

function createPanel(positionClass) {
  const panel = document.createElement('div');
  panel.className = `hud-panel ${positionClass}`;
  return panel;
}

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (safeSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}
