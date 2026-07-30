import {
  BOID_TAIL_INSET,
  BOID_VISUAL_LENGTH,
  BOID_VISUAL_WIDTH,
  PLAYER_VISUAL_RADIUS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../gameConfig.js';
import { drawArena, drawLetterboxMargins, drawWorldEdge } from './arenaLayer.js';
import { dashGlowLevel, dashPulseScale } from './dashPulse.js';
import { drawObstacles } from './obstacleLayer.js';
import { fitWorldToCanvas } from './worldTransform.js';

const BOID_OUTLINE_COLOR = 'rgba(255, 255, 255, 0.22)';
const BOID_OUTLINE_WIDTH = 1.5;
const PLAYER_COLOR = '#38bdf8';

/**
 * Amber while invulnerable — the colour of a temporary state change, the same one an
 * expiring obstacle wears. A player learns the meaning in one place and can read it
 * everywhere.
 */
const PLAYER_HIT_COLOR = '#fbbf24';
const PLAYER_OUTLINE_COLOR = 'rgba(255, 255, 255, 0.72)';

/**
 * One colour per difficulty tier. Five tiers need five colours that stay apart at arrow
 * size, so they cannot all live in the red family — the tier a boid belongs to has to be
 * readable in a moving crowd of ninety.
 *
 * What did change is the fourth tier: it used to be amber, and amber now means "this is
 * temporary" on its own (invulnerability, an expiring obstacle). A permanently amber boid
 * would say the wrong thing, so that tier moved to fuchsia, which carries no other
 * meaning in the system. Going brighter instead was not an option either: the dash
 * warning already ramps a boid towards white.
 */
const BOID_COLORS = ['#f03a5f', '#fb7185', '#f97316', '#d946ef', '#a855f7'];

const HEALTH_BAR_WIDTH = 52;
const HEALTH_BAR_HEIGHT = 7;
const HEALTH_BAR_GAP = 3;
const HEALTH_BAR_OFFSET = 10;
/** How close to a world edge the bar may get before it is held back. */
const HEALTH_BAR_EDGE_MARGIN = 4;
const HEALTH_BAR_BACKDROP_COLOR = 'rgba(7, 8, 11, 0.72)';
/** Green is reserved for life and used nowhere else in the whole interface. */
const HEALTH_SEGMENT_COLOR = '#22c55e';
const HEALTH_SEGMENT_EMPTY_COLOR = 'rgba(242, 244, 248, 0.18)';

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
 * How many brightness steps a boid colour is precomputed in, from the plain
 * colour up to nearly white.
 *
 * Blending a colour per boid per frame would build a new string on every one of
 * them, which the coding standards rule out on the hot path. Quantising the glow
 * to a fixed number of steps means every colour a boid can ever have is already
 * in memory before the first frame is drawn.
 */
const GLOW_STEPS = 6;
const BOID_GLOW_COLORS = buildGlowColorTable(BOID_COLORS, GLOW_STEPS);

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
    this._ctx = canvas.getContext('2d');
    this._width = 0;
    this._height = 0;
    this._pixelRatio = 1;
    this._view = { scale: 1, offsetX: 0, offsetY: 0 };
    this.resize(window.innerWidth, window.innerHeight);
  }

  /**
   * Wipes the canvas without painting the arena background over it.
   *
   * The menu needs this: its swarm backdrop is a canvas of its own, further back, and an
   * opaque arena background drawn here would hide it completely — which is also why the
   * wipe has to run in screen space and cover the letterbox margins. Clearing only the
   * world rectangle would leave the margins painted in front of the menu backdrop.
   * @returns {void}
   */
  clear() {
    this._inScreenSpace((ctx, screenWidth, screenHeight) => {
      ctx.clearRect(0, 0, screenWidth, screenHeight);
    });
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
  }

  /**
   * @param {object} frame - The engine's flat-buffer frame, as normalized by `engine-bridge.js`.
   * @param {{x: number, y: number}} playerPosition - Current player position.
   * @param {object} [renderState] - HUD-adjacent state (lives, dash cooldown, countdown, ...).
   * @returns {void}
   */
  drawFrame(frame, playerPosition, renderState = {}) {
    const ctx = this._ctx;

    // The wipe and the margins are the two things that have to reach outside the world.
    this._inScreenSpace((screenCtx, screenWidth, screenHeight) => {
      screenCtx.clearRect(0, 0, screenWidth, screenHeight);
      drawLetterboxMargins(screenCtx, screenWidth, screenHeight);
    });

    drawArena(ctx);
    drawWorldEdge(ctx, this._view.scale);
    // Under the boids and the player, so an obstacle reads as terrain they move over
    // rather than as something in front of them.
    drawObstacles(ctx, frame);
    drawBoids(ctx, frame);
    drawPlayer(ctx, playerPosition, renderState.playerInvulnerable === true);
    drawPlayerHealth(ctx, playerPosition, renderState);
    // The dash bar is not drawn here: it lives in the HUD (`ui/hud.js`), so its label is
    // not re-rasterised on every frame.
    this._drawCountdown(renderState.countdownSeconds);
  }

  /**
   * Composes the two mappings the canvas needs into the single transform it can hold.
   *
   * Both are affine, so their composition is one `setTransform`:
   * world to CSS pixels is `css = world * scale + offset`, CSS to device pixels is
   * `device = css * dpr`, hence `device = dpr * scale * world + dpr * offset`. The offsets
   * are in CSS pixels and therefore get multiplied by the ratio as well — that is the part
   * that is easy to get wrong.
   */
  _applyWorldTransform() {
    const combinedScale = this._pixelRatio * this._view.scale;
    this._ctx.setTransform(
      combinedScale,
      0,
      0,
      combinedScale,
      this._pixelRatio * this._view.offsetX,
      this._pixelRatio * this._view.offsetY,
    );
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

/** Picks the precomputed colour for a boid's tier and current glow. */
function glowColorForBoid(tier, dashPhase) {
  if (dashPhase === 0) {
    return BOID_COLORS[tier];
  }

  const level = dashGlowLevel(dashPhase);
  const step = Math.min(Math.round(level * (GLOW_STEPS - 1)), GLOW_STEPS - 1);

  return BOID_GLOW_COLORS[tier][step];
}

/**
 * Precomputes, for every boid colour, a short ramp from the plain colour toward
 * white. Index `0` is the colour itself, the last index is the brightest.
 */
function buildGlowColorTable(colors, steps) {
  const table = [];

  for (const color of colors) {
    const shades = [];

    for (let step = 0; step < steps; step += 1) {
      shades.push(brighten(color, step / (steps - 1)));
    }

    table.push(shades);
  }

  return table;
}

/** Mixes a `#rrggbb` colour toward white, with `amount` between 0 and 1. */
function brighten(color, amount) {
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);

  return `rgb(${mixToWhite(red, amount)}, ${mixToWhite(green, amount)}, ${mixToWhite(blue, amount)})`;
}

