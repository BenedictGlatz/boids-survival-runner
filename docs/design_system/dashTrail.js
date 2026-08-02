/**
 * Dash trail history and the pure numbers that shape it — the "Ion Streak" of
 * `design-system.md` §8.
 *
 * Two things live here and nothing else: the position history a trail is drawn from, and
 * the arithmetic that turns a sample's age into a width and an opacity. No canvas, so the
 * shape of the trail is unit-testable in Node exactly like `dashPulse.js` is.
 *
 * The history is a fixed set of ring buffers inside one `Float32Array`, allocated when the
 * module loads. Per frame the renderer only writes at a head index — no `push`, no `shift`,
 * no per-frame object, which is the same rule the glow table in `canvasRenderer.js` follows.
 *
 * There is deliberately **no** new field across the WASM boundary: a boid is dashing when
 * `dash_phases[i] < 0`, which the frame already carries, and the player's speed is known in
 * the frontend anyway.
 */

/** Samples kept per trail. At 60 fps this is ~0.37 s of history — about one dash. */
export const TRAIL_SAMPLES = 22;

/**
 * How many trails can be on screen at once: the player plus the engine's hard ceiling of
 * concurrent boid dashers (11 at 156 boids, see `spec-s05-dash.md` §3). A dash that finds no
 * free slot is drawn without a trail rather than growing the buffer mid-frame.
 */
export const MAX_TRAILS = 12;

/** Values per sample: `[x, y, headingX, headingY, strength]`. */
export const SAMPLE_STRIDE = 5;

/**
 * Distance between two consecutive samples that can only mean "this is not the same object
 * any more": a boid wrapping at the world edge, or indices being reassigned at wave start.
 * Without the check a trail would be drawn straight across the arena.
 *
 * Well above the largest honest step — a tier-4 dasher moves 18.7 px per simulation step,
 * and a catch-up frame runs at most `MAX_SIMULATION_STEPS_PER_FRAME` (5) of them.
 */
export const TRAIL_RESET_DISTANCE = 200;

/** Launch ring: the one-off pop at the moment the impulse is applied. */
export const LAUNCH_RING_SECONDS = 0.3;
export const LAUNCH_RING_START_RADIUS = 10;
export const LAUNCH_RING_END_RADIUS = 90;

/** Marks a slot as belonging to no object. Boid keys are indices, the player is `-1`. */
const NO_KEY = 0x7fffffff;
const PLAYER_KEY = -1;

/** `colors[slot]` for the player. Any other value is a boid's difficulty tier. */
export const PLAYER_TRAIL_TIER = -1;

/**
 * How much of a trail the current speed earns, from `0` (none) to `1` (full).
 *
 * The trail exists only above normal movement speed, so it ends by itself when the impulse
 * has bled off — there is no trail timer to keep in sync with the dash. The `0.6` keeps the
 * last, slowest bit of the ramp still faintly visible instead of cutting the tail off at a
 * hard threshold.
 * @param {number} speed - Current speed in px/s.
 * @param {number} baseSpeed - Normal top speed, `PLAYER_MAX_SPEED`.
 * @param {number} dashSpeed - Speed a dash starts at, `PLAYER_DASH_SPEED`.
 * @returns {number} Strength between `0` and `1`.
 */
export function trailStrength(speed, baseSpeed, dashSpeed) {
  if (dashSpeed <= baseSpeed) return 0;

  const raw = (speed - baseSpeed * 0.6) / (dashSpeed - baseSpeed);

  return Math.min(1, Math.max(0, raw));
}

/**
 * The same number for a boid, straight from the engine's dash phase.
 *
 * `dashPhase` counts the dash *down* (`-1` at launch toward `0`), so the trail is strongest
 * at the moment of the lunge and thins out as the boid runs out of impulse — which is what
 * the player needs to read: where the stab came from, not where it is petering out.
 * @param {number} dashPhase - The engine's `dash_phases[i]`.
 * @returns {number} Strength between `0` and `1`; `0` unless the boid is dashing.
 */
export function boidTrailStrength(dashPhase) {
  if (dashPhase >= 0) return 0;

  return Math.min(1, 0.35 + Math.abs(dashPhase));
}

/**
 * Half width of the ribbon at one sample.
 *
 * `ageFraction` is `0` at the oldest sample and `1` at the object, so the band is widest
 * where the object is and runs to a point behind it. The exponent below 1 keeps the taper
 * from looking like a triangle.
 *
 * `strength` is one value for the whole ribbon (the strongest sample in it), not the
 * individual sample's: tapering by age *and* by each sample's own strength at the same time
 * makes the band thin everywhere instead of thin at the tail.
 * @param {number} baseHalf - Half width at the object — the object's own radius.
 * @param {number} ageFraction - `0` oldest … `1` newest.
 * @param {number} strength - Strength of the whole ribbon, `0`..`1`.
 * @returns {number} Half width in world units.
 */
export function ribbonHalfWidth(baseHalf, ageFraction, strength) {
  return baseHalf * Math.pow(ageFraction, 0.8) * strength;
}

/**
 * Opacity of the ribbon at one sample. Never fully opaque — the trail is behind the boids
 * and must not read as a solid object of its own.
 * @param {number} ageFraction - `0` oldest … `1` newest.
 * @param {number} strength - Strength of the whole ribbon, `0`..`1`.
 * @returns {number} Alpha between `0` and `1`.
 */
export function ribbonAlpha(ageFraction, strength) {
  return 0.5 * ageFraction * strength;
}

/**
 * The white core, a second and much narrower ribbon inside the first. It falls off far
 * faster than the body (both exponents well above 1), so it stays a short bright streak
 * right behind the object.
 *
 * A stroked line was the obvious alternative and is wrong: a stroke keeps its width all the
 * way to the tail, which reads as a spear rather than as a trail.
 * @param {number} baseHalf - The ribbon's half width at the object.
 * @param {number} ageFraction - `0` oldest … `1` newest.
 * @param {number} strength - Strength of the whole ribbon, `0`..`1`.
 * @returns {number} Half width in world units.
 */
export function coreHalfWidth(baseHalf, ageFraction, strength) {
  return baseHalf * 0.34 * Math.pow(ageFraction, 2.2) * strength;
}

/**
 * Opacity of the core.
 * @param {number} ageFraction - `0` oldest … `1` newest.
 * @param {number} strength - Strength of the whole ribbon, `0`..`1`.
 * @returns {number} Alpha between `0` and `1`.
 */
export function coreAlpha(ageFraction, strength) {
  return 0.5 * Math.pow(ageFraction, 1.6) * strength;
}

/**
 * Radius of the launch ring, `age` seconds after the impulse.
 * @param {number} age - Seconds since launch.
 * @returns {number} Radius in world units.
 */
export function launchRingRadius(age) {
  const progress = Math.min(1, Math.max(0, age / LAUNCH_RING_SECONDS));

  return LAUNCH_RING_START_RADIUS + progress * (LAUNCH_RING_END_RADIUS - LAUNCH_RING_START_RADIUS);
}

/**
 * Opacity of the launch ring, `age` seconds after the impulse.
 * @param {number} age - Seconds since launch.
 * @returns {number} Alpha between `0` and `1`.
 */
export function launchRingAlpha(age) {
  const progress = Math.min(1, Math.max(0, age / LAUNCH_RING_SECONDS));

  return (1 - progress) * 0.7;
}

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
