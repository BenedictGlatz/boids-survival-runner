/**
 * Power-up state: what lies in the arena, what is running on the player, and the moment a
 * shield eats a hit.
 *
 * All simulation-clock driven and free of canvas, so the rules are unit-testable in Node the
 * way `dashCooldown.js` is. `renderer/powerupLayer.js` draws what `snapshot()` reports and
 * decides nothing.
 *
 * Suggested numbers, not design law — see `powerup-integration.md`.
 */

export const AEGIS_DURATION_MS = 6500;

/**
 * Mend has no duration — it is an event, not a state. Nothing about it is a timer; the whole
 * effect is one segment back on the health counter at the instant of collection.
 */
export const MEND_SEGMENTS = 1;
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

/** Matches `PICKUP_COLLECT_RADIUS` in `powerupLayer.js`; larger than the marker is drawn. */
export const COLLECT_RADIUS = 26;

/** How long the shatter is drawn after a hit is absorbed. */
export const SHATTER_MS = 350;

/** How long a Mend marker takes to drain to slate, and to come back from it. */
export const INERT_FADE_MS = 300;

/** How long the one-off Mend arc is drawn on the player. */
export const MEND_ARC_MS = 450;

/**
 * Spawn order. Mend sits between the other two rather than at the end, so it can never be
 * offered twice in a row — a healer on repeat turns a survival runner into a game where
 * getting hit costs nothing.
 */
const KINDS = ['aegis', 'mend', 'overdrive'];

