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

  /**
   * @param {() => void} onStart
   * @param {{options: number[], selected: number, uncappedValue: number,
   *          onSelect: (fps: number) => void}} targetFpsSetting
   */
  showStart(onStart, targetFpsSetting) {
    const options = targetFpsSetting.options
      .map((fps) => renderTargetFpsOption(fps, targetFpsSetting))
      .join('');

    this._el.innerHTML = `
      <div class="menu-panel">
        <h1>${t('menu.title')}</h1>
        <div class="menu-option-group">
          <span id="fps-group-label" class="menu-option-label">${t('settings.targetFps')}</span>
          <div id="fps-options" class="menu-option-buttons" role="group" aria-labelledby="fps-group-label">
            ${options}
          </div>
          <p class="menu-hint">${t('settings.fpsHint')}</p>
        </div>
        <button id="btn-start" class="menu-button">${t('menu.play')}</button>
      </div>
    `;

    document
      .getElementById('fps-options')
      .addEventListener('click', (event) => {
        const clicked = event.target.closest('.menu-option');
        if (!clicked) return;

        for (const option of document.querySelectorAll('#fps-options .menu-option')) {
          const isSelected = option === clicked;
          option.classList.toggle('is-selected', isSelected);
          option.setAttribute('aria-pressed', String(isSelected));
        }

        targetFpsSetting.onSelect(Number(clicked.dataset.targetFps));
      });

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

/**
 * Renders one framerate choice as a toggle button.
 *
 * Deliberately plain buttons with `aria-pressed` rather than radio inputs or
 * `role="radiogroup"`: InputManager calls preventDefault() on the arrow keys at
 * window level, which would kill native arrow-key navigation and leave a
 * radiogroup broken for keyboard and screen-reader users. Toggle buttons carry
 * no arrow-key expectation and work with Tab plus Enter/Space, none of which
 * the input manager intercepts.
 */
function renderTargetFpsOption(fps, { selected, uncappedValue }) {
  const isSelected = fps === selected;
  // The top option cannot be guaranteed — requestAnimationFrame is capped by the
  // display refresh rate — so it is labelled as "as fast as possible" instead.
  const label = fps >= uncappedValue ? `${fps} (${t('settings.fpsUncapped')})` : `${fps}`;

  return `
    <button type="button"
            class="menu-option${isSelected ? ' is-selected' : ''}"
            data-target-fps="${fps}"
            aria-pressed="${isSelected}"
            aria-label="${label} ${t('settings.fpsUnit')}">${label}</button>
  `;
}