function mixToWhite(channel, amount) {
  return Math.round(channel + (255 - channel) * amount);
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
 * The bar is drawn in world space, like the player it belongs to: it sticks to the player
 * rather than to the screen, so it keeps the player's size at any window size and needs no
 * inverse transform. Its clamps are against the world edges for the same reason.
 */
function drawPlayerHealth(ctx, playerPosition, renderState) {
  if (!playerPosition || renderState.lives === undefined) return;

  const maxLives = Math.max(1, renderState.maxLives ?? renderState.lives);
  const filledLives = Math.max(0, Math.min(renderState.lives, maxLives));
  const segmentWidth = (HEALTH_BAR_WIDTH - HEALTH_BAR_GAP * (maxLives - 1)) / maxLives;
  const barX = clamp(
    playerPosition.x - HEALTH_BAR_WIDTH * 0.5,
    HEALTH_BAR_EDGE_MARGIN,
    WORLD_WIDTH - HEALTH_BAR_WIDTH - HEALTH_BAR_EDGE_MARGIN,
  );
  const preferredY = playerPosition.y + PLAYER_VISUAL_RADIUS + HEALTH_BAR_OFFSET;
  const barY = Math.min(preferredY, WORLD_HEIGHT - HEALTH_BAR_HEIGHT - HEALTH_BAR_EDGE_MARGIN);

  ctx.fillStyle = HEALTH_BAR_BACKDROP_COLOR;
  ctx.fillRect(barX - 3, barY - 3, HEALTH_BAR_WIDTH + 6, HEALTH_BAR_HEIGHT + 6);

  for (let index = 0; index < maxLives; index += 1) {
    const segmentX = barX + index * (segmentWidth + HEALTH_BAR_GAP);
    ctx.fillStyle = index < filledLives ? HEALTH_SEGMENT_COLOR : HEALTH_SEGMENT_EMPTY_COLOR;
    ctx.fillRect(segmentX, barY, segmentWidth, HEALTH_BAR_HEIGHT);
  }
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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
