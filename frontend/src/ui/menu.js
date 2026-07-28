import { t } from './i18n.js';
import { bindOptionGroup, renderOptionGroup } from './optionGroup.js';

const FPS_GROUP_ID = 'fps-options';
const FRAME_GRAPH_GROUP_ID = 'frame-graph-options';

/** Raw values of the frametime-graph toggle, as carried in the DOM. */
const FRAME_GRAPH_ON = 'on';
const FRAME_GRAPH_OFF = 'off';

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
   * Settings arrive as one object rather than as positional arguments, so adding
   * a further setting does not keep widening the signature.
   *
   * @param {() => void} onStart
   * @param {{targetFps: {options: number[], selected: number, uncappedValue: number,
   *                      onSelect: (fps: number) => void},
   *          frameGraph: {enabled: boolean, onToggle: (enabled: boolean) => void}}} settings
   */
  showStart(onStart, settings) {
    this._el.innerHTML = `
      <div class="menu-panel">
        <h1>${t('menu.title')}</h1>
        ${renderTargetFpsGroup(settings.targetFps)}
        ${renderFrameGraphGroup(settings.frameGraph)}
        <button id="btn-start" class="menu-button">${t('menu.play')}</button>
      </div>
    `;

    bindOptionGroup(FPS_GROUP_ID, (value) => {
      settings.targetFps.onSelect(Number(value));
    });

    bindOptionGroup(FRAME_GRAPH_GROUP_ID, (value) => {
      settings.frameGraph.onToggle(value === FRAME_GRAPH_ON);
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

function renderFrameGraphGroup({ enabled }) {
  return renderOptionGroup({
    id: FRAME_GRAPH_GROUP_ID,
    label: t('settings.frameTimeGraph'),
    hint: t('settings.frameTimeGraphHint'),
    options: [
      { value: FRAME_GRAPH_OFF, label: t('settings.off'), selected: !enabled },
      { value: FRAME_GRAPH_ON, label: t('settings.on'), selected: enabled },
    ],
  });
}
