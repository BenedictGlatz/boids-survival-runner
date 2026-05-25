import { INITIAL_BOID_COUNT } from './gameConfig.js';

let wasmModule;
let engine;

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

export function resizeEngine(width, height) {
  if (!engine) return;

  engine.resize(Math.floor(width), Math.floor(height));
}

export function tick(playerPosition) {
  if (!engine) {
    throw new Error('Engine has not been initialised.');
  }

  const response = engine.tick(playerPosition.x, playerPosition.y);

  return normalizeFrameResponse(response);
}

export function snapshot() {
  if (!engine) {
    throw new Error('Engine has not been initialised.');
  }

  return normalizeFrameResponse(engine.snapshot());
}

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
    tiers: response.tiers(),
  };
}