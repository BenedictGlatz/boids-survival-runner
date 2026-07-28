import {
  BOID_TAIL_INSET,
  BOID_VISUAL_LENGTH,
  BOID_VISUAL_WIDTH,
  PLAYER_VISUAL_RADIUS,
} from '../gameConfig.js';

const BACKGROUND_COLOR = '#111318';
const GRID_COLOR = 'rgba(255, 255, 255, 0.07)';
const GRID_SIZE = 56;
const BOID_OUTLINE_COLOR = 'rgba(255, 255, 255, 0.22)';
const BOID_OUTLINE_WIDTH = 1.5;
const PLAYER_COLOR = '#38bdf8';
const PLAYER_HIT_COLOR = '#facc15';
const BOID_COLORS = ['#f03a5f', '#fb7185', '#f97316', '#eab308', '#a855f7'];
const HEALTH_BAR_WIDTH = 52;
const HEALTH_BAR_HEIGHT = 7;
const HEALTH_BAR_GAP = 3;
const HEALTH_BAR_OFFSET = 10;

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

  /** @param {object} frame */
  drawFrame(frame, playerPosition, renderState = {}) {
    const ctx = this._ctx;
    ctx.clearRect(0, 0, this._width, this._height);

    drawBackground(ctx, this._width, this._height);
    drawGrid(ctx, this._width, this._height);
    drawBoids(ctx, frame.positions, frame.velocities, frame.tiers);
    drawPlayer(ctx, playerPosition, renderState.playerInvulnerable === true);
    drawPlayerHealth(ctx, playerPosition, renderState, this._width, this._height);
    drawCountdown(ctx, renderState.countdownSeconds, this._width, this._height);
  }
}

function drawBackground(ctx, width, height) {
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, width, height);
}

function drawGrid(ctx, width, height) {
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = 0; x <= width; x += GRID_SIZE) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }

  for (let y = 0; y <= height; y += GRID_SIZE) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }

  ctx.stroke();
}

function drawBoids(ctx, positions, velocities, tiers) {
  if (!positions) return;

  ctx.strokeStyle = BOID_OUTLINE_COLOR;
  ctx.lineWidth = BOID_OUTLINE_WIDTH;

  for (let index = 0; index < positions.length; index += 2) {
    const x = positions[index];
    const y = positions[index + 1];
    const boidIndex = index / 2;
    const tier = tiers?.[boidIndex] ?? 0;

    // The heading unit vector is itself the rotation matrix, so the arrow is
    // built directly in world space. Rotating the context per boid would risk
    // clobbering the device-pixel-ratio transform set up in resize().
    const velocityX = velocities?.[index] ?? 0;
    const velocityY = velocities?.[index + 1] ?? 0;
    const speed = Math.hypot(velocityX, velocityY);
    const headingX = speed === 0 ? DEFAULT_HEADING_X : velocityX / speed;
    const headingY = speed === 0 ? DEFAULT_HEADING_Y : velocityY / speed;

    ctx.fillStyle = BOID_COLORS[Math.min(tier, BOID_COLORS.length - 1)];
    ctx.beginPath();

    for (let corner = 0; corner < BOID_ARROW_SHAPE.length; corner += 1) {
      const [forward, lateral] = BOID_ARROW_SHAPE[corner];
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

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
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

  ctx.fillStyle = 'rgba(3, 7, 18, 0.7)';
  ctx.fillRect(barX - 3, barY - 3, HEALTH_BAR_WIDTH + 6, HEALTH_BAR_HEIGHT + 6);

  for (let index = 0; index < maxLives; index += 1) {
    const segmentX = barX + index * (segmentWidth + HEALTH_BAR_GAP);
    ctx.fillStyle = index < filledLives ? '#22c55e' : 'rgba(248, 250, 252, 0.22)';
    ctx.fillRect(segmentX, barY, segmentWidth, HEALTH_BAR_HEIGHT);
  }
}

function drawCountdown(ctx, countdownSeconds, width, height) {
  if (!countdownSeconds || countdownSeconds <= 0) return;

  ctx.save();
  ctx.fillStyle = 'rgba(3, 7, 18, 0.42)';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#f4f4f5';
  ctx.font = '700 72px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(56, 189, 248, 0.55)';
  ctx.shadowBlur = 18;
  ctx.fillText(String(countdownSeconds), width * 0.5, height * 0.5);
  ctx.restore();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
