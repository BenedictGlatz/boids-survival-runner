import { t } from './i18n.js';

/**
 * In-game heads-up display (score, lives, etc.).
 * Reads game state and updates DOM elements — no simulation logic.
 */
export class Hud {
  constructor() {
    this._el = document.createElement('div');
    this._el.id = 'hud';
    document.body.appendChild(this._el);
  }

  update(score, lives) {
    this._el.innerHTML = `
      <span>${t('hud.score')}: ${score}</span>
      <span>${t('hud.lives')}: ${lives}</span>
    `;
  }

  hide() {
    this._el.style.display = 'none';
  }

  show() {
    this._el.style.display = 'flex';
  }
}
