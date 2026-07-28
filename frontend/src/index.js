import { initEngine, resizeEngine, setWave, snapshot, tick } from './engine-bridge.js';
import { Renderer } from './renderer/renderer.js';
import { InputManager } from './input/inputManager.js';
import { PlayerController } from './player/playerController.js';
import { GameState, STATE } from './gameState.js';
import { Hud } from './ui/hud.js';
import { Menu } from './ui/menu.js';
import { FrameTimeGraph } from './ui/frameTimeGraph.js';
import { loadLocale } from './ui/i18n.js';
import { FrameScheduler } from './loop/frameScheduler.js';
import { FrameMetrics } from './loop/frameMetrics.js';
import {
  DEFAULT_FRAME_GRAPH_ENABLED,
  DEFAULT_TARGET_FPS,
  FRAME_GRAPH_SAMPLE_COUNT,
  HIT_COOLDOWN_MS,
  MAX_SIMULATION_STEPS_PER_FRAME,
  PLAYER_STARTING_LIVES,
  RENDER_INTERVAL_TOLERANCE_MS,
  SIMULATION_STEP_MS,
  SIMULATION_STEP_SECONDS,
  START_COUNTDOWN_SECONDS,
  TARGET_FPS_OPTIONS,
  UNCAPPED_TARGET_FPS,
  WAVE_DURATION_SECONDS,
} from './gameConfig.js';

let renderer;
let input;
let player;
let state;
let hud;
let menu;
let frameTimeGraph;
let canvas;
let gameData;

// These live at module scope rather than in gameData: the menu and game-over
// branches have no gameData, and the frame clock has to keep running across
// state changes or the first playing frame would see a multi-second delta.
let targetFps = DEFAULT_TARGET_FPS;
let frameGraphEnabled = DEFAULT_FRAME_GRAPH_ENABLED;
const scheduler = new FrameScheduler(
  SIMULATION_STEP_MS,
  MAX_SIMULATION_STEPS_PER_FRAME,
  UNCAPPED_TARGET_FPS,
  RENDER_INTERVAL_TOLERANCE_MS,
);
// Sampled unconditionally: the cost is two performance.now() calls per frame, and
// keeping it always on means the graph shows real history the moment it is shown.
const frameMetrics = new FrameMetrics(FRAME_GRAPH_SAMPLE_COUNT);

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
  // Created before the menu on purpose: stacking inside #ui-overlay follows DOM
  // order, and the menu overlay has to stay on top of the graph.
  frameTimeGraph = new FrameTimeGraph();
  menu = new Menu();

  window.addEventListener('resize', handleResize);
  handleResize();

  hud.hide();
  frameTimeGraph.hide();
  showStartMenu();

  requestAnimationFrame(loop);
}

function showStartMenu() {
  menu.showStart(
    () => {
      void startGame();
    },
    {
      targetFps: {
        options: TARGET_FPS_OPTIONS,
        selected: targetFps,
        uncappedValue: UNCAPPED_TARGET_FPS,
        onSelect: (fps) => {
          targetFps = fps;
        },
      },
      frameGraph: {
        enabled: frameGraphEnabled,
        onToggle: (enabled) => {
          frameGraphEnabled = enabled;
        },
      },
    },
  );
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

  // Dropped so the graph opens on this round's frames instead of the idle menu
  // ones and the engine-loading spike that precedes them.
  frameMetrics.reset();

  if (frameGraphEnabled) {
    frameTimeGraph.show();
  }
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
    // Seeded from the initial snapshot so the HUD shows the real boid count
    // while the countdown runs and no simulation step has happened yet.
    entityCount: initialFrame.entityCount,
    // Authoritative game clock: advanced by the fixed simulation step, not by
    // wall time, so backgrounding the tab cannot hand out free score.
    simulationTimeMs: 0,
    lastHitAtSimulationMs: -HIT_COOLDOWN_MS,
    // The countdown runs before the simulation starts, so it stays on wall
    // time — three seconds should be three real seconds.
    countdownEndsAt: startedAt + START_COUNTDOWN_SECONDS * 1000,
    roundActive: false,
    currentFrame: initialFrame,
  };
}

