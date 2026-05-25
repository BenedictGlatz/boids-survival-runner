import { t } from './i18n.js';

/**
 * Start-menu and game-over overlay UI.
 * Mutates the DOM only — no game logic.
 */
export class Menu {
  constructor() {
    this._el = document.createElement('div');
    this._el.id = 'menu-overlay';
    document.body.appendChild(this._el);
  }

  showStart(onStart) {
    this._el.innerHTML = `<button id="btn-start">${t('menu.start')}</button>`;
    document.getElementById('btn-start').addEventListener('click', onStart);
    this._el.style.display = 'flex';
  }

  showGameOver(onRestart) {
    this._el.innerHTML = `
      <p>${t('menu.gameover')}</p>
      <button id="btn-restart">${t('menu.start')}</button>
    `;
    document.getElementById('btn-restart').addEventListener('click', onRestart);
    this._el.style.display = 'flex';
  }

  hide() {
    this._el.style.display = 'none';
  }
}
