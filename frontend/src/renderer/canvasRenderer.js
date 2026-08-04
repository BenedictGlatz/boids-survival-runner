import {
  BOID_TAIL_INSET,
  BOID_VISUAL_LENGTH,
  BOID_VISUAL_WIDTH,
  PLAYER_VISUAL_RADIUS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../gameConfig.js';
import { ArenaBackground } from './arenaBackground.js';
import { dashPulseScale } from './dashPulse.js';
import { dashTrails } from './dashTrailHistory.js';
import { DrawCallCounter } from './drawCallCounter.js';
import {
  BOID_COLORS,
  glowColorForBoid,
  PLAYER_COLOR,
  PLAYER_HIT_COLOR,
  PLAYER_OUTLINE_COLOR,
  trailColorForTier,
} from './entityPalette.js';
import { drawObstacles } from './obstacleLayer.js';
import { drawPlayerStatusBars } from './playerStatusBars.js';
import { drawPlayerBuffs } from './powerupLayer.js';
import { drawPowerupMarkers } from './powerupMarkerLayer.js';
import { drawSpawnMarkers } from './spawnMarkerLayer.js';
import { drawDashTrails } from './trailLayer.js';
import { sampleDashTrails } from './trailSampling.js';
import { fitWorldToCanvas, worldTransformMatrix } from './worldTransform.js';

const BOID_OUTLINE_COLOR = 'rgba(255, 255, 255, 0.22)';
const BOID_OUTLINE_WIDTH = 1.5;

/**
 * The countdown is the one moment the arena is empty, so it is allowed to be large.
 *
 * A canvas cannot read a CSS custom property, which is why the family is spelled out
 * here as well as in `styles/tokens.css` — the same duplication the arena colours above
 * carry, for the same reason.
 */
const COUNTDOWN_FONT = "700 96px 'Space Grotesk', sans-serif";
const COUNTDOWN_COLOR = '#f2f4f8';
const COUNTDOWN_SCRIM_COLOR = 'rgba(7, 8, 11, 0.5)';
/** Cyan glow, because the countdown belongs to the player, not to the swarm. */
const COUNTDOWN_GLOW_COLOR = 'rgba(56, 189, 248, 0.55)';
const COUNTDOWN_GLOW_BLUR = 18;

/**
 * Arrow outline in boid-local coordinates as [forward, lateral] pairs, drawn in
 * order. The tail notch between the wings gives the dart its concave back.
 */
const BOID_ARROW_SHAPE = [
  [BOID_VISUAL_LENGTH * 0.5, 0],
  [-BOID_VISUAL_LENGTH * 0.5, BOID_VISUAL_WIDTH * 0.5],
  [-BOID_VISUAL_LENGTH * 0.5 + BOID_TAIL_INSET, 0],
  [-BOID_VISUAL_LENGTH * 0.5, -BOID_VISUAL_WIDTH * 0.5],
];

/** Heading used when a boid is momentarily at rest, so the shape stays stable. */
const DEFAULT_HEADING_X = 1;
const DEFAULT_HEADING_Y = 0;

/**
 * Canvas 2D renderer implementation.
 * Responsible only for drawing — no simulation logic.
 *
 * The world is a fixed `WORLD_WIDTH × WORLD_HEIGHT` and no longer follows the window, so
 * this class carries the one transform that maps it onto the canvas. Every draw helper
 * below therefore keeps handing over plain world coordinates, exactly as before.
 */
export class CanvasRenderer {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this._canvas = canvas;
    // Opaque. The arena background covers every pixel of this surface on every frame, so
    // there is nothing for transparency to reveal — and declaring that spares the compositor
    // a full-screen blend of the canvas against the page once per frame, which on an
    // integrated GPU is a real share of the cost. It is only honoured on the first
    // `getContext` for an element, which is here.
    this._ctx = canvas.getContext('2d', { alpha: false });
    this._width = 0;
    this._height = 0;
    this._pixelRatio = 1;
    this._view = { scale: 1, offsetX: 0, offsetY: 0 };
    this._drawCalls = new DrawCallCounter();
    // Built before the first resize, because resize is what bakes it.
    this._background = new ArenaBackground();
    this.resize(window.innerWidth, window.innerHeight);
  }

  /**
   * How many drawing operations the last frame issued.
   *
   * The counter attaches itself on the first read, so nothing pays for it until something
   * asks — and the only caller is the opt-in frametime overlay. That also means the first
   * read of a session reports `0`, which is one frame of honest ignorance rather than a
   * wrong number.
   *
   * Read this **after** the frame was drawn and understand what it is: a count of
   * operations, not of GPU work. It is the number batching moves, and it says nothing
   * about how much area each of those operations covered — see `drawCallCounter.js`.
   * @returns {number} Drawing operations since the previous read.
   */
  readDrawCalls() {
    this._drawCalls.attach(this._ctx);

    return this._drawCalls.readAndReset();
  }

  /**
   * Pixels in the canvas backing store — the size of the surface every full-canvas pass
   * writes, and therefore the single number most of the GPU cost scales with.
   *
   * Device pixels, not CSS pixels: it is `devicePixelRatio` squared that makes a modest
   * window expensive, and reporting CSS pixels would hide exactly that.
   * @returns {number} Width times height of the backing store.
   */
  backingStorePixels() {
    return this._canvas.width * this._canvas.height;
  }

  /**
   * Takes the game canvas out of the picture, so the menu's swarm backdrop — a canvas of its
   * own, further back — is what the deck sits on.
   *
   * This replaces a `clear()` that wiped the surface to transparency for the same purpose,
   * and the replacement is what makes `{ alpha: false }` possible: on an opaque canvas
   * `clearRect` paints black rather than nothing, so the backdrop would have vanished behind
   * a black rectangle. Hiding the element sidesteps that and is strictly cheaper — a hidden
   * canvas is neither composited nor wiped once per frame.
   * @returns {void}
   */
  hide() {
    this._canvas.style.display = 'none';
  }

  /**
   * Puts the game canvas back in front of the menu backdrop, for a round.
   * @returns {void}
   */
  show() {
    this._canvas.style.display = 'block';
  }

  /**
   * Drops every dash trail. Belongs at the start of a round, next to the dash cooldown
   * reseed: boid indices are handed out again there, so last round's history has no owner
   * any more. The 200-px jump check would catch that on its own — but only after one wrongly
   * drawn frame.
   * @returns {void}
   */
  resetTrails() {
    dashTrails.reset();
  }

  /**
   * @param {number} width - CSS pixels.
   * @param {number} height - CSS pixels.
   * @returns {void}
   */
  resize(width, height) {
    const pixelRatio = window.devicePixelRatio || 1;
    this._width = width;
    this._height = height;
    this._pixelRatio = pixelRatio;
    this._canvas.width = Math.floor(width * pixelRatio);
    this._canvas.height = Math.floor(height * pixelRatio);
    this._canvas.style.width = `${width}px`;
    this._canvas.style.height = `${height}px`;

    // The world no longer follows the canvas, so the canvas has to be told where the world
    // sits inside it.
    this._view = fitWorldToCanvas(width, height, WORLD_WIDTH, WORLD_HEIGHT);
    this._applyWorldTransform();
    // The one moment any of the background's inputs can change, so the one moment it is
    // baked. Everything it contains is constant for as long as this size holds.
    this._background.rebuild(this._canvas.width, this._canvas.height, pixelRatio, this._view);
  }

  /**
   * @param {object} frame - The engine's flat-buffer frame, as normalized by `engine-bridge.js`.
   * @param {{x: number, y: number}} playerPosition - Current player position.
   * @param {object} [renderState] - HUD-adjacent state (lives, dash cooldown, countdown, ...).
   * @returns {void}
   */
  drawFrame(frame, playerPosition, renderState = {}) {
    const ctx = this._ctx;

    // The arena floor, its margins, both lattices and the world edge, as one opaque blit that
    // covers the whole surface. It is therefore also the wipe — there is deliberately no
    // `clearRect` in front of it, because clearing pixels that are about to be overwritten is
    // a second full pass over the canvas for no visible effect.
    this._inScreenSpace((screenCtx, screenWidth, screenHeight) => {
      this._background.draw(screenCtx, screenWidth, screenHeight);
    });
    // Under the boids and the player, so an obstacle reads as terrain they move over
    // rather than as something in front of them.
    drawObstacles(ctx, frame);
    // A marker lies on the ground: over the obstacles, under everything that moves. Its spin
    // and bob run on wall time, because they are presentation and follow the frame rate.
    drawPowerupMarkers(ctx, renderState, renderState.wallClockSeconds ?? 0);
    // Where the next wave will come in, on the ground for the same reason: nothing is
    // standing there yet, so it must not draw over anything that is. Also on wall time,
    // but only for its flicker — the ring that says *when* comes from the engine.
    drawSpawnMarkers(ctx, frame, renderState.wallClockSeconds ?? 0);
    // The order is the statement: a dash trail sits over the obstacles, because it is
    // movement rather than terrain, and under the boids and the player, because it is their
    // exhaust rather than an object of its own. Sampling happens first, so a ribbon and its
    // owner are never a frame apart.
    //
    // Only for a live frame, which the loop marks by handing over `deltaSeconds`: during the
    // countdown and after a death nothing moves, and sampling a standing frame would retract
    // the ribbons that belong to the picture instead of leaving it frozen.
    if (renderState.deltaSeconds !== undefined) {
      sampleDashTrails(dashTrails, frame, playerPosition, renderState);
    }
    drawDashTrails(ctx, dashTrails, trailColorForTier);
    drawBoids(ctx, frame);
    drawPlayer(ctx, playerPosition, renderState.playerInvulnerable === true);
    // A shell and its time arcs lie on the player, so they come after them — and before the
    // status bars, of which the lives are the one thing that may never be drawn over.
    drawPlayerBuffs(ctx, playerPosition, renderState, renderState.wallClockSeconds ?? 0);
    drawPlayerStatusBars(ctx, playerPosition, renderState);
    // The HUD keeps a dash bar of its own (`ui/hud.js`) — the labelled one, whose text is
    // therefore not re-rasterised on every frame. The small unlabelled twin under the player
    // is drawn just above, where the eyes are during a fight.
    this._drawCountdown(renderState.countdownSeconds);
  }

  /**
   * Puts the composed world transform on the context. The arithmetic itself lives in
   * `worldTransform.js`, because the offscreen background canvas has to carry the identical
   * matrix — see the note there.
   */
  _applyWorldTransform() {
    this._ctx.setTransform(...worldTransformMatrix(this._pixelRatio, this._view));
  }

  /**
   * Runs a draw callback in screen space: device pixels of the whole canvas, margins
   * included. Only the three things that have to cover the area *outside* the world need
   * this — the wipe, the margins themselves, and the countdown scrim.
   */
  _inScreenSpace(draw) {
    const ctx = this._ctx;
    ctx.save();
    ctx.resetTransform();
    draw(ctx, this._canvas.width, this._canvas.height);
    ctx.restore();
  }

  /** The scrim has to dim the margins too, so it is the one part drawn in screen space. */
  _drawCountdown(countdownSeconds) {
    if (!countdownSeconds || countdownSeconds <= 0) return;

    this._inScreenSpace((screenCtx, screenWidth, screenHeight) => {
      screenCtx.fillStyle = COUNTDOWN_SCRIM_COLOR;
      screenCtx.fillRect(0, 0, screenWidth, screenHeight);
    });
    drawCountdownGlyph(this._ctx, countdownSeconds);
  }
}

