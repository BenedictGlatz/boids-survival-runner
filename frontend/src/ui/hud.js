import { t } from './i18n.js';
import { WAVE_DURATION_SECONDS } from '../gameConfig.js';

/**
 * In-game heads-up display (timer, wave, score, boid count, dash bar).
 * Reads game state and updates DOM elements — no simulation logic.
 *
 * A value is a small uppercase label plus a large mono number, without a surface and
 * without a border: readability comes from a text shadow instead, which gives four
 * rectangles of arena back to the game.
 */
export class Hud {
  /** @param {HTMLElement} [root] - Overlay the HUD is appended to. */
  constructor(root = document.getElementById('ui-overlay')) {
    this._el = document.createElement('div');
    this._el.id = 'hud';
    root.appendChild(this._el);

    // The id names what a stat shows, the class names where it sits. The end-to-end
    // tests read the ids, so moving a stat around the screen does not break them the
    // way a `.hud-stat.bottom-left` selector would.
    this._stats = {
      timer: createStat('hud-timer', 'top-center', 'hud.timer', [
        'hud-stat--timer',
        'hud-stat--center',
      ]),
      wave: createStat('hud-wave', 'top-right', 'hud.wave', ['hud-stat--right']),
      score: createStat('hud-score', 'bottom-left', 'hud.score', ['hud-stat--score']),
      boids: createStat('hud-boids', 'bottom-right', 'hud.boids', ['hud-stat--right']),
    };

    // The wave progress rail lives under the timer, because it measures the same clock.
    this._waveTrack = document.createElement('div');
    this._waveTrack.className = 'wave-track';
    this._waveFill = document.createElement('div');
    this._waveFill.className = 'wave-track__fill';
    this._waveTrack.appendChild(this._waveFill);
    this._stats.timer.element.appendChild(this._waveTrack);

    for (const stat of Object.values(this._stats)) {
      this._el.appendChild(stat.element);
    }

    this._dash = createDashBar();
    this._el.appendChild(this._dash.element);
  }

  /**
   * @param {{timerSeconds: number, wave: number, score: number, entityCount: number}} data -
   *   Current round state to display.
   * @param {{dashCooldownProgress?: number}} [renderState] - Ability state for the dash bar.
   * @returns {void}
   */
  update(data, renderState = {}) {
    this._stats.timer.value.textContent = formatTime(data.timerSeconds);
    // Two digits, so a wave change does not shift the number's width.
    this._stats.wave.value.textContent = String(data.wave).padStart(2, '0');
    this._stats.score.value.textContent = String(data.score);
    this._stats.boids.value.textContent = String(data.entityCount);

    this._waveFill.style.width = `${waveProgressPercent(data.timerSeconds)}%`;
    this._updateDash(renderState.dashCooldownProgress);
  }

  /**
   * Hides the whole HUD.
   * @returns {void}
   */
  hide() {
    this._el.style.display = 'none';
  }

  /**
   * Shows the whole HUD.
   * @returns {void}
   */
  show() {
    this._el.style.display = 'flex';
  }

  /**
   * The glow and the label are the information here, not decoration: a full cyan bar
   * that glows means the dash is available, anything else means it is not.
   */
  _updateDash(progress) {
    const level = clamp01(progress ?? 1);
    const isReady = level >= 1;

    this._dash.fill.style.width = `${level * 100}%`;
    this._dash.bar.classList.toggle('dash-bar--ready', isReady);
    this._dash.label.textContent = isReady ? t('hud.dashReady') : t('hud.dash');
  }
}

/** Builds one label-above-value stat. The value is filled in by `update`. */
function createStat(id, positionClass, labelKey, extraClasses) {
  const element = document.createElement('div');
  element.id = id;
  element.className = ['hud-stat', positionClass, ...extraClasses].join(' ');

  const label = document.createElement('span');
  label.className = 'hud-stat__label';
  label.textContent = t(labelKey);

  const value = document.createElement('span');
  value.className = 'hud-stat__value';

  element.appendChild(label);
  element.appendChild(value);

  return { element, value };
}

/**
 * The dash bar sits in the DOM rather than on the canvas, so its label is not
 * re-rasterised on every frame — the bar changes width, the text does not change at all.
 */
function createDashBar() {
  const element = document.createElement('div');
  element.className = 'hud-stat hud-stat--center bottom-center';

  const bar = document.createElement('div');
  bar.className = 'dash-bar';

  const fill = document.createElement('div');
  fill.className = 'dash-bar__fill';
  bar.appendChild(fill);

  const label = document.createElement('span');
  label.className = 'dash-label';

  element.appendChild(bar);
  element.appendChild(label);

  return { element, bar, fill, label };
}

/**
 * How far the current wave has run, in percent.
 *
 * The timer counts the whole round, so the remainder inside one wave's duration is what
 * the rail shows: it fills up once per wave rather than once per round.
 */
function waveProgressPercent(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds ?? 0);

  return ((safeSeconds % WAVE_DURATION_SECONDS) / WAVE_DURATION_SECONDS) * 100;
}

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (safeSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function clamp01(value) {
  return Math.min(Math.max(value, 0), 1);
}
