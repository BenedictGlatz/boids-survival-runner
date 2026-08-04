import { MAX_BOID_DIFFICULTY_TIER } from '../gameConfig.js';

/**
 * Which boid variant a wave sends into the arena.
 *
 * This mirrors `difficulty_tier_for_wave` in `engine/src/wasm_bridge/boid_factory.rs`, and the
 * duplication is deliberate: the ramp is one subtraction and one clamp, while the alternative
 * would be a seventh value on the frame boundary for something the frontend already knows —
 * it owns the wave counter itself (`round/roundData.js`), so it can answer the question
 * without asking the engine. If the ramp in the engine ever stops being a straight line, this
 * is the file that has to follow it.
 *
 * Nothing here is a simulation rule; it is the design ramp seen from the display side.
 */

/**
 * The difficulty tier a wave's boids are built at, counting from zero.
 *
 * Tier is one below the wave number and stops climbing at `MAX_BOID_DIFFICULTY_TIER`, so from
 * wave five on the swarm only grows in numbers and no longer in kind. The return value is
 * always a valid index into `BOID_COLORS`, which is why callers may look a colour up with it
 * without clamping again.
 * @param {number} wave - The wave number, counting from 1.
 * @returns {number} A tier between 0 and `MAX_BOID_DIFFICULTY_TIER`.
 */
export function spawnTierForWave(wave) {
  const safeWave = Math.max(1, Math.floor(wave ?? 1));

  return Math.min(safeWave - 1, MAX_BOID_DIFFICULTY_TIER);
}

/**
 * The same variant as a number to show a player, counting from one.
 *
 * The engine counts tiers from zero because they are array indices; a player reads "level 1"
 * for the first kind of enemy, not "level 0". The offset lives here rather than in the HUD, so
 * there is exactly one place where the two ways of counting meet.
 * @param {number} wave - The wave number, counting from 1.
 * @returns {number} A level between 1 and `MAX_BOID_DIFFICULTY_TIER + 1`.
 */
export function spawnLevelForWave(wave) {
  return spawnTierForWave(wave) + 1;
}