function loop(timestamp) {
  const simulationStartedAt = performance.now();

  // The simulation is advanced first and is never gated: the Rust engine runs
  // exactly one fixed step per tick(), so skipping ticks would slow the whole
  // world down instead of just drawing less often.
  if (state.is(STATE.PLAYING)) {
    advanceSimulation(timestamp);
  }

  // Recorded on every animation frame, not only on drawn ones: with rendering
  // throttled there are more simulation frames than bars, and sampling only the
  // drawn ones would hide part of the work the simulation actually did.
  frameMetrics.addSimulationTime(performance.now() - simulationStartedAt);

  // Only drawing follows the chosen target framerate.
  if (scheduler.shouldRenderNow(timestamp, targetFps)) {
    scheduler.markRendered(timestamp);

    const renderStartedAt = performance.now();
    renderCurrentState(timestamp);
    frameMetrics.commitRenderedFrame(performance.now() - renderStartedAt);

    // Drawn after the measurement closes, so the graph never reports its own cost.
    if (frameGraphEnabled) {
      frameTimeGraph.draw(frameMetrics);
    }
  }

  requestAnimationFrame(loop);
}

function advanceSimulation(timestamp) {
  if (!gameData.roundActive) {
    // The world is frozen during the countdown, so no debt may pile up — three
    // seconds of it would open the round with a burst of catch-up steps that
    // teleports boids into the player.
    scheduler.discardPendingTime();
    advanceCountdown(timestamp);
    return;
  }

  const steps = scheduler.beginFrame(timestamp);

  for (let step = 0; step < steps; step += 1) {
    runSimulationStep();

    if (gameData.lives <= 0) {
      scheduler.discardPendingTime();
      endRound();
      return;
    }
  }
}

function runSimulationStep() {
  gameData.simulationTimeMs += SIMULATION_STEP_MS;
  gameData.timerSeconds = gameData.simulationTimeMs / 1000;
  gameData.score = Math.floor(gameData.timerSeconds);

  // The player has to move inside the same fixed step as the flock: its
  // position is an input to tick() and to the engine's collision test, so
  // integrating it per rendered frame would desync the two.
  const playerPosition = player.update(
    input.getMovementDirection(),
    SIMULATION_STEP_SECONDS,
    {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  );

  // Runs per step so newly spawned boids exist before this step's tick(), and
  // so setWave sees the current player position for safe-spawn placement.
  updateWaveProgression(playerPosition);

  const frame = tick(playerPosition);
  gameData.currentFrame = frame;
  gameData.entityCount = frame.entityCount;

  // Every step's hit count is consumed here. Reading only the last frame of a
  // multi-step frame would silently drop a hit from an earlier step.
  if (frame.hitCount > 0 && !isPlayerInvulnerable()) {
    gameData.lives -= 1;
    gameData.lastHitAtSimulationMs = gameData.simulationTimeMs;
  }
}

function isPlayerInvulnerable() {
  return gameData.simulationTimeMs - gameData.lastHitAtSimulationMs < HIT_COOLDOWN_MS;
}

function renderCurrentState(timestamp) {
  if (!state.is(STATE.PLAYING)) {
    renderer.drawFrame(emptyFrame, player.getPosition());
    return;
  }

  const playerPosition = player.getPosition();

  if (gameData.roundActive) {
    renderer.drawFrame(gameData.currentFrame, playerPosition, {
      playerInvulnerable: isPlayerInvulnerable(),
      lives: gameData.lives,
      maxLives: gameData.maxLives,
    });
  } else {
    renderer.drawFrame(gameData.currentFrame, playerPosition, {
      lives: gameData.lives,
      maxLives: gameData.maxLives,
      countdownSeconds: Math.ceil((gameData.countdownEndsAt - timestamp) / 1000),
      playerInvulnerable: true,
    });
  }

  hud.update(gameData);
}

function advanceCountdown(timestamp) {
  if (gameData.countdownEndsAt - timestamp <= 0) {
    beginRound();
  }
}

function beginRound() {
  gameData.roundActive = true;
  gameData.simulationTimeMs = 0;
  gameData.lastHitAtSimulationMs = -HIT_COOLDOWN_MS;
  scheduler.discardPendingTime();
}

function endRound() {
  state.transition(STATE.GAME_OVER);
  hud.hide();
  frameTimeGraph.hide();
  menu.showGameOver(() => {
    void restartGame();
  }, gameData.score);
}

function updateWaveProgression(playerPosition) {
  const nextWave = Math.floor(gameData.timerSeconds / WAVE_DURATION_SECONDS) + 1;

  if (nextWave <= gameData.wave) {
    return;
  }

  gameData.wave = nextWave;
  setWave(gameData.wave, playerPosition);
}

function handleResize() {
  renderer.resize(window.innerWidth, window.innerHeight);
  resizeEngine(window.innerWidth, window.innerHeight);
  // Its size is fixed, but a window moved to another monitor can change the
  // device pixel ratio, which would leave the graph blurry.
  frameTimeGraph.resize();

  if (player) {
    player.clampToBounds({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }
}

bootstrap();
