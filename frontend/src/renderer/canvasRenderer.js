import {
  BOID_TAIL_INSET,
  BOID_VISUAL_LENGTH,
  BOID_VISUAL_WIDTH,
  PLAYER_VISUAL_RADIUS,
} from '../gameConfig.js';
import { dashGlowLevel, dashPulseScale } from './dashPulse.js';
import { drawObstacles } from './obstacleLayer.js';

/**
 * The arena's own colours, mirrored from `styles/tokens.css` — a canvas cannot read a
 * CSS custom property, so these values exist in both places on purpose. Whoever changes
 * one changes the other; the token file carries the same note.
 */
const BACKGROUND_COLOR = '#0b0d12';
const GRID_COLOR = 'rgba(255, 255, 255, 0.05)';
const GRID_SIZE = 56;

/**
 * Every fifth grid line is drawn brighter. Two steps instead of one give the arena a
 * sense of scale and place without the grid as a whole getting lighter: the previous
 * single-level grid sat between these two values and read flat.
 */
const GRID_MAJOR_SIZE = GRID_SIZE * 5;
const GRID_MAJOR_COLOR = 'rgba(255, 255, 255, 0.085)';

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
 */
export class CanvasRenderer {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._width = 0;
    this._height = 0;
    this.resize(window.innerWidth, window.innerHeight);
  }

  /**
   * @param {number} width - CSS pixels.
   * @param {number} height - CSS pixels.
   */
  resize(width, height) {
    const pixelRatio = window.devicePixelRatio || 1;
    this._width = width;
    this._height = height;
    this._canvas.width = Math.floor(width * pixelRatio);
    this._canvas.height = Math.floor(height * pixelRatio);
    this._canvas.style.width = `${width}px`;
    this._canvas.style.height = `${height}px`;
    this._ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  /**
   * @param {object} frame - The engine's flat-buffer frame, as normalized by `engine-bridge.js`.
   * @param {{x: number, y: number}} playerPosition - Current player position.
   * @param {object} [renderState] - HUD-adjacent state (lives, dash cooldown, countdown, ...).
   */
  drawFrame(frame, playerPosition, renderState = {}) {
    const ctx = this._ctx;
    ctx.clearRect(0, 0, this._width, this._height);

    drawBackground(ctx, this._width, this._height);
    drawGrid(ctx, this._width, this._height);
    // Under the boids and the player, so an obstacle reads as terrain they move over
    // rather than as something in front of them.
    drawObstacles(ctx, frame);
    drawBoids(ctx, frame);
    drawPlayer(ctx, playerPosition, renderState.playerInvulnerable === true);
    drawPlayerHealth(ctx, playerPosition, renderState, this._width, this._height);
    // The dash bar is not drawn here: it lives in the HUD (`ui/hud.js`), so its label is
    // not re-rasterised on every frame.
    drawCountdown(ctx, renderState.countdownSeconds, this._width, this._height);
  }
}

function drawBackground(ctx, width, height) {
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Two passes over the same lattice function: the fine grid first, the brighter major
 * lines on top. Two `stroke()` calls in total, because a stroke can only carry one
 * colour — drawing the major lines into the same path would repaint them in the fine
 * colour.
 */
function drawGrid(ctx, width, height) {
  strokeLattice(ctx, width, height, GRID_SIZE, GRID_COLOR);
  strokeLattice(ctx, width, height, GRID_MAJOR_SIZE, GRID_MAJOR_COLOR);
}

function strokeLattice(ctx, width, height, spacing, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = 0; x <= width; x += spacing) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }

  for (let y = 0; y <= height; y += spacing) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }

  ctx.stroke();
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
    // clobbering the device-pixel-ratio transform set up in resize().
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

function drawPlayerHealth(ctx, playerPosition, renderState, width, height) {
  if (!playerPosition || renderState.lives === undefined) return;

  const maxLives = Math.max(1, renderState.maxLives ?? renderState.lives);
  const filledLives = Math.max(0, Math.min(renderState.lives, maxLives));
  const segmentWidth = (HEALTH_BAR_WIDTH - HEALTH_BAR_GAP * (maxLives - 1)) / maxLives;
  const barX = clamp(playerPosition.x - HEALTH_BAR_WIDTH * 0.5, 4, width - HEALTH_BAR_WIDTH - 4);
  const preferredY = playerPosition.y + PLAYER_VISUAL_RADIUS + HEALTH_BAR_OFFSET;
  const barY = Math.min(preferredY, height - HEALTH_BAR_HEIGHT - 4);

  ctx.fillStyle = HEALTH_BAR_BACKDROP_COLOR;
  ctx.fillRect(barX - 3, barY - 3, HEALTH_BAR_WIDTH + 6, HEALTH_BAR_HEIGHT + 6);

  for (let index = 0; index < maxLives; index += 1) {
    const segmentX = barX + index * (segmentWidth + HEALTH_BAR_GAP);
    ctx.fillStyle = index < filledLives ? HEALTH_SEGMENT_COLOR : HEALTH_SEGMENT_EMPTY_COLOR;
    ctx.fillRect(segmentX, barY, segmentWidth, HEALTH_BAR_HEIGHT);
  }
}

function drawCountdown(ctx, countdownSeconds, width, height) {
  if (!countdownSeconds || countdownSeconds <= 0) return;

  ctx.save();
  ctx.fillStyle = COUNTDOWN_SCRIM_COLOR;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = COUNTDOWN_COLOR;
  ctx.font = COUNTDOWN_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = COUNTDOWN_GLOW_COLOR;
  ctx.shadowBlur = COUNTDOWN_GLOW_BLUR;
  ctx.fillText(String(countdownSeconds), width * 0.5, height * 0.5);
  ctx.restore();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
