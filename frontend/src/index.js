import { initEngine, tick } from './engine-bridge.js';
import { Renderer } from './renderer/renderer.js';
import { InputManager } from './input/inputManager.js';
import { GameState, STATE } from './gameState.js';

let renderer;
let input;
let state;
let engineReady = false;

async function bootstrap() {
  await initEngine();
  renderer = new Renderer(document.getElementById('game-canvas'));
  input = new InputManager();
  state = new GameState();
  engineReady = true;
  requestAnimationFrame(loop);
}

function loop() {
  if (!engineReady) return;

  if (state.current === STATE.PLAYING) {
    const playerPos = input.getPlayerPosition();
    const frame = tick(playerPos);
    renderer.drawFrame(frame);
  }

  requestAnimationFrame(loop);
}

bootstrap();
