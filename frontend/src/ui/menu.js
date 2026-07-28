import { t } from './i18n.js';
import { bindOptionGroup, renderOptionGroup } from './optionGroup.js';
import {
  FRAME_GRAPH_FIXED_SCALES_MS,
  FRAME_GRAPH_MODE,
  FRAME_GRAPH_SCALE_DYNAMIC,
} from '../gameConfig.js';

const FPS_GROUP_ID = 'fps-options';
const FRAME_GRAPH_GROUP_ID = 'frame-graph-options';
const FRAME_GRAPH_MODE_GROUP_ID = 'frame-graph-mode-options';
const FRAME_GRAPH_SCALE_GROUP_ID = 'frame-graph-scale-options';

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
   *          frameGraph: {enabled: boolean, onToggle: (enabled: boolean) => void},
   *          frameGraphMode: {selected: string, onSelect: (mode: string) => void},
   *          frameGraphScale: {selected: number|string,
   *                            onSelect: (scale: number|string) => void}}} settings
   */
  showStart(onStart, settings) {
    this._el.innerHTML = `
      <div class="menu-panel">
        <h1>${t('menu.title')}</h1>
        ${renderTargetFpsGroup(settings.targetFps)}
        ${renderDeveloperSection([
          renderFrameGraphGroup(settings.frameGraph),
          renderFrameGraphModeGroup(settings.frameGraphMode),
          renderFrameGraphScaleGroup(settings.frameGraphScale),
        ])}
        <button id="btn-start" class="menu-button">${t('menu.play')}</button>
      </div>
    `;

    bindOptionGroup(FPS_GROUP_ID, (value) => {
      settings.targetFps.onSelect(Number(value));
    });

    bindOptionGroup(FRAME_GRAPH_GROUP_ID, (value) => {
      settings.frameGraph.onToggle(value === FRAME_GRAPH_ON);
    });

    bindOptionGroup(FRAME_GRAPH_MODE_GROUP_ID, (value) => {
      settings.frameGraphMode.onSelect(value);
    });

    bindOptionGroup(FRAME_GRAPH_SCALE_GROUP_ID, (value) => {
      // The dynamic option is the only non-numeric one; the rest are axis tops
      // in milliseconds and must reach the graph as numbers, not as strings.
      settings.frameGraphScale.onSelect(
        value === FRAME_GRAPH_SCALE_DYNAMIC ? FRAME_GRAPH_SCALE_DYNAMIC : Number(value),
      );
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

/**
 * Wraps the diagnostic settings in a collapsed disclosure, so the start menu
 * opens on the one setting that affects play instead of on a wall of options.
 *
 * A native `<details>` rather than a scripted toggle: it needs no state of its
 * own and stays keyboard- and screen-reader-operable via Enter/Space, neither of
 * which InputManager intercepts.
 *
 * @param {string[]} groups - Rendered option groups, in display order.
 */
function renderDeveloperSection(groups) {
  return `
    <details class="menu-section">
      <summary class="menu-section-summary">${t('settings.developerSettings')}</summary>
      <div class="menu-section-body">
        ${groups.join('')}
      </div>
    </details>
  `;
}

function renderFrameGraphModeGroup({ selected }) {
  return renderOptionGroup({
    id: FRAME_GRAPH_MODE_GROUP_ID,
    label: t('settings.frameTimeGraphMode'),
    hint: t('settings.frameTimeGraphModeHint'),
    options: [
      {
        value: FRAME_GRAPH_MODE.SEPARATE,
        label: t('settings.frameGraphSeparate'),
        selected: selected === FRAME_GRAPH_MODE.SEPARATE,
      },
      {
        value: FRAME_GRAPH_MODE.COMBINED,
        label: t('settings.frameGraphCombined'),
        selected: selected === FRAME_GRAPH_MODE.COMBINED,
      },
    ],
  });
}

function renderFrameGraphScaleGroup({ selected }) {
  const unit = t('perf.milliseconds');
  const fixedOptions = FRAME_GRAPH_FIXED_SCALES_MS.map((scaleMs) => ({
    value: String(scaleMs),
    label: `${scaleMs} ${unit}`,
    selected: scaleMs === selected,
  }));

  return renderOptionGroup({
    id: FRAME_GRAPH_SCALE_GROUP_ID,
    label: t('settings.frameGraphScale'),
    hint: t('settings.frameGraphScaleHint'),
    options: [
      {
        value: FRAME_GRAPH_SCALE_DYNAMIC,
        label: t('settings.frameGraphScaleDynamic'),
        selected: selected === FRAME_GRAPH_SCALE_DYNAMIC,
      },
      ...fixedOptions,
    ],
  });
}
