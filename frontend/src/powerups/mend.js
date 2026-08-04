/**
 * Everything Mend knows about lives, and nothing else.
 *
 * `PowerupField` is handed the player's current life count in `step()`, and Mend's rules are
 * the only reason it knows about lives at all (`docs/design_system/design-system.md` §11). That
 * one sentence is this file: the whole of that knowledge sits in one small object the field
 * delegates to, rather than as three life-aware branches spread through a class that is
 * otherwise about markers and buffs.
 *
 * Mend is an **event**, not a state. There is no buff to hold and no duration to run down —
 * `markGranted` records a moment and `arcAge` reports it for as long as the renderer draws it.
 * The life itself is restored by the loop (`round/roundData.js`); nothing here writes a life
 * count, it only ever reads one.
 *
 * Free of canvas and DOM like the rest of `powerups/`, and it takes the simulation clock as a
 * parameter rather than keeping one of its own.
 */

import { PLAYER_STARTING_LIVES, SIMULATION_STEP_MS } from '../gameConfig.js';
import { MEND_ARC_SECONDS } from '../renderer/mendPulse.js';

/**
 * How many life segments one Mend gives back.
 *
 * **One**, not all of them: healing to full would make the round up to that point mean
 * nothing, while a single segment is an extension of the run rather than a reset of it.
 */
export const MEND_SEGMENTS = 1;

/**
 * How long a Mend marker takes to drain to slate once nobody can use it, and to come back
 * from it. Short enough to read as an answer to the life that was just restored, long enough
 * not to look like the marker was swapped for a different one.
 */
export const INERT_FADE_MS = 300;

/** The arc is remembered for exactly as long as the renderer draws it, and not a step more. */
const ARC_MS = MEND_ARC_SECONDS * 1000;

/**
 * Mend's share of the power-up state: what it may do, how grey its marker is, and when it last
 * fired.
 */
export class MendState {
  /**
   * @param {number} [maxLives] - Life segments at full.
   */
  constructor(maxLives = PLAYER_STARTING_LIVES) {
    this.reset(maxLives);
  }

  /**
   * Clears the moment and starts over at full lives. Belongs in `PowerupField.reset()`.
   * @param {number} [maxLives] - Life segments at full.
   * @returns {void}
   */
  reset(maxLives = PLAYER_STARTING_LIVES) {
    this._maxLives = maxLives;
    // A round opens at full lives, so Mend opens with nothing to give and its marker — if one
    // were somehow already lying there — opens grey rather than fading to it.
    this._lives = maxLives;
    this._inertAmount = 1;
    this._grantedAtMs = -1;
  }

  /**
   * Takes this step's life count and walks the marker's colour toward where it now belongs.
   * @param {number} [lives] - The player's current life count. A caller that does not track
   *   lives at all counts as full, which is the reading that offers nothing rather than the one
   *   that offers a heal nobody asked for.
   * @returns {void}
   */
  observeLives(lives) {
    this._lives = lives ?? this._maxLives;

    // Walked at a fixed rate per step rather than switched: a marker that changes state
    // between two frames reads as a different marker rather than as the same one going quiet.
    const target = this.canMend() ? 0 : 1;
    const perStep = SIMULATION_STEP_MS / INERT_FADE_MS;

    if (this._inertAmount < target) {
      this._inertAmount = Math.min(target, this._inertAmount + perStep);
    } else if (this._inertAmount > target) {
      this._inertAmount = Math.max(target, this._inertAmount - perStep);
    }
  }

  /**
   * Whether Mend currently has anything to give. It gates the spawn order **and** the collect
   * check, which is what keeps a heal from ever being a dead find.
   * @returns {boolean} False at full lives.
   */
  canMend() {
    return this._lives < this._maxLives;
  }

  /**
   * How far the marker has drained toward slate.
   *
   * A marker at full lives goes grey instead of disappearing: one that vanishes in front of
   * you feels stolen, one that goes grey explains itself. It comes back the same way.
   * @returns {number} `0` fully live … `1` fully inert.
   */
  inertAmount() {
    return this._inertAmount;
  }

  /**
   * Records that a life was just given back, which is the whole of Mend's state.
   * @param {number} simulationMs - `gameData.simulationTimeMs`.
   * @returns {void}
   */
  markGranted(simulationMs) {
    this._grantedAtMs = simulationMs;
  }

  /**
   * How long ago the heal was, while that is still worth drawing.
   * @param {number} simulationMs - `gameData.simulationTimeMs`.
   * @returns {number | undefined} Seconds since the heal, or `undefined` once the arc is over —
   *   an event has nothing left to report, so it reports nothing.
   */
  arcAge(simulationMs) {
    if (this._grantedAtMs < 0) {
      return undefined;
    }

    const ageMs = simulationMs - this._grantedAtMs;

    return ageMs <= ARC_MS ? ageMs / 1000 : undefined;
  }
}
