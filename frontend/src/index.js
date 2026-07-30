import { initEngine, setWave, snapshot, tick } from './engine-bridge.js';
import { Renderer } from './renderer/renderer.js';
import { InputManager } from './input/inputManager.js';
import { buildControls } from './input/controls.js';
import { PlayerController } from './player/playerController.js';
import {
  advanceClock,
  beginRound as beginRoundData,
  countdownSecondsLeft,
  createRoundData,
  dueWaveNumber,
  isPlayerDashReady,
  isPlayerDead,
  isPlayerInvulnerable,
  playerDashCooldownProgress,
  registerDash,
  registerHit,
} from './round/roundData.js';
import { readRecords, recordRound } from './round/roundRecords.js';
import { GameState, STATE } from './gameState.js';
import { Hud } from './ui/hud.js';
import { Menu } from './ui/menu.js';
import { MenuBackdrop } from './ui/menuBackdrop.js';
import { FrameTimeGraph } from './ui/frameTimeGraph.js';
import { loadLocale } from './ui/i18n.js';
import { FrameScheduler } from './loop/frameScheduler.js';
import { FrameMetrics } from './loop/frameMetrics.js';
import {
  DEFAULT_FRAME_GRAPH_ENABLED,
  DEFAULT_FRAME_GRAPH_MODE,
  DEFAULT_TARGET_FPS,
  FRAME_GRAPH_SAMPLE_COUNT,
  MAX_SIMULATION_STEPS_PER_FRAME,
  RENDER_INTERVAL_TOLERANCE_MS,
  SIMULATION_STEP_MS,
  SIMULATION_STEP_SECONDS,
  TARGET_FPS_OPTIONS,
  UNCAPPED_TARGET_FPS,
  WORLD_BOUNDS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './gameConfig.js';

let renderer;
let input;
let player;
let state;
let hud;
let menu;
let menuBackdrop;
let frameTimeGraph;
let canvas;
let gameData;

// These live at module scope rather than in gameData: the menu and game-over
// branches have no gameData, and the frame clock has to keep running across
// state changes or the first playing frame would see a multi-second delta.
let targetFps = DEFAULT_TARGET_FPS;
let frameGraphEnabled = DEFAULT_FRAME_GRAPH_ENABLED;
let frameGraphMode = DEFAULT_FRAME_GRAPH_MODE;
const scheduler = new FrameScheduler(
  SIMULATION_STEP_MS,
  MAX_SIMULATION_STEPS_PER_FRAME,
  UNCAPPED_TARGET_FPS,
  RENDER_INTERVAL_TOLERANCE_MS,
);
// Sampled unconditionally: the cost is two performance.now() calls per frame, and
// keeping it always on means the graph shows real history the moment it is shown.
const frameMetrics = new FrameMetrics(FRAME_GRAPH_SAMPLE_COUNT);

async function bootstrap() {
  await loadLocale('en');

  canvas = document.getElementById('game-canvas');
  renderer = new Renderer(canvas);
  input = new InputManager();
  player = new PlayerController();
  player.reset(WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5);
  state = new GameState();
  hud = new Hud();
  // Created before the menu on purpose: stacking inside #ui-overlay follows DOM
  // order, and the menu overlay has to stay on top of the graph.
  frameTimeGraph = new FrameTimeGraph();
  menu = new Menu();
  menuBackdrop = new MenuBackdrop();

  window.addEventListener('resize', handleResize);
  handleResize();

  hud.hide();
  frameTimeGraph.hide();
  showStartMenu();

  requestAnimationFrame(loop);
}

function showStartMenu() {
  // The swarm behind the deck. It only runs while the menu is up — nobody watches a
  // decoration during a round, and it would compete with the simulation for frames.
  menuBackdrop.start();

  // Back to the menu state, so the renderer stops drawing the frozen frame of the round
  // that just ended: that picture belongs to the game-over card, not to the start screen.
  state.transition(STATE.MENU);

  menu.showStart(
    () => {
      void startGame();
    },
    menuSettings(),
    // Read on every open rather than cached: the round that just ended wrote to it.
    readRecords(),
  );
}

function menuSettings() {
  return {
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
    frameGraphMode: {
      selected: frameGraphMode,
      onSelect: (mode) => {
        frameGraphMode = mode;
      },
    },
  };
}

async function startGame() {
  const playerStartPosition = {
    x: WORLD_WIDTH * 0.5,
    y: WORLD_HEIGHT * 0.5,
  };

  player.reset(playerStartPosition.x, playerStartPosition.y);
  // Before the first frame of the new round is drawn: the engine below hands out boid indices
  // again, so the ribbons still in the history belong to boids that no longer exist.
  renderer.resetTrails();
  await initEngine(WORLD_WIDTH, WORLD_HEIGHT, playerStartPosition);
  gameData = createRoundData(performance.now(), snapshot());
  state.transition(STATE.PLAYING);
  // Claims the space bar for the dash. Outside a round it has to stay with the
  // menu, where every button and the developer section are activated with it.
  input.setGameplayActive(true);
  menu.hide();
  menuBackdrop.stop();
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
    // Read before the frame is marked as drawn, or it would measure against itself. The dash
    // trail's launch ring runs on this wall-clock delta rather than on the simulation clock:
    // it is presentation, and presentation follows the frame rate.
    const renderDeltaSeconds = scheduler.secondsSinceRender(timestamp);
    scheduler.markRendered(timestamp);

    const renderStartedAt = performance.now();
    renderCurrentState(timestamp, renderDeltaSeconds);
    frameMetrics.commitRenderedFrame(performance.now() - renderStartedAt);

    // Drawn after the measurement closes, so the graph never reports its own cost.
    if (frameGraphEnabled) {
      frameTimeGraph.draw(frameMetrics, {
        mode: frameGraphMode,
        targetFps,
      });
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

    if (isPlayerDead(gameData)) {
      scheduler.discardPendingTime();
      endRound();
      return;
    }
  }
}

function runSimulationStep() {
  advanceClock(gameData);

  // Read once per step: the dash request is a latch, so consuming it here is what
  // keeps one key press from firing a dash in every step of a multi-step frame.
  const controls = buildControls(input);
  const dashing = controls.dashRequested && isPlayerDashReady(gameData);

  if (dashing) {
    registerDash(gameData);
  }

  // Captured before the player integrates: the engine tests the whole move against
  // the obstacles, not just where it ended, which is what catches a dash fast enough
  // to cross a thin obstacle inside a single step.
  const previousPosition = player.getPosition();

  // The player has to move inside the same fixed step as the flock: its
  // position is an input to tick() and to the engine's collision test, so
  // integrating it per rendered frame would desync the two.
  const attemptedPosition = player.update(
    { direction: controls.direction, dash: dashing },
    SIMULATION_STEP_SECONDS,
    WORLD_BOUNDS,
  );

  // Runs per step so newly spawned boids exist before this step's tick(), and
  // so setWave sees the current player position for safe-spawn placement.
  updateWaveProgression(attemptedPosition);

  const frame = tick(previousPosition, attemptedPosition);
  gameData.currentFrame = frame;
  gameData.entityCount = frame.entityCount;

  // The engine may have pushed the player back out of an obstacle. Taking its answer
  // is what keeps the position the renderer draws and the one the flock steered
  // against from drifting apart over a run.
  if (frame.obstacleHit) {
    player.applyObstacleBlock(frame.playerPosition, frame.blockNormal);
  }

  // Every step's hits are consumed here, and both sources share one entry point so
  // they share the invulnerability window. Reading only the last frame of a multi-step
  // frame would silently drop a hit from an earlier step.
  if (frame.hitCount > 0 || frame.obstacleHit) {
    registerHit(gameData);
  }
}

function renderCurrentState(timestamp, renderDeltaSeconds) {
  // After a death the last frame keeps being drawn, dimmed by the card's own scrim: the
  // swarm and the obstacles that killed you stay on screen instead of the arena going
  // empty. Nothing advances — the simulation stopped, and the picture says so.
  if (state.is(STATE.GAME_OVER)) {
    renderer.drawFrame(gameData.currentFrame, player.getPosition(), {
      lives: gameData.lives,
      maxLives: gameData.maxLives,
    });
    return;
  }

  // On the menu the game canvas only gets out of the way: the swarm behind the deck comes
  // from `ui/menuBackdrop.js`, on a canvas further back, and drawing an opaque arena
  // background here would hide it.
  if (!state.is(STATE.PLAYING)) {
    renderer.clear();
    return;
  }

  const playerPosition = player.getPosition();
  // Built once and handed to both the renderer and the HUD: the dash bar moved into the
  // HUD, but the player's own state is still drawn on the canvas, and they have to agree
  // within a frame.
  // `deltaSeconds`, `playerSpeed` and the velocity are what the dash trail needs, and they are
  // handed over only while the world is actually moving: their absence is how the renderer
  // knows not to sample a frozen frame. The velocity comes from here rather than being read
  // in the renderer, which has no business reaching into the simulation side.
  const renderState = gameData.roundActive
    ? {
        playerInvulnerable: isPlayerInvulnerable(gameData),
        lives: gameData.lives,
        maxLives: gameData.maxLives,
        dashCooldownProgress: playerDashCooldownProgress(gameData),
        deltaSeconds: renderDeltaSeconds,
        playerSpeed: Math.hypot(player.velocity.x, player.velocity.y),
        playerVelocityX: player.velocity.x,
        playerVelocityY: player.velocity.y,
      }
    : {
        lives: gameData.lives,
        maxLives: gameData.maxLives,
        countdownSeconds: countdownSecondsLeft(gameData, timestamp),
        playerInvulnerable: true,
        dashCooldownProgress: 1,
      };

  renderer.drawFrame(gameData.currentFrame, playerPosition, renderState);
  hud.update(gameData, renderState);
}

function advanceCountdown(timestamp) {
  if (gameData.countdownEndsAt - timestamp <= 0) {
    beginRound();
  }
}

function beginRound() {
  beginRoundData(gameData);
  scheduler.discardPendingTime();
}

function endRound() {
  state.transition(STATE.GAME_OVER);
  // Hands the space bar back to the menu, whose buttons are activated with it.
  input.setGameplayActive(false);
  hud.hide();
  frameTimeGraph.hide();

  const run = {
    score: gameData.score,
    wave: gameData.wave,
    timeSeconds: gameData.timerSeconds,
    boids: gameData.entityCount,
  };

  menu.showGameOver(
    {
      onRestart: () => {
        void restartGame();
      },
      onMainMenu: showStartMenu,
    },
    // Written and read in one call, so the card shows the record including this round —
    // a run that just set one has to see it.
    { run, records: recordRound(run) },
  );
}

function updateWaveProgression(playerPosition) {
  const nextWave = dueWaveNumber(gameData);

  if (nextWave <= gameData.wave) {
    return;
  }

  gameData.wave = nextWave;
  setWave(gameData.wave, playerPosition);
}

/**
 * Only the picture reacts to a resize, never the simulation: the world is a fixed
 * WORLD_WIDTH × WORLD_HEIGHT and the renderer scales it into whatever the window happens
 * to be. Nothing here may touch the engine or the player — that a resize can no longer
 * move anything in the world is the whole point of the fixed world size.
 */
function handleResize() {
  renderer.resize(window.innerWidth, window.innerHeight);
  // Its size is fixed, but a window moved to another monitor can change the
  // device pixel ratio, which would leave the graph blurry.
  frameTimeGraph.resize();
}

bootstrap();
