import { t } from './i18n.js';
import { bindOptionGroup, renderOptionGroup } from './optionGroup.js';

const FPS_GROUP_ID = 'fps-options';

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
    this._el.innerHTML = `
      <div class="menu-panel">
        <h1>${t('menu.title')}</h1>
        ${renderTargetFpsGroup(targetFpsSetting)}
        <button id="btn-start" class="menu-button">${t('menu.play')}</button>
      </div>
    `;

    bindOptionGroup(FPS_GROUP_ID, (value) => {
      targetFpsSetting.onSelect(Number(value));
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

function renderTargetFpsGroup({ options, selected, uncappedValue }) {
  return renderOptionGroup({
    id: FPS_GROUP_ID,
    label: t('settings.targetFps'),
    hint: t('settings.fpsHint'),
    options: options.map((fps) => {
      // The top option cannot be guaranteed — requestAnimationFrame is capped by
      // the display refresh rate — so it is labelled as "as fast as possible".
      const label = fps >= uncappedValue ? `${fps} (${t('settings.fpsUncapped')})` : `${fps}`;

      return {
        value: String(fps),
        label,
        ariaLabel: `${label} ${t('settings.fpsUnit')}`,
        selected: fps === selected,
      };
    }),
  });
}