function drawBoids(ctx, frame) {
  const positions = frame.positions;
  if (!positions) return;

  const velocities = frame.velocities;
  const tiers = frame.tiers;
  const dashPhases = frame.dashPhases;

  ctx.strokeStyle = BOID_OUTLINE_COLOR;
  ctx.lineWidth = BOID_OUTLINE_WIDTH;

  for (let index = 0; index < positions.length; index += 2) {
    const x = positions[index];
    const y = positions[index + 1];
    const boidIndex = index / 2;
    const tier = Math.min(tiers?.[boidIndex] ?? 0, BOID_COLORS.length - 1);

    // The heading unit vector is itself the rotation matrix, so the arrow is
    // built directly in world space. Rotating the context per boid would risk
    // clobbering the transform set up in resize(), which carries the device pixel
    // ratio *and* the world scale and offset.
    const velocityX = velocities?.[index] ?? 0;
    const velocityY = velocities?.[index + 1] ?? 0;
    const speed = Math.hypot(velocityX, velocityY);
    const headingX = speed === 0 ? DEFAULT_HEADING_X : velocityX / speed;
    const headingY = speed === 0 ? DEFAULT_HEADING_Y : velocityY / speed;

    // A boid about to dash pulses: it grows and brightens, faster and faster as
    // the launch approaches, so the player can see the lunge coming.
    const dashPhase = dashPhases?.[boidIndex] ?? 0;
    const scale = dashPhase === 0 ? 1 : dashPulseScale(dashPhase);

    ctx.fillStyle = glowColorForBoid(tier, dashPhase);
    ctx.beginPath();

    for (let corner = 0; corner < BOID_ARROW_SHAPE.length; corner += 1) {
      const [shapeForward, shapeLateral] = BOID_ARROW_SHAPE[corner];
      const forward = shapeForward * scale;
      const lateral = shapeLateral * scale;
      const pointX = x + forward * headingX - lateral * headingY;
      const pointY = y + forward * headingY + lateral * headingX;

      if (corner === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawPlayer(ctx, playerPosition, playerInvulnerable) {
  if (!playerPosition) return;

  ctx.fillStyle = playerInvulnerable ? PLAYER_HIT_COLOR : PLAYER_COLOR;
  ctx.beginPath();
  ctx.arc(playerPosition.x, playerPosition.y, PLAYER_VISUAL_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = PLAYER_OUTLINE_COLOR;
  ctx.lineWidth = 3;
  ctx.stroke();
}

/**
 * The digit itself, in world space and centred on the world — it belongs to the arena the
 * round is about to start in, not to the window frame around it.
 */
function drawCountdownGlyph(ctx, countdownSeconds) {
  ctx.save();
  ctx.fillStyle = COUNTDOWN_COLOR;
  ctx.font = COUNTDOWN_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = COUNTDOWN_GLOW_COLOR;
  ctx.shadowBlur = COUNTDOWN_GLOW_BLUR;
  ctx.fillText(String(countdownSeconds), WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5);
  ctx.restore();
}
