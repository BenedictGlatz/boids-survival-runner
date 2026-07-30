/**
 * The ring-buffer history a dash trail is drawn from — the storage half of the "Ion Streak",
 * where `dashTrail.js` holds the arithmetic that shapes it and `trailLayer.js` draws it.
 *
 * The history is a fixed set of ring buffers inside one `Float32Array`, allocated when the
 * module loads. Per frame the renderer only writes at a head index — no `push`, no `shift`, no
 * per-frame object, which is the same rule the glow table in `entityPalette.js` follows.
 *
 * It sits in its own file because `dashTrail.js` would otherwise be a 400-line module holding
 * two unrelated things; `dashTrail.js` re-exports the class, so callers still have one import.
 */

import {
  LAUNCH_RING_SECONDS,
  MAX_TRAILS,
  PLAYER_TRAIL_TIER,
  SAMPLE_STRIDE,
  TRAIL_RESET_DISTANCE,
  TRAIL_SAMPLES,
} from './dashTrail.js';

/** Marks a slot as belonging to no object. Boid keys are indices, the player is `-1`. */
const NO_KEY = 0x7fffffff;
const PLAYER_KEY = -1;

/**
 * The position history behind every trail currently on screen.
 *
 * Frame order is fixed and the renderer keeps it: `advance(dt)` once, then one `sample...`
 * call per dashing object, then `settle()`. `settle` is what retracts the trails of objects
 * that stopped dashing — a trail whose owner was not sampled this frame loses its oldest
 * sample, so the tail is pulled in instead of vanishing in one frame.
 */
export class DashTrails {
  constructor() {
    this._samples = new Float32Array(MAX_TRAILS * TRAIL_SAMPLES * SAMPLE_STRIDE);
    this._keys = new Int32Array(MAX_TRAILS).fill(NO_KEY);
    /** Difficulty tier of the owner, or `PLAYER_TRAIL_TIER`. Decides the colour. */
    this._tiers = new Int8Array(MAX_TRAILS);
    this._starts = new Uint8Array(MAX_TRAILS);
    this._counts = new Uint8Array(MAX_TRAILS);
    this._touched = new Uint8Array(MAX_TRAILS);
    this._ringAges = new Float32Array(MAX_TRAILS).fill(-1);
    this._ringX = new Float32Array(MAX_TRAILS);
    this._ringY = new Float32Array(MAX_TRAILS);
  }

  /**
   * Opens a frame: ages the launch rings and forgets which slots were written last frame.
   * @param {number} deltaSeconds - Wall-clock seconds since the previous drawn frame.
   * @returns {void}
   */
  advance(deltaSeconds) {
    const safeDelta = Math.min(Math.max(deltaSeconds, 0), 0.1);

    for (let slot = 0; slot < MAX_TRAILS; slot += 1) {
      this._touched[slot] = 0;

      if (this._ringAges[slot] >= 0) {
        this._ringAges[slot] += safeDelta;

        if (this._ringAges[slot] > LAUNCH_RING_SECONDS) {
          this._ringAges[slot] = -1;
        }
      }
    }
  }

  /**
   * @param {number} x - Player position.
   * @param {number} y - Player position.
   * @param {number} headingX - Unit heading.
   * @param {number} headingY - Unit heading.
   * @param {number} strength - From `trailStrength()`; `0` writes nothing.
   * @returns {void}
   */
  samplePlayer(x, y, headingX, headingY, strength) {
    this._sample(PLAYER_KEY, PLAYER_TRAIL_TIER, x, y, headingX, headingY, strength);
  }

  /**
   * @param {number} boidIndex - Index into the frame's flat buffers.
   * @param {number} tier - The boid's difficulty tier, for the colour.
   * @param {number} x - Boid position.
   * @param {number} y - Boid position.
   * @param {number} headingX - Unit heading.
   * @param {number} headingY - Unit heading.
   * @param {number} strength - From `boidTrailStrength()`; `0` writes nothing.
   * @returns {void}
   */
  sampleBoid(boidIndex, tier, x, y, headingX, headingY, strength) {
    this._sample(boidIndex, tier, x, y, headingX, headingY, strength);
  }

  /**
   * Closes a frame: every trail nobody wrote to loses its oldest sample, and an empty trail
   * frees its slot.
   * @returns {void}
   */
  settle() {
    for (let slot = 0; slot < MAX_TRAILS; slot += 1) {
      if (this._touched[slot] === 1 || this._counts[slot] === 0) continue;

      this._starts[slot] = (this._starts[slot] + 1) % TRAIL_SAMPLES;
      this._counts[slot] -= 1;

      if (this._counts[slot] === 0) {
        this._keys[slot] = NO_KEY;
      }
    }
  }

