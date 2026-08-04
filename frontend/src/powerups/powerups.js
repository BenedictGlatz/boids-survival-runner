/**
 * Power-up state: what lies in the arena, what is running on the player, and the two moments
 * that are neither — a shield eating a hit and a life being given back. The rules half of
 * "Aegis, Overdrive and Mend" (`docs/design_system/design-system.md` §11), where
 * `renderer/powerupMarkerLayer.js` and `renderer/powerupLayer.js` draw what `snapshot()`
 * reports and decide nothing.
 *
 * Free of canvas and DOM, so the rules are unit-testable in Node the way `dashCooldown.js`
 * is — and like that module it takes its clock as a parameter rather than keeping one.
 * `gameData.simulationTimeMs` is the only clock in the game, and a second one that has to be
 * kept in step with it by convention is a second one too many.
 *
 * The tuning numbers live here rather than in `gameConfig.js`, the same way the dash trail's
 * do in `renderer/dashTrail.js`: they are tuned against each other and against nothing
 * outside this feature.
 */

import { PLAYER_STARTING_LIVES } from '../gameConfig.js';
import { LAUNCH_RING_SECONDS } from '../renderer/dashTrail.js';
import { isTooCloseToAnObstacle } from './markerClearance.js';
import { MendState } from './mend.js';

export const AEGIS_DURATION_MS = 6500;
export const OVERDRIVE_DURATION_MS = 6000;

/**
 * Deliberately below dash speed (1100 px/s): the dash already is the fastest the collision
 * resolution ever has to cope with, so Overdrive introduces no new tunnelling risk.
 */
export const OVERDRIVE_FACTOR = 1.6;

export const SPAWN_INTERVAL_MS = 9000;
export const MARKER_LIFETIME_MS = 12000;
export const MAX_MARKERS = 2;

/** Spawn clearance from the player, so a marker is never collected by standing still. */
export const MIN_SPAWN_DISTANCE = 220;

/**
 * Larger than the marker is drawn, so a graze at dash speed still counts.
 *
 * Raised with `PICKUP_RADIUS` by the same half again, which keeps the two in the ratio they
 * were tuned in — the collect distance is a share more than the glyph, not a fixed margin
 * around it, so a bigger marker stays as forgiving as the small one was rather than more so.
 */
export const COLLECT_RADIUS = 39;

/** How long the shatter is drawn after a hit is absorbed. */
export const SHATTER_MS = 350;

/**
 * How long a collected marker is remembered. It is remembered for exactly as long as its ring
 * is drawn, and that ring is the dash launch ring in another colour — so the duration is read
 * from there rather than written down a second time.
 */
const COLLECT_RING_MS = LAUNCH_RING_SECONDS * 1000;

/** How long a fresh marker takes to scale in, in milliseconds. */
const SPAWN_SCALE_IN_MS = 450;

/** Rejection-sampling attempts before an interval is given up on. */
const SPAWN_ATTEMPTS = 12;

/** The spawn area is the inner 80 % of the world, so nothing lands against a world edge. */
const SPAWN_AREA_INSET_SHARE = 0.1;
const SPAWN_AREA_SHARE = 0.8;

/**
 * Spawn order. Mend sits **between** the other two rather than at the end, so it can never be
 * offered twice in a row — a healer on repeat turns a survival runner into a game where being
 * hit costs nothing.
 */
const KINDS = ['aegis', 'mend', 'overdrive'];

/**
 * The markers on the ground and the buffs on the player.
 *
 * The caller drives it: `reset()` at round start, `step()` once per **simulation** step (not
 * per frame — otherwise a 144 Hz player collects differently from a 60 Hz one), `absorbHit()`
 * when damage is about to be applied, `snapshot()` when drawing. Every one of those takes the
 * simulation clock, and all of them have to be handed the same one.
 */
export class PowerupField {
  /**
   * @param {() => number} [random] - Injectable RNG, so tests can place markers exactly.
   */
  constructor(random = Math.random) {
    this._random = random;
    this._markers = [];
    this._buffs = new Map();
    this._collects = [];
    this._worldWidth = 0;
    this._worldHeight = 0;
    this._nextSpawnMs = SPAWN_INTERVAL_MS;
    this._shatterAtMs = -1;
    this._nextKind = 0;
    // Everything to do with lives sits in there, so this class keeps none of it.
    this._mend = new MendState(PLAYER_STARTING_LIVES);
  }

