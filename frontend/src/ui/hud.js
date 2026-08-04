import { t } from './i18n.js';
import { BOID_COLORS } from '../renderer/entityPalette.js';
import { spawnLevelForWave, spawnTierForWave } from '../round/waveTier.js';
import { WAVE_DURATION_SECONDS } from '../gameConfig.js';

/**
 * In-game heads-up display (wave, timer, spawning variant, score, boid count, dash bar).
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
      wave: createStat('hud-wave', 'hud.wave', ['hud-stat--wave']),
      timer: createStat('hud-timer', 'hud.timer', ['hud-stat--timer']),
      spawn: createStat('hud-spawn-tier', 'hud.spawning', ['hud-stat--spawn']),
      score: createStat('hud-score', 'hud.score', ['hud-stat--score', 'bottom-left']),
      boids: createStat('hud-boids', 'hud.boids', [
        'hud-stat--boids',
        'hud-stat--right',
        'bottom-right',
      ]),
    };

    // The wave progress rail lives under the timer, because it measures the same clock.
    this._waveTrack = document.createElement('div');
    this._waveTrack.className = 'wave-track';
    this._waveFill = document.createElement('div');
    this._waveFill.className = 'wave-track__fill';
    this._waveTrack.appendChild(this._waveFill);
    this._stats.timer.element.appendChild(this._waveTrack);

    // The tier mark and the digits share one value box, so the arrow can inherit the tier
    // colour through `currentColor` instead of needing a second inline style. That is why the
    // digits get a span of their own: writing to the value box itself would delete the arrow
    // on the first update.
    this._spawnLevel = document.createElement('span');
    this._stats.spawn.value.appendChild(createTierMark());
    this._stats.spawn.value.appendChild(this._spawnLevel);

    // Wave, time and the arriving variant answer one question — how far am I, and what is
    // coming now — so they stand together at the top centre instead of across two screen
    // corners. The corners stay free for the score and the boid count.
    this._el.appendChild(buildGroup([this._stats.wave, this._stats.timer, this._stats.spawn]));
    this._el.appendChild(this._stats.score.element);
    this._el.appendChild(this._stats.boids.element);

    this._dash = createDashBar();
    // Above the dash bar in the same flex column, so the two abilities read as one stack and
    // no second position has to be kept in step with the first.
    this._buffs = {
      aegis: createBuffRow('aegis', 'hud.aegis'),
      overdrive: createBuffRow('overdrive', 'hud.overdrive'),
    };

    for (const buff of Object.values(this._buffs)) {
      this._dash.element.insertBefore(buff.element, this._dash.bar);
    }

    this._el.appendChild(this._dash.element);
  }

  /**
   * @param {{timerSeconds: number, wave: number, score: number, entityCount: number}} data -
   *   Current round state to display.
   * @param {object} [renderState] - Ability state: `dashCooldownProgress` for the dash bar and
   *   `powerupBuffs` for the two power-up rows.
   * @returns {void}
   */
  update(data, renderState = {}) {
    this._stats.timer.value.textContent = formatTime(data.timerSeconds);
    // Two digits, so a wave change does not shift the number's width.
    this._stats.wave.value.textContent = padTwo(data.wave);
    this._stats.score.value.textContent = String(data.score);
    this._stats.boids.value.textContent = String(data.entityCount);

    this._updateSpawnTier(data.wave);
    this._waveFill.style.width = `${waveProgressPercent(data.timerSeconds)}%`;
    this._updateDash(renderState.dashCooldownProgress);
    this._updateBuffs(renderState.powerupBuffs);
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
   * Which boid variant the current wave is putting into the arena, in that variant's colour.
   *
   * The colour is the actual announcement: the number says the escalation stepped, the colour
   * says which of the darts out there it produced, so the value needs no legend. It is written
   * on every frame rather than only on a change — that is one string assignment, against a
   * remembered previous value that a restart would have to reset.
   */
  _updateSpawnTier(wave) {
    this._spawnLevel.textContent = padTwo(spawnLevelForWave(wave));
    // On the value box, not on the digits: the tier mark inherits it from there.
    this._stats.spawn.value.style.color = BOID_COLORS[spawnTierForWave(wave)];
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

  /**
   * A row exists only while its buff runs. It is the second place to look — the warning that
   * a buff is about to end is the blinking arc on the player, not anything here.
   */
  _updateBuffs(powerupBuffs = {}) {
    for (const [kind, row] of Object.entries(this._buffs)) {
      const remaining = powerupBuffs[kind];

      row.element.style.display = remaining === undefined ? 'none' : 'flex';

      if (remaining !== undefined) {
        row.fill.style.width = `${clamp01(remaining) * 100}%`;
      }
    }
  }
}

/**
 * The top-centre progress group: the given stats side by side, with a hairline between each
 * pair. It is positioned by the same `top-center` utility a single value used to use, so where
 * a thing sits still comes from `main.css` and not from this module.
 *
 * The hairlines are their own elements rather than borders on the stats, because a border would
 * have to be switched off again on the first or the last child — one rule more than a `<div>`.
 */
function buildGroup(stats) {
  const element = document.createElement('div');
  element.className = 'hud-group top-center';

  for (let index = 0; index < stats.length; index += 1) {
    if (index > 0) {
      const rule = document.createElement('div');
      rule.className = 'hud-group__rule';
      element.appendChild(rule);
    }

    element.appendChild(stats[index].element);
  }

  return element;
}

/**
 * The boid silhouette beside the spawning level: a clipped triangle, the same shape the canvas
 * draws a boid as, so the number is readable without a legend. Clipped rather than a glyph for
 * the reason the power-up hexagon is — no font is involved, and it cannot fail to load.
 */
function createTierMark() {
  const mark = document.createElement('span');
  mark.className = 'hud-stat__tier-mark';

  return mark;
}

/** Builds one label-above-value stat. The value is filled in by `update`. */
function createStat(id, labelKey, extraClasses) {
  const element = document.createElement('div');
  element.id = id;
  element.className = ['hud-stat', ...extraClasses].join(' ');

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
 * One power-up row: the kind's hexagon, a draining bar and a name.
 *
 * It sits in the DOM for the same reason the dash bar does — the label never changes and has
 * no business being re-rasterised sixty times a second. The hexagon is a `clip-path` rather
 * than a glyph, so it is the same shape the canvas draws without a font being involved.
 */
function createBuffRow(kind, labelKey) {
  const element = document.createElement('div');
  element.id = `hud-buff-${kind}`;
  element.className = `buff-row buff-row--${kind}`;
  element.style.display = 'none';

  const glyph = document.createElement('span');
  glyph.className = 'buff-glyph';

  const bar = document.createElement('div');
  bar.className = 'buff-bar';

  const fill = document.createElement('div');
  fill.className = 'buff-bar__fill';
  bar.appendChild(fill);

  const label = document.createElement('span');
  label.className = 'buff-label';
  label.textContent = t(labelKey);

  element.appendChild(glyph);
  element.appendChild(bar);
  element.appendChild(label);

  return { element, fill };
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

/** Two digits, so a counter that steps from 9 to 10 does not shift its own width. */
function padTwo(value) {
  return String(value).padStart(2, '0');
}

function clamp01(value) {
  return Math.min(Math.max(value, 0), 1);
}
