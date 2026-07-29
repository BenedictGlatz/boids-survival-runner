import { INITIAL_BOID_COUNT } from './gameConfig.js';

let wasmModule;
let engine;

/**
 * Loads and instantiates the WASM module, and spawns the initial flock.
 * Safe to call more than once — the module itself is only loaded on the first call.
 * @param {number} width - Initial world width in pixels.
 * @param {number} height - Initial world height in pixels.
 * @param {{x: number, y: number}} playerPosition - Starting player position.
 * @returns {Promise<void>}
 */
export async function initEngine(width, height, playerPosition) {
  if (!wasmModule) {
    wasmModule = await import('./wasm/engine/boids_survival_runner_engine.js');
    await wasmModule.default();
  }

  engine = new wasmModule.GameEngine(
    Math.floor(width),
    Math.floor(height),
    INITIAL_BOID_COUNT,
    playerPosition.x,
    playerPosition.y,
  );
}

/**
 * @param {number} width - New world width in pixels.
 * @param {number} height - New world height in pixels.
 */
export function resizeEngine(width, height) {
  if (!engine) return;

  engine.resize(Math.floor(width), Math.floor(height));
}

/**
 * Advances the simulation by exactly one fixed step.
 * @param {{x: number, y: number}} playerPosition - Current player position.
 * @returns {{entityCount: number, hitCount: number, hit: boolean, positions: Float32Array,
 *   velocities: Float32Array, tiers: Uint32Array, dashPhases: Float32Array}} The new frame.
 */
export function tick(playerPosition) {
  if (!engine) {
    throw new Error('Engine has not been initialised.');
  }

  const response = engine.tick(playerPosition.x, playerPosition.y);

  return normalizeFrameResponse(response);
}

/**
 * Reads the current flock state without advancing the simulation, for rendering
 * a frame during a pause (e.g. countdown) when no `tick()` is due.
 * @returns {{entityCount: number, hitCount: number, hit: boolean, positions: Float32Array,
 *   velocities: Float32Array, tiers: Uint32Array, dashPhases: Float32Array}} The current frame.
 */
export function snapshot() {
  if (!engine) {
    throw new Error('Engine has not been initialised.');
  }

  return normalizeFrameResponse(engine.snapshot());
}

/**
 * Advances to a new wave: spawns its boid variants away from the player.
 * @param {number} wave - The new wave number.
 * @param {{x: number, y: number}} playerPosition - Current player position.
 */
export function setWave(wave, playerPosition) {
  if (!engine) return;

  engine.set_wave(wave, playerPosition.x, playerPosition.y);
}

function normalizeFrameResponse(response) {
  return {
    entityCount: response.entity_count,
    hitCount: response.hit_count,
    hit: response.hit,
    positions: response.positions(),
    velocities: response.velocities(),
    tiers: response.tiers(),
    dashPhases: response.dash_phases(),
  };
}