  /**
   * Clears everything and sizes the world.
   *
   * Belongs in `beginRound()`, not in `startGame()`: the simulation clock jumps back to zero
   * there, and every timestamp measured against it has to be re-seeded in the same place.
   * @param {number} worldWidth - Arena width in world units.
   * @param {number} worldHeight - Arena height in world units.
   * @param {number} [maxLives] - Life segments at full, which is all Mend's rules need to know
   *   about lives beyond the current count `step()` hands over.
   * @returns {void}
   */
  reset(worldWidth, worldHeight, maxLives = PLAYER_STARTING_LIVES) {
    this._worldWidth = worldWidth;
    this._worldHeight = worldHeight;
    this._markers = [];
    this._buffs.clear();
    this._collects = [];
    this._nextSpawnMs = SPAWN_INTERVAL_MS;
    this._shatterAtMs = -1;
    this._nextKind = 0;
    this._mend.reset(maxLives);
  }

  /**
   * Advances one simulation step: expires buffs and markers, spawns, and collects.
   * @param {number} simulationMs - `gameData.simulationTimeMs`.
   * @param {number} playerX - Player position after the engine's obstacle correction.
   * @param {number} playerY - Player position after the engine's obstacle correction.
   * @param {object} [frame] - The engine's frame, read for the obstacle geometry a marker has
   *   to keep clear of. May be absent, in which case only the player and marker distances apply.
   * @param {number} [lives] - The player's current life count. Mend's spawn and collect rules
   *   need it, and they are the only reason this class knows about lives at all.
   * @returns {'aegis'|'mend'|'overdrive'|null} The kind collected this step, if any.
   */
  step(simulationMs, playerX, playerY, frame, lives) {
    this._mend.observeLives(lives);

    for (const [kind, endsAtMs] of [...this._buffs]) {
      if (simulationMs >= endsAtMs) {
        this._buffs.delete(kind);
      }
    }

    this._markers = this._markers.filter(
      (marker) => simulationMs - marker.spawnedAtMs < MARKER_LIFETIME_MS,
    );
    this._collects = this._collects.filter((pop) => simulationMs - pop.atMs < COLLECT_RING_MS);

    if (simulationMs >= this._nextSpawnMs) {
      // Advanced even when the attempt below finds no room: a full arena should not get
      // extra markers the moment it empties out again.
      this._nextSpawnMs = simulationMs + SPAWN_INTERVAL_MS;
      this._trySpawn(simulationMs, playerX, playerY, frame);
    }

    return this._collect(simulationMs, playerX, playerY);
  }

  /**
   * Spends the shield on an incoming hit. Call **before** applying damage, and only for a hit
   * that would actually land — spending it during the grace period after a previous hit would
   * burn it on damage that was free anyway.
   *
   * Duration and charge are one and the same state: a shield that absorbs is over, whatever
   * its arc still showed. It deliberately starts no grace period of its own, so the next hit
   * costs a life immediately.
   * @param {number} simulationMs - `gameData.simulationTimeMs`.
   * @returns {boolean} `true` when the hit was absorbed and must not be applied.
   */
  absorbHit(simulationMs) {
    if (!this._buffs.has('aegis')) {
      return false;
    }

    this._buffs.delete('aegis');
    this._shatterAtMs = simulationMs;

    return true;
  }

  /**
   * Whether a Mend marker currently has anything to give. Drives both the collect check and
   * the slate treatment of a marker already lying in the arena.
   * @returns {boolean} `false` at full lives.
   */
  canMend() {
    return this._mend.canMend();
  }

  /**
   * Factor on `PLAYER_MAX_SPEED`. Never applied to `PLAYER_DASH_SPEED`.
   * @returns {number} `1` or `OVERDRIVE_FACTOR`.
   */
  speedMultiplier() {
    return this._buffs.has('overdrive') ? OVERDRIVE_FACTOR : 1;
  }

  /**
   * Whether a buff is currently running. Never true for Mend, which holds no state.
   * @param {'aegis'|'overdrive'} kind - Which buff.
   * @returns {boolean} True while it is active.
   */
  isActive(kind) {
    return this._buffs.has(kind);
  }

  /**
   * Starts a buff, or restarts it at full duration if it was already running. Public because
   * a collected marker is not the only imaginable source (a wave reward, a debug key).
   * @param {'aegis'|'mend'|'overdrive'} kind - Which power-up.
   * @param {number} simulationMs - `gameData.simulationTimeMs`.
   * @returns {void}
   */
  grant(kind, simulationMs) {
    // Mend is an event: there is no buff to hold, only a moment to draw. The life itself is
    // given back by the caller — this class never touches the life count, it only reads it.
    if (kind === 'mend') {
      this._mend.markGranted(simulationMs);

      return;
    }

    this._buffs.set(kind, simulationMs + durationOf(kind));
  }

