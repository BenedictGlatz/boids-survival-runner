/**
 * The panels of the Command Deck: the settings groups and the controls legend.
 * Templates only — no state, no event handling, no game logic.
 *
 * A panel is shown in exactly one place at a time. The controls legend sits in the
 * right-hand stack on the start screen and moves into the left column inside its own
 * submenu, leaving the stack while it is there — no panel is ever rendered twice, which
 * matters because `bindOptionGroup` finds its group by id. The settings groups have no
 * copy in the stack at all: each one lives behind the menu row it belongs to.
 */

import { t } from './i18n.js';
import { renderOptionGroup } from './optionGroup.js';
import { formatDuration, renderRunStats } from './runStats.js';
import { FRAME_GRAPH_MODE } from '../gameConfig.js';

export const FPS_GROUP_ID = 'fps-options';
export const FRAME_GRAPH_GROUP_ID = 'frame-graph-options';
export const FRAME_GRAPH_MODE_GROUP_ID = 'frame-graph-mode-options';
export const INVULNERABLE_GROUP_ID = 'invulnerable-options';

/** Raw values of an on/off group, as carried in the DOM. */
export const TOGGLE_ON = 'on';
export const TOGGLE_OFF = 'off';

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
 * The target framerate. Only rates the display can actually show are on the list, so its
 * top entry is as fast as this machine gets and is labelled accordingly. The measured
 * rate is named in the hint — otherwise a missing option looks like a bug.
 * @param {{options: number[], selected: number, refreshRateHz: ?number}} setting - Current
 *   values of the framerate setting.
 * @returns {string} HTML for the group.
 */
export function renderTargetFpsGroup({ options, selected, refreshRateHz }) {
  // The list is ascending, so the last entry is the fastest one on offer.
  const fastestOffered = options[options.length - 1];

  return renderOptionGroup({
    id: FPS_GROUP_ID,
    label: t('settings.targetFps'),
    hint: renderFpsHint(refreshRateHz),
    options: options.map((fps) => {
      const label = fps === fastestOffered ? `${fps} (${t('settings.fpsUncapped')})` : `${fps}`;

      return {
        value: String(fps),
        label,
        ariaLabel: `${label} ${t('settings.fpsUnit')}`,
        selected: fps === selected,
      };
    }),
  });
}

/** The measured rate is appended only when there is one — never "null Hz". */
function renderFpsHint(refreshRateHz) {
  if (refreshRateHz === null || refreshRateHz === undefined) {
    return t('settings.fpsHint');
  }

  return `${t('settings.fpsHint')} · ${Math.round(refreshRateHz)} ${t('settings.hertz')}`;
}

/**
 * The frametime graph's on/off switch.
 * @param {{enabled: boolean}} setting - Whether the graph is currently on.
 * @returns {string} HTML for the group.
 */
export function renderFrameGraphGroup({ enabled }) {
  return renderToggleGroup({
    id: FRAME_GRAPH_GROUP_ID,
    label: t('settings.frameTimeGraph'),
    hint: t('settings.frameTimeGraphHint'),
    enabled,
  });
}

/**
 * The invulnerable-player switch: the round runs until it is ended by hand.
 * @param {{enabled: boolean}} setting - Whether the mode is currently on.
 * @returns {string} HTML for the group.
 */
export function renderInvulnerableGroup({ enabled }) {
  return renderToggleGroup({
    id: INVULNERABLE_GROUP_ID,
    label: t('settings.invulnerablePlayer'),
    hint: t('settings.invulnerablePlayerHint'),
    enabled,
  });
}

/**
 * Off first, on second, in every on/off group in the menu. The order is worth having in one
 * place: two toggles that disagree about which side "on" sits on are two toggles you have to
 * read instead of aim at.
 */
function renderToggleGroup({ id, label, hint, enabled }) {
  return renderOptionGroup({
    id,
    label,
    hint,
    options: [
      { value: TOGGLE_OFF, label: t('settings.off'), selected: !enabled },
      { value: TOGGLE_ON, label: t('settings.on'), selected: enabled },
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
 * The controls legend: the movement keys as a keypad, then the ability and the pause on
 * their own rows. Space is outlined in cyan because it is the ability, not the movement;
 * Escape is a plain keycap because pausing is not something you do to the swarm.
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
    <div class="legend">
      <span class="key key--wide">Esc</span>
      <span class="legend__label">${t('menu.pause')}</span>
    </div>
  `;
}
