import { initEngine, snapshot } from './engine-bridge.js';
import { Renderer } from './renderer/renderer.js';
import { InputManager } from './input/inputManager.js';
import { PlayerController } from './player/playerController.js';
import {
  beginRound as beginRoundData,
  createRoundData,
  isPlayerDead,
  runSummary,
} from './round/roundData.js';
import { readRecords, recordRound } from './round/roundRecords.js';
import { PowerupField } from './powerups/powerups.js';
import { GameState, STATE } from './gameState.js';
import { Hud } from './ui/hud.js';
import { Menu } from './ui/menu.js';
import { MenuBackdrop } from './ui/menuBackdrop.js';
import { MenuSettings } from './ui/menuSettings.js';
import { FrameTimeGraph } from './ui/frameTimeGraph.js';
import { loadLocale } from './ui/i18n.js';
import { FrameScheduler } from './loop/frameScheduler.js';
import { buildFrozenRenderState, buildRenderState } from './loop/renderState.js';
import { runSimulationStep } from './loop/simulationStep.js';
import { FrameMetrics } from './loop/frameMetrics.js';
import { measureRefreshRateHz } from './loop/refreshRate.js';
import {
  FRAME_GRAPH_SAMPLE_COUNT,
  MAX_SIMULATION_STEPS_PER_FRAME,
  RENDER_INTERVAL_TOLERANCE_MS,
  SIMULATION_STEP_MS,
  UNCAPPED_TARGET_FPS,
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
const settings = new MenuSettings();
const scheduler = new FrameScheduler(
  SIMULATION_STEP_MS,
  MAX_SIMULATION_STEPS_PER_FRAME,
  UNCAPPED_TARGET_FPS,
  RENDER_INTERVAL_TOLERANCE_MS,
);
// Sampled unconditionally: the cost is two performance.now() calls per frame, and
// keeping it always on means the graph shows real history the moment it is shown.
const frameMetrics = new FrameMetrics(FRAME_GRAPH_SAMPLE_COUNT);
// Round state, but built once like the scheduler rather than with gameData: it is cleared in
// beginRound(), which is where the simulation clock it measures against jumps back to zero.
const powerups = new PowerupField();

async function bootstrap() {
  // Measured next to the locale fetch, not after it: the probe waits for a dozen
  // animation frames, and hiding that behind the network round trip means the menu
  // opens no later than it did before.
  const [, refreshRateHz] = await Promise.all([loadLocale('en'), measureRefreshRateHz()]);
  settings.applyDisplayLimits(refreshRateHz);

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
    settings.toMenuOptions(),
    // Read on every open rather than cached: the round that just ended wrote to it.
    readRecords(),
  );
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

  if (settings.frameGraphEnabled) {
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
  if (scheduler.shouldRenderNow(timestamp, settings.targetFps)) {
    // Read before the frame is marked as drawn, or it would measure against itself. The dash
    // trail's launch ring runs on this wall-clock delta rather than on the simulation clock:
    // it is presentation, and presentation follows the frame rate.
    const renderDeltaSeconds = scheduler.secondsSinceRender(timestamp);
    scheduler.markRendered(timestamp);

    const renderStartedAt = performance.now();
    renderCurrentState(timestamp, renderDeltaSeconds);
    frameMetrics.commitRenderedFrame(performance.now() - renderStartedAt);

    // Drawn after the measurement closes, so the graph never reports its own cost.
    if (settings.frameGraphEnabled) {
      frameTimeGraph.draw(frameMetrics, {
        mode: settings.frameGraphMode,
        targetFps: settings.targetFps,
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
    runSimulationStep(gameData, input, player, powerups);

    if (isPlayerDead(gameData)) {
      scheduler.discardPendingTime();
      endRound();
      return;
    }
  }
}

function renderCurrentState(timestamp, renderDeltaSeconds) {
  // After a death the last frame keeps being drawn, dimmed by the card's own scrim: the
  // swarm and the obstacles that killed you stay on screen instead of the arena going
  // empty. Nothing advances — the simulation stopped, and the picture says so.
  if (state.is(STATE.GAME_OVER)) {
    const frozen = buildFrozenRenderState(gameData, powerups);
    renderer.drawFrame(gameData.currentFrame, player.getPosition(), frozen);
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
  const renderState = buildRenderState(gameData, player, powerups, {
    renderDeltaSeconds,
    timestamp,
  });

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
  // Here and not in startGame(): every power-up timestamp is measured against
  // simulationTimeMs, and that is the clock beginRoundData just set back to zero.
  powerups.reset(WORLD_WIDTH, WORLD_HEIGHT);
  scheduler.discardPendingTime();
}

function endRound() {
  state.transition(STATE.GAME_OVER);
  // Hands the space bar back to the menu, whose buttons are activated with it.
  input.setGameplayActive(false);
  hud.hide();
  frameTimeGraph.hide();

  const run = runSummary(gameData);

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