  /**
   * Everything the renderer and the HUD need, as plain data.
   * @param {number} simulationMs - `gameData.simulationTimeMs`.
   * @returns {{
   *   powerupMarkers: Array<{kind: string, x: number, y: number, spawnScale: number,
   *     inert: number}>,
   *   powerupCollects: Array<{kind: string, x: number, y: number, age: number}>,
   *   powerupBuffs: Record<string, number>,
   *   aegisShatterAge: number | undefined,
   *   mendArcAge: number | undefined,
   * }} Render state fragment. Ages are in seconds, remaining times are fractions of 1.
   */
  snapshot(simulationMs) {
    const markers = this._markers.map((marker) => ({
      kind: marker.kind,
      x: marker.x,
      y: marker.y,
      // Scales in so a marker never simply appears next to the player.
      spawnScale: Math.min(1, (simulationMs - marker.spawnedAtMs) / SPAWN_SCALE_IN_MS),
      // A Mend marker with nothing to give drains to slate rather than disappearing: a marker
      // that vanishes in front of you feels stolen, one that goes grey explains itself.
      inert: marker.kind === 'mend' ? this._mend.inertAmount() : 0,
    }));

    const buffs = {};
    for (const [kind, endsAtMs] of this._buffs) {
      buffs[kind] = Math.max(0, (endsAtMs - simulationMs) / durationOf(kind));
    }

    const shatterAgeMs = simulationMs - this._shatterAtMs;

    return {
      powerupMarkers: markers,
      powerupCollects: this._collects.map((pop) => ({
        kind: pop.kind,
        x: pop.x,
        y: pop.y,
        age: (simulationMs - pop.atMs) / 1000,
      })),
      powerupBuffs: buffs,
      aegisShatterAge:
        this._shatterAtMs >= 0 && shatterAgeMs <= SHATTER_MS ? shatterAgeMs / 1000 : undefined,
      mendArcAge: this._mend.arcAge(simulationMs),
    };
  }

  _trySpawn(simulationMs, playerX, playerY, frame) {
    if (this._markers.length >= MAX_MARKERS) {
      return;
    }

    // Cycling rather than random: two Aegis in a row is a dead draw for a player who is at
    // full lives, and randomness that produces dead draws is not interesting randomness. A
    // Mend nobody could use is passed over rather than spawned dead — and the skip is counted
    // separately, so a spawn that finds no room does not silently consume the turn.
    const skipped = KINDS[this._nextKind % KINDS.length] === 'mend' && !this.canMend() ? 1 : 0;
    const kind = KINDS[(this._nextKind + skipped) % KINDS.length];

    for (let attempt = 0; attempt < SPAWN_ATTEMPTS; attempt += 1) {
      const x = this._worldWidth * (SPAWN_AREA_INSET_SHARE + this._random() * SPAWN_AREA_SHARE);
      const y = this._worldHeight * (SPAWN_AREA_INSET_SHARE + this._random() * SPAWN_AREA_SHARE);

      if (Math.hypot(x - playerX, y - playerY) < MIN_SPAWN_DISTANCE) continue;
      if (this._markers.some((m) => Math.hypot(m.x - x, m.y - y) < MIN_SPAWN_DISTANCE)) continue;
      if (isTooCloseToAnObstacle(x, y, frame)) continue;

      this._markers.push({ kind, x, y, spawnedAtMs: simulationMs });
      this._nextKind += 1 + skipped;

      return;
    }

    // Every attempt was rejected. That is not an error: an arena with no room left simply
    // gets no marker this interval, and the next one follows on schedule.
  }

  _collect(simulationMs, playerX, playerY) {
    for (let index = 0; index < this._markers.length; index += 1) {
      const marker = this._markers[index];

      if (Math.hypot(marker.x - playerX, marker.y - playerY) > COLLECT_RADIUS) continue;

      // An inert Mend marker is walked straight through — scenery until a life is lost.
      if (marker.kind === 'mend' && !this.canMend()) continue;

      this._markers.splice(index, 1);
      this._collects.push({
        kind: marker.kind,
        x: marker.x,
        y: marker.y,
        atMs: simulationMs,
      });
      this.grant(marker.kind, simulationMs);

      // At most one per step. Two overlapping markers means the older one wins and the other
      // is still there a step later.
      return marker.kind;
    }

    return null;
  }
}

function durationOf(kind) {
  return kind === 'aegis' ? AEGIS_DURATION_MS : OVERDRIVE_DURATION_MS;
}
