import { t } from './i18n.js';

/**
 * Start-menu and game-over overlay UI.
 * Mutates the DOM only — no game logic.
 */
export class Menu {
  constructor(root = document.getElementById('ui-overlay')) {
    this._el = document.createElement('div');
    this._el.id = 'menu-overlay';
    root.appendChild(this._el);
  }

  showStart(onStart) {
    this._el.innerHTML = `
      <div class="menu-panel">
        <h1>${t('menu.title')}</h1>
        <button id="btn-start" class="menu-button">${t('menu.play')}</button>
      </div>
    `;
    document.getElementById('btn-start').addEventListener('click', onStart);
    this._el.style.display = 'flex';
  }

  showGameOver(onRestart, finalScore) {
    this._el.innerHTML = `
      <div class="menu-panel">
        <h1>${t('menu.gameover')}</h1>
        <p>${t('menu.finalScore')}: ${finalScore}</p>
        <button id="btn-restart" class="menu-button">${t('menu.restart')}</button>
      </div>
    `;
    document.getElementById('btn-restart').addEventListener('click', onRestart);
    this._el.style.display = 'flex';
  }

  hide() {
    this._el.style.display = 'none';
  }
}
