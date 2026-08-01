/**
 * The values behind the start menu's option groups.
 *
 * They belong neither to a round nor to the engine: the menu writes them, the frame
 * loop reads them, and they have to survive every state change in between. Holding
 * them here rather than in the loop keeps `index.js` about the loop, and makes the
 * one piece of logic among them — which framerates the display leaves worth
 * offering — testable without a browser.
 */

import {
  DEFAULT_FRAME_GRAPH_ENABLED,
  DEFAULT_FRAME_GRAPH_MODE,
  DEFAULT_TARGET_FPS,
  TARGET_FPS_OPTIONS,
} from '../gameConfig.js';
import { availableTargetFpsOptions } from '../loop/refreshRate.js';

/**
 * Mutable holder of the start-menu settings. State only — it renders nothing and
 * knows nothing about the DOM.
 */
export class MenuSettings {
  /** Starts on the unfiltered option list, until a display measurement arrives. */
  constructor() {
    this._targetFpsOptions = [...TARGET_FPS_OPTIONS];
    this._targetFps = DEFAULT_TARGET_FPS;
    this._refreshRateHz = null;
    this._frameGraphEnabled = DEFAULT_FRAME_GRAPH_ENABLED;
    this._frameGraphMode = DEFAULT_FRAME_GRAPH_MODE;
  }

  /** @returns {number} The chosen target framerate. */
  get targetFps() {
    return this._targetFps;
  }

  /** @returns {boolean} Whether the frametime graph is shown during a round. */
  get frameGraphEnabled() {
    return this._frameGraphEnabled;
  }

  /** @returns {string} Which curves the frametime graph plots. */
  get frameGraphMode() {
    return this._frameGraphMode;
  }

  /**
   * Narrows the framerate options down to what the display can show and selects the
   * fastest of them.
   *
   * The fastest is the default because it is the one the hardware was bought for;
   * anything below it is a deliberate choice to draw less often.
   * @param {?number} refreshRateHz - Measured display refresh rate, `null` if unknown.
   * @returns {void}
   */
  applyDisplayLimits(refreshRateHz) {
    this._refreshRateHz = refreshRateHz ?? null;
    this._targetFpsOptions = availableTargetFpsOptions(this._refreshRateHz);
    // The list is ascending, so the last entry is the fastest one on offer.
    this._targetFps = this._targetFpsOptions[this._targetFpsOptions.length - 1];
  }

  /**
   * The settings object `Menu.showStart` expects: current values plus the handler
   * each group calls when the player picks something.
   * @returns {{targetFps: object, frameGraph: object, frameGraphMode: object}} One
   *   entry per option group in the menu.
   */
  toMenuOptions() {
    return {
      targetFps: {
        options: this._targetFpsOptions,
        selected: this._targetFps,
        refreshRateHz: this._refreshRateHz,
        onSelect: (fps) => {
          this._targetFps = fps;
        },
      },
      frameGraph: {
        enabled: this._frameGraphEnabled,
        onToggle: (enabled) => {
          this._frameGraphEnabled = enabled;
        },
      },
      frameGraphMode: {
        selected: this._frameGraphMode,
        onSelect: (mode) => {
          this._frameGraphMode = mode;
        },
      },
    };
  }
}
