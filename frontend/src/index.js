import { initEngine, resizeEngine, setWave, snapshot, tick } from './engine-bridge.js';
import { Renderer } from './renderer/renderer.js';
import { InputManager } from './input/inputManager.js';
import { PlayerController } from './player/playerController.js';
import { GameState, STATE } from './gameState.js';
import { Hud } from './ui/hud.js';
import { Menu } from './ui/menu.js';
import { loadLocale } from './ui/i18n.js';
import {
  HIT_COOLDOWN_MS,
  PLAYER_STARTING_LIVES,
  START_COUNTDOWN_SECONDS,
  WAVE_DURATION_SECONDS,
} from './gameConfig.js';

let renderer;
let input;
let player;
let state;
let hud;
let menu;
let canvas;
let gameData;

const emptyFrame = {
  entityCount: 0,
  hitCount: 0,
  hit: false,
  positions: new Float32Array(),
  velocities: new Float32Array(),
  tiers: new Uint32Array(),
};

async function bootstrap() {
  await loadLocale('en');

  canvas = document.getElementById('game-canvas');
  renderer = new Renderer(canvas);
  input = new InputManager();
  player = new PlayerController();
  player.reset(window.innerWidth * 0.5, window.innerHeight * 0.5);
  state = new GameState();
  hud = new Hud();
  menu = new Menu();

  window.addEventListener('resize', handleResize);
  handleResize();

  hud.hide();
  menu.showStart(() => {
    void startGame();
  });

  requestAnimationFrame(loop);
}

async function startGame() {
  const playerStartPosition = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
  };

  player.reset(playerStartPosition.x, playerStartPosition.y);
  await initEngine(window.innerWidth, window.innerHeight, playerStartPosition);
  resetGameData(performance.now(), snapshot());
  state.transition(STATE.PLAYING);
  menu.hide();
  hud.show();
}

async function restartGame() {
  await startGame();
}

function resetGameData(startedAt, initialFrame) {
  gameData = {
    score: 0,
    lives: PLAYER_STARTING_LIVES,
    maxLives: PLAYER_STARTING_LIVES,
    timerSeconds: 0,
    wave: 1,
    entityCount: 0,
    startedAt,
    lastFrameAt: startedAt,
    lastHitAt: -HIT_COOLDOWN_MS,
    countdownEndsAt: startedAt + START_COUNTDOWN_SECONDS * 1000,
    roundActive: false,
    currentFrame: initialFrame,
  };
}

function loop(timestamp) {
  if (state.is(STATE.PLAYING)) {
    updatePlayingFrame(timestamp);
  } else {
    renderer.drawFrame(emptyFrame, player.getPosition());
  }

  requestAnimationFrame(loop);
}

function updatePlayingFrame(timestamp) {
  if (!gameData.roundActive) {
    updateCountdownFrame(timestamp);
    return;
  }

  const playerPosition = updatePlayerPosition(timestamp);
  gameData.timerSeconds = (timestamp - gameData.startedAt) / 1000;
  gameData.score = Math.floor(gameData.timerSeconds);

  updateWaveProgression(playerPosition);

  const frame = tick(playerPosition);
  const playerInvulnerable = timestamp - gameData.lastHitAt < HIT_COOLDOWN_MS;
  gameData.entityCount = frame.entityCount;
  gameData.currentFrame = frame;

  if (frame.hitCount > 0 && !playerInvulnerable) {
    gameData.lives -= 1;
    gameData.lastHitAt = timestamp;
  }

  renderer.drawFrame(frame, playerPosition, {
    playerInvulnerable: timestamp - gameData.lastHitAt < HIT_COOLDOWN_MS,
    lives: gameData.lives,
    maxLives: gameData.maxLives,
  });
  hud.update(gameData);

  if (gameData.lives <= 0) {
    state.transition(STATE.GAME_OVER);
    hud.hide();
    menu.showGameOver(() => {
      void restartGame();
    }, gameData.score);
  }
}

function updateCountdownFrame(timestamp) {
  const playerPosition = player.getPosition();
  const remainingMilliseconds = gameData.countdownEndsAt - timestamp;

  if (remainingMilliseconds <= 0) {
    beginRound(timestamp);
    return;
  }

  gameData.timerSeconds = 0;
  gameData.score = 0;
  gameData.entityCount = gameData.currentFrame.entityCount;

  renderer.drawFrame(gameData.currentFrame, playerPosition, {
    lives: gameData.lives,
    maxLives: gameData.maxLives,
    countdownSeconds: Math.ceil(remainingMilliseconds / 1000),
    playerInvulnerable: true,
  });
  hud.update(gameData);
}

function beginRound(timestamp) {
  gameData.roundActive = true;
  gameData.startedAt = timestamp;
  gameData.lastFrameAt = timestamp;
  gameData.lastHitAt = timestamp;
}

function updateWaveProgression(playerPosition) {
  const nextWave = Math.floor(gameData.timerSeconds / WAVE_DURATION_SECONDS) + 1;

  if (nextWave <= gameData.wave) {
    return;
  }

  gameData.wave = nextWave;
  setWave(gameData.wave, playerPosition);
}

function updatePlayerPosition(timestamp) {
  const elapsedSeconds = (timestamp - gameData.lastFrameAt) / 1000;
  gameData.lastFrameAt = timestamp;

  return player.update(input.getMovementDirection(), elapsedSeconds, {
    width: window.innerWidth,
    height: window.innerHeight,
  });
}

function handleResize() {
  renderer.resize(window.innerWidth, window.innerHeight);
  resizeEngine(window.innerWidth, window.innerHeight);

  if (player) {
    player.clampToBounds({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }
}

bootstrap();