  /**
   * Drops every trail. Belongs in `beginRound()`, next to the dash cooldown reseed: boid
   * indices are reassigned there, so last round's history has no owner any more.
   * @returns {void}
   */
  reset() {
    this._keys.fill(NO_KEY);
    this._counts.fill(0);
    this._starts.fill(0);
    this._touched.fill(0);
    this._ringAges.fill(-1);
  }

  /**
   * How many samples a trail holds. `0`, `1` — anything below 2 has no segment to draw.
   * @param {number} slot - Slot index below `MAX_TRAILS`.
   * @returns {number} Sample count.
   */
  count(slot) {
    return this._counts[slot];
  }

  /**
   * Tier of the trail's owner, or `PLAYER_TRAIL_TIER`.
   * @param {number} slot - Slot index below `MAX_TRAILS`.
   * @returns {number} Tier.
   */
  tier(slot) {
    return this._tiers[slot];
  }

  /**
   * Offset of one sample in `samples`, oldest first.
   *
   * Deliberately raw instead of returning a sample object: the drawing pass runs over up to
   * 12 trails × 22 samples per frame, and a returned object per sample would be exactly the
   * hot-path allocation the ring buffer exists to avoid.
   * @param {number} slot - Slot index below `MAX_TRAILS`.
   * @param {number} ordinal - `0` is the oldest sample, `count(slot) - 1` the newest.
   * @returns {number} Index into `samples`, pointing at that sample's `x`.
   */
  offsetOf(slot, ordinal) {
    const ring = (this._starts[slot] + ordinal) % TRAIL_SAMPLES;

    return (slot * TRAIL_SAMPLES + ring) * SAMPLE_STRIDE;
  }

  /** @returns {Float32Array} The sample store, read with `offsetOf()`. */
  get samples() {
    return this._samples;
  }

  /**
   * Seconds since this trail's launch, or `-1` when its ring is done.
   * @param {number} slot - Slot index below `MAX_TRAILS`.
   * @returns {number} Age in seconds.
   */
  ringAge(slot) {
    return this._ringAges[slot];
  }

  /**
   * @param {number} slot - Slot index below `MAX_TRAILS`.
   * @returns {number} World x the launch ring is centred on.
   */
  ringX(slot) {
    return this._ringX[slot];
  }

  /**
   * @param {number} slot - Slot index below `MAX_TRAILS`.
   * @returns {number} World y the launch ring is centred on.
   */
  ringY(slot) {
    return this._ringY[slot];
  }

  _sample(key, tier, x, y, headingX, headingY, strength) {
    if (strength <= 0.02) return;

    const slot = this._slotFor(key);
    if (slot < 0) return;

    this._tiers[slot] = tier;
    this._touched[slot] = 1;

    const count = this._counts[slot];

    if (count === 0) {
      // First sample of a trail *is* the launch: nothing else marks that moment, and this
      // way the ring cannot get out of step with the trail it belongs to.
      this._ringAges[slot] = 0;
      this._ringX[slot] = x;
      this._ringY[slot] = y;
    } else {
      const newest = this.offsetOf(slot, count - 1);
      const jump = Math.hypot(this._samples[newest] - x, this._samples[newest + 1] - y);

      if (jump > TRAIL_RESET_DISTANCE) {
        this._counts[slot] = 0;
        this._starts[slot] = 0;
      }
    }

    this._push(slot, x, y, headingX, headingY, strength);
  }

  _push(slot, x, y, headingX, headingY, strength) {
    const count = this._counts[slot];
    const ring = (this._starts[slot] + count) % TRAIL_SAMPLES;
    const offset = (slot * TRAIL_SAMPLES + ring) * SAMPLE_STRIDE;

    this._samples[offset] = x;
    this._samples[offset + 1] = y;
    this._samples[offset + 2] = headingX;
    this._samples[offset + 3] = headingY;
    this._samples[offset + 4] = strength;

    if (count < TRAIL_SAMPLES) {
      this._counts[slot] = count + 1;
    } else {
      this._starts[slot] = (this._starts[slot] + 1) % TRAIL_SAMPLES;
    }
  }

  /** The slot this key already owns, a free one, or `-1` when all twelve are busy. */
  _slotFor(key) {
    let free = -1;

    for (let slot = 0; slot < MAX_TRAILS; slot += 1) {
      if (this._keys[slot] === key) return slot;
      if (free < 0 && this._keys[slot] === NO_KEY) free = slot;
    }

    if (free < 0) return -1;

    this._keys[free] = key;
    this._starts[free] = 0;
    this._counts[free] = 0;

    return free;
  }
}

/**
 * The one instance the renderer uses. A module-level singleton for the same reason the glow
 * table is one: it is a fixed allocation that must not be rebuilt per frame, and there is
 * exactly one canvas.
 */
export const dashTrails = new DashTrails();
