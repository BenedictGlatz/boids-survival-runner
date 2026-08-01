import { INITIAL_BOID_COUNT } from './gameConfig.js';

// The module load, kept as the promise rather than as the loaded module. A flag or a
// module variable is only set once the load has *finished*, so two calls that start
// while the first is still loading would both find it unset and both load — and
// `wasm-bindgen`'s generated init only guards against a *finished* one
// (`if (wasm !== undefined) return wasm`), so the second call instantiates a second
// WebAssembly module with its own memory. From then on the two are mixed: pointers made
// against one instance are used with the other, and the finalizers of the discarded
// instance free those addresses inside the surviving heap. That corruption surfaces
// minutes later as a bare `RuntimeError` out of `tick()`, which is exactly what it did.
// Awaiting one shared promise means every caller gets the same single instance.
let modulePromise;
let engine;

/**
 * Loads and instantiates the WASM module, and spawns the initial flock.
 *
 * Safe to call more than once, and safe to call again while an earlier call is still
 * running: the module is loaded and instantiated exactly once per session.
 * @param {number} width - World width in world units. Fixed for the whole session; see
 *   `WORLD_WIDTH` in `gameConfig.js` for why it no longer follows the window.
 * @param {number} height - World height in world units.
 * @param {{x: number, y: number}} playerPosition - Starting player position.
 * @returns {Promise<void>}
 */
export async function initEngine(width, height, playerPosition) {
  const wasmModule = await loadWasmModule();

  engine = new wasmModule.GameEngine(
    Math.floor(width),
    Math.floor(height),
    INITIAL_BOID_COUNT,
    playerPosition.x,
    playerPosition.y,
  );
}

/** The one module load of the session, started on the first call and shared by the rest. */
function loadWasmModule() {
  if (!modulePromise) {
    modulePromise = (async () => {
      const wasmModule = await import('./wasm/engine/boids_survival_runner_engine.js');
      await wasmModule.default();
      return wasmModule;
    })();
  }

  return modulePromise;
}

// There is deliberately no `resizeEngine` wrapper any more. The world is a fixed size and
// the renderer letterboxes it into the window, so a resize must not reach the simulation —
// an exported wrapper with no caller would only invite one. `GameEngine::resize()` itself
// stays on the Rust side, where its doc comment explains why.

/**
 * Advances the simulation by exactly one fixed step.
 *
 * Both player positions are passed because the engine owns the obstacles and
 * therefore resolves the move against them: it needs the whole path to tell a player
 * who walked into an obstacle from one who was already standing in it, and to catch a
 * dash fast enough to cross a thin obstacle between two steps. The returned frame
 * carries the corrected position, so the caller has to use `frame.playerPosition`
 * rather than what it asked for.
 * @param {{x: number, y: number}} previousPosition - Where the player was before this step.
 * @param {{x: number, y: number}} attemptedPosition - Where the player tried to move to.
 * @returns {object} The new frame, including the resolved player position.
 */
export function tick(previousPosition, attemptedPosition) {
  if (!engine) {
    throw new Error('Engine has not been initialised.');
  }

  const response = engine.tick(
    previousPosition.x,
    previousPosition.y,
    attemptedPosition.x,
    attemptedPosition.y,
  );

  return normalizeFrameResponse(response, attemptedPosition);
}

/**
 * Reads the current flock state without advancing the simulation, for rendering
 * a frame during a pause (e.g. countdown) when no `tick()` is due.
 * @returns {object} The current frame.
 */
export function snapshot() {
  if (!engine) {
    throw new Error('Engine has not been initialised.');
  }

  // A snapshot moves nobody, so there is no move to resolve and no position to
  // report back. Callers already know where the player is in that case.
  return normalizeFrameResponse(engine.snapshot(), null);
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

function normalizeFrameResponse(response, attemptedPosition) {
  return {
    entityCount: response.entity_count,
    hitCount: response.hit_count,
    hit: response.hit,
    positions: response.positions(),
    velocities: response.velocities(),
    tiers: response.tiers(),
    dashPhases: response.dash_phases(),
    obstacleCount: response.obstacle_count,
    obstacles: response.obstacles(),
    obstacleHit: response.obstacle_hit,
    // Falls back to the attempted position for a snapshot, which resolves nothing, so
    // callers never have to check which kind of frame they are holding.
    playerPosition: attemptedPosition
      ? { x: response.player_x, y: response.player_y }
      : attemptedPosition,
    blockNormal: { x: response.block_normal_x, y: response.block_normal_y },
  };
}