/**
 * The markers on the ground and the buffs on the player.
 *
 * The caller drives it: `reset()` at round start, `step()` once per **simulation** step (not
 * per frame — otherwise a 144 Hz player collects differently from a 60 Hz one), `absorbHit()`
 * when damage is about to be applied, `snapshot()` when drawing.
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
    this._elapsedMs = 0;
    this._nextSpawnMs = SPAWN_INTERVAL_MS;
    this._shatterAtMs = -1;
    this._nextKind = 0;
    this._mendAtMs = -1;
    this._maxHealth = 3;
    this._health = 3;
  }

  /**
   * Clears everything and sizes the world. Belongs in `beginRound()`.
   * @param {number} worldWidth - Arena width in world units.
   * @param {number} worldHeight - Arena height in world units.
   * @param {number} [maxHealth] - Health segments at full, for Mend's spawn rules.
   * @returns {void}
   */
  reset(worldWidth, worldHeight, maxHealth = 3) {
    this._worldWidth = worldWidth;
    this._worldHeight = worldHeight;
    this._markers = [];
    this._buffs.clear();
    this._collects = [];
    this._elapsedMs = 0;
    this._nextSpawnMs = SPAWN_INTERVAL_MS;
    this._shatterAtMs = -1;
    this._nextKind = 0;
    this._mendAtMs = -1;
    this._maxHealth = maxHealth;
    this._health = maxHealth;
  }

  /**
   * Advances one simulation step: expires buffs and markers, spawns, and collects.
   * @param {number} stepSeconds - `SIMULATION_STEP_SECONDS`.
   * @param {number} playerX - Player position.
   * @param {number} playerY - Player position.
   * @param {number} [health] - Current health segments. Mend's spawn and collect rules need
   *   it; it is the only reason this class knows about health at all.
   * @returns {'aegis'|'mend'|'overdrive'|null} The kind collected this step, if any.
   */
  step(stepSeconds, playerX, playerY, health = this._maxHealth) {
    this._elapsedMs += stepSeconds * 1000;
    this._health = health;

    for (const [kind, endsAtMs] of [...this._buffs]) {
      if (this._elapsedMs >= endsAtMs) this._buffs.delete(kind);
    }

    this._markers = this._markers.filter(
      (marker) => this._elapsedMs - marker.spawnedAtMs < MARKER_LIFETIME_MS,
    );
    this._collects = this._collects.filter((pop) => this._elapsedMs - pop.atMs < 300);

    if (this._elapsedMs >= this._nextSpawnMs) {
      this._nextSpawnMs = this._elapsedMs + SPAWN_INTERVAL_MS;
      this._trySpawn(playerX, playerY);
    }

    return this._collect(playerX, playerY);
  }

  /**
   * Spends the shield on an incoming hit. Call **before** applying damage.
   *
   * Duration and charge are one and the same state: a shield that absorbs is over, whatever
   * its arc still showed.
   * @returns {boolean} `true` when the hit was absorbed and must not be applied.
   */
  absorbHit() {
    if (!this._buffs.has('aegis')) return false;

    this._buffs.delete('aegis');
    this._shatterAtMs = this._elapsedMs;

    return true;
  }

  /**
   * Whether a Mend marker currently has anything to give. Drives both the collect check and
   * the slate treatment of the marker.
   * @returns {boolean} `false` at full health.
   */
  canMend() {
    return this._health < this._maxHealth;
  }

  /**
   * Factor on `PLAYER_MAX_SPEED`. Never applied to `PLAYER_DASH_SPEED`.
   * @returns {number} `1` or `OVERDRIVE_FACTOR`.
   */
  speedMultiplier() {
    return this._buffs.has('overdrive') ? OVERDRIVE_FACTOR : 1;
  }

  /**
   * @param {'aegis'|'overdrive'} kind - Which buff.
   * @returns {boolean} Whether it is running.
   */
  isActive(kind) {
    return this._buffs.has(kind);
  }

  /**
   * Starts a buff, or restarts it at full duration if it was already running. Public because
   * a collected marker is not the only imaginable source (a wave reward, a debug key).
   * @param {'aegis'|'overdrive'} kind - Which buff.
   * @returns {void}
   */
  grant(kind) {
    // Mend is an event: there is no buff to hold, only a moment to draw.
    if (kind === 'mend') {
      this._mendAtMs = this._elapsedMs;

      return;
    }

    const duration = kind === 'aegis' ? AEGIS_DURATION_MS : OVERDRIVE_DURATION_MS;

    this._buffs.set(kind, this._elapsedMs + duration);
  }

  /**
   * Everything the renderer needs, as plain data.
   * @returns {{
   *   powerupMarkers: Array<{kind: string, x: number, y: number, spawnScale: number}>,
   *   powerupCollects: Array<{kind: string, x: number, y: number, age: number}>,
   *   powerupBuffs: Record<string, number>,
   *   aegisShatterAge: number | undefined,
   * }} Render state fragment.
   */
  snapshot() {
    // A Mend marker with nothing to give goes slate instead of disappearing: a marker that
    // vanishes in front of you feels stolen, one that goes grey explains itself.
    const inert = this.canMend() ? 0 : 1;

    const markers = this._markers.map((marker) => ({
      kind: marker.kind,
      x: marker.x,
      y: marker.y,
      // Scales in over 450 ms so a marker never simply appears next to the player.
      spawnScale: Math.min(1, (this._elapsedMs - marker.spawnedAtMs) / 450),
      inert: marker.kind === 'mend' ? inert : 0,
    }));

    const buffs = {};
    for (const [kind, endsAtMs] of this._buffs) {
      const duration = kind === 'aegis' ? AEGIS_DURATION_MS : OVERDRIVE_DURATION_MS;
      buffs[kind] = Math.max(0, (endsAtMs - this._elapsedMs) / duration);
    }

    const shatterAge = (this._elapsedMs - this._shatterAtMs) / 1000;
    const mendAge = (this._elapsedMs - this._mendAtMs) / 1000;

    return {
      powerupMarkers: markers,
      powerupCollects: this._collects.map((pop) => ({
        kind: pop.kind,
        x: pop.x,
        y: pop.y,
        age: (this._elapsedMs - pop.atMs) / 1000,
      })),
      powerupBuffs: buffs,
      aegisShatterAge:
        this._shatterAtMs >= 0 && shatterAge * 1000 <= SHATTER_MS ? shatterAge : undefined,
      mendArcAge: this._mendAtMs >= 0 && mendAge * 1000 <= MEND_ARC_MS ? mendAge : undefined,
    };
  }

  _trySpawn(playerX, playerY) {
    if (this._markers.length >= MAX_MARKERS) return;

    // Cycling rather than random: two Aegis in a row is a dead draw for a player at full
    // health, and randomness that produces dead draws is not interesting randomness. A Mend
    // nobody could use is skipped outright rather than spawned dead.
    let kind = KINDS[this._nextKind % KINDS.length];

    if (kind === 'mend' && !this.canMend()) {
      this._nextKind += 1;
      kind = KINDS[this._nextKind % KINDS.length];
    }

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const x = this._worldWidth * (0.1 + this._random() * 0.8);
      const y = this._worldHeight * (0.1 + this._random() * 0.8);

      if (Math.hypot(x - playerX, y - playerY) < MIN_SPAWN_DISTANCE) continue;
      if (this._markers.some((m) => Math.hypot(m.x - x, m.y - y) < MIN_SPAWN_DISTANCE)) continue;

      this._markers.push({ kind, x, y, spawnedAtMs: this._elapsedMs });
      this._nextKind += 1;

      return;
    }
  }

  _collect(playerX, playerY) {
    for (let index = 0; index < this._markers.length; index += 1) {
      const marker = this._markers[index];

      if (Math.hypot(marker.x - playerX, marker.y - playerY) > COLLECT_RADIUS) continue;

      // An inert Mend marker is walked straight through — scenery until health drops.
      if (marker.kind === 'mend' && !this.canMend()) continue;

      this._markers.splice(index, 1);
      this._collects.push({
        kind: marker.kind,
        x: marker.x,
        y: marker.y,
        atMs: this._elapsedMs,
      });
      this.grant(marker.kind);

      return marker.kind;
    }

    return null;
  }
}
