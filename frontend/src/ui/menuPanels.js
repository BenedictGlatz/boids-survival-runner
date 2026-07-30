/**
 * The panels of the Command Deck: the settings groups and the controls legend.
 * Templates only — no state, no event handling, no game logic.
 *
 * A panel is shown in exactly one place at a time. On the start screen the settings sit
 * in the right-hand stack; inside a submenu the group that submenu is about moves into
 * the left column and leaves the stack, so no group is ever rendered twice — which
 * matters, because `bindOptionGroup` finds its group by id.
 */

import { t } from './i18n.js';
import { renderOptionGroup } from './optionGroup.js';
import { formatDuration, renderRunStats } from './runStats.js';
import { FRAME_GRAPH_MODE } from '../gameConfig.js';

export const FPS_GROUP_ID = 'fps-options';
export const FRAME_GRAPH_GROUP_ID = 'frame-graph-options';
export const FRAME_GRAPH_MODE_GROUP_ID = 'frame-graph-mode-options';

/** Raw values of the frametime-graph toggle, as carried in the DOM. */
export const FRAME_GRAPH_ON = 'on';
export const FRAME_GRAPH_OFF = 'off';

/**
 * Wraps a group in a panel surface. Inside the left column a group stands on the deck
 * itself, so the surface is optional.
 * @param {string} body - Markup to place on the panel.
 * @returns {string} HTML for the panel.
 */
export function renderPanel(body) {
  return `<section class="panel">${body}</section>`;
}

/**
 * The personal-best panel: the record score as one large number, the run it was set in,
 * and the most recent run below it.
 *
 * Marked "Local" on purpose — the records live in this browser's storage and nowhere else,
 * and a scoreboard that looks global while being local would be a lie.
 * @param {{best: ?{score: number, wave: number, timeSeconds: number},
 *          last: ?{score: number, wave: number, timeSeconds: number}}} records - Stored runs.
 * @returns {string} HTML for the panel body.
 */
export function renderPersonalBest({ best, last }) {
  if (!best) {
    return `
      <div class="panel__head">
        <span class="kicker">${t('menu.personalBest')}</span>
        <span class="kicker kicker--faint">${t('menu.local')}</span>
      </div>
      <p class="hint">${t('menu.noRuns')}</p>
    `;
  }

  const lastRun = last
    ? `${last.score} · ${t('hud.wave')} ${String(last.wave).padStart(2, '0')}`
    : formatDuration(0);

  return `
    <div class="panel__head">
      <span class="kicker">${t('menu.personalBest')}</span>
      <span class="kicker kicker--faint">${t('menu.local')}</span>
    </div>

    <p class="score-hero">
      <span class="score-hero__value">${best.score}</span>
      <span class="score-hero__unit">${t('menu.points')}</span>
    </p>

    ${renderRunStats(best)}

    <p class="panel__foot">
      <span class="kicker">${t('menu.lastRun')}</span>
      <span class="panel__foot-value">${lastRun}</span>
    </p>
  `;
}

/**
 * The target framerate. The top option cannot be guaranteed — requestAnimationFrame is
 * capped by the display refresh rate — so it is labelled as "as fast as possible".
 * @param {{options: number[], selected: number, uncappedValue: number}} setting - Current
 *   values of the framerate setting.
 * @returns {string} HTML for the group.
 */
export function renderTargetFpsGroup({ options, selected, uncappedValue }) {
  return renderOptionGroup({
    id: FPS_GROUP_ID,
    label: t('settings.targetFps'),
    hint: t('settings.fpsHint'),
    options: options.map((fps) => {
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

/**
 * The frametime graph's on/off switch.
 * @param {{enabled: boolean}} setting - Whether the graph is currently on.
 * @returns {string} HTML for the group.
 */
export function renderFrameGraphGroup({ enabled }) {
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
 * How the frametime graph plots its curves.
 * @param {{selected: string}} setting - Currently chosen mode.
 * @returns {string} HTML for the group.
 */
export function renderFrameGraphModeGroup({ selected }) {
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

/**
 * The controls legend: the movement keys as a keypad, and the ability on its own row.
 * Space is outlined in cyan because it is the ability, not the movement.
 * @param {{heading?: boolean}} [options] - Set `heading` to false inside the controls
 *   submenu, where the breadcrumb above already names the section.
 * @returns {string} HTML for the legend.
 */
export function renderControlsLegend({ heading = true } = {}) {
  return `
    ${heading ? `<span class="kicker">${t('menu.controls')}</span>` : ''}
    <div class="legend">
      <div class="keypad" aria-hidden="true">
        <span></span>
        <span class="key">W</span>
        <span></span>
        <span class="key">A</span>
        <span class="key">S</span>
        <span class="key">D</span>
      </div>
      <span class="legend__label">${t('menu.move')}</span>
    </div>
    <div class="legend">
      <span class="key key--ability key--wide">Space</span>
      <span class="legend__label">${t('hud.dash')}</span>
    </div>
  `;
}
