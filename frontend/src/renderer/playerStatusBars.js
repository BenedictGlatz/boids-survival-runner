/**
 * The two status bars that ride under the player: lives and the dash cooldown.
 *
 * Both are drawn in world space, like the player they belong to — they stick to the player
 * rather than to the screen, so they keep the player's size at any window size and need no
 * inverse transform. Their clamps are against the world edges for the same reason.
 *
 * The dash cooldown is also shown in the HUD at the bottom of the screen, and that is not a
 * duplication by accident: the HUD bar is the one with a label and is where a player looks
 * between fights, this one is where the eyes already are during one. Reading it costs no
 * glance away from the swarm, which is the whole point — so it is deliberately small and
 * label-less, and carries no information the HUD bar does not.
 *
 * Split out of `canvasRenderer.js` rather than added to it: that file stood at 382 lines of
 * the 400-line limit, and the arithmetic below is pure, which makes it testable under Vitest
 * while the renderer itself is not.
 */

import { PLAYER_VISUAL_RADIUS, WORLD_HEIGHT, WORLD_WIDTH } from '../gameConfig.js';
import { PLAYER_COLOR } from './entityPalette.js';

/** Both bars share one width, so the stack reads as one object rather than two. */
const BAR_WIDTH = 52;
const HEALTH_BAR_HEIGHT = 7;
const HEALTH_BAR_GAP = 3;
/**
 * Thinner than a life segment, because it is the secondary of the two: losing a life is
 * final, a spent dash comes back on its own.
 */
const DASH_BAR_HEIGHT = 4;
/** Vertical space between the life segments and the dash bar. */
const BAR_STACK_GAP = 3;
const STACK_OFFSET = 10;
/** How close to a world edge the stack may get before it is held back. */
const EDGE_MARGIN = 4;
const BACKDROP_PADDING = 3;
const BACKDROP_COLOR = 'rgba(7, 8, 11, 0.72)';
/** Green is reserved for life and used nowhere else in the whole interface. */
const HEALTH_SEGMENT_COLOR = '#22c55e';
const HEALTH_SEGMENT_EMPTY_COLOR = 'rgba(242, 244, 248, 0.18)';
/**
 * The same two cyans the HUD's dash bar uses (`styles/hud.css`) — dim while the cooldown
 * recovers, the full player colour the moment it is available. One rule learned in one place
 * reads in both.
 */
const DASH_FILL_COLOR = 'rgba(56, 189, 248, 0.45)';
const DASH_READY_COLOR = PLAYER_COLOR;
const DASH_TRACK_COLOR = 'rgba(242, 244, 248, 0.14)';
/** Below this the bar counts as full: floating-point progress rarely lands exactly on 1. */
const DASH_READY_THRESHOLD = 0.999;

/** Height of the whole stack, backdrop padding excluded. */
const STACK_HEIGHT = HEALTH_BAR_HEIGHT + BAR_STACK_GAP + DASH_BAR_HEIGHT;

/**
 * Where the bar stack sits for a given player position.
 *
 * Held inside the world on both axes: horizontally centred on the player until an edge is
 * close, and pushed up off the bottom edge instead of hanging over it. The top edge needs no
 * clamp — the stack is always *below* the player, so it moves away from it.
 * @param {{x: number, y: number}} playerPosition - Current player position, in world units.
 * @returns {{x: number, y: number, width: number}} Top-left corner of the stack and its width.
 */
export function statusStackLayout(playerPosition) {
  const x = clamp(
    playerPosition.x - BAR_WIDTH * 0.5,
    EDGE_MARGIN,
    WORLD_WIDTH - BAR_WIDTH - EDGE_MARGIN,
  );
  const preferredY = playerPosition.y + PLAYER_VISUAL_RADIUS + STACK_OFFSET;
  const y = Math.min(preferredY, WORLD_HEIGHT - STACK_HEIGHT - EDGE_MARGIN);

  return { x, y, width: BAR_WIDTH };
}

/**
 * Width of one life segment, so `maxLives` segments plus their gaps fill the bar exactly.
 * @param {number} maxLives - How many segments the bar is divided into; at least 1.
 * @returns {number} Segment width in world units.
 */
export function healthSegmentWidth(maxLives) {
  return (BAR_WIDTH - HEALTH_BAR_GAP * (maxLives - 1)) / maxLives;
}

/**
 * Draws the life segments and the dash cooldown under the player, as one stack.
 *
 * Called after everything that may be drawn *over* the player and last of the player's own
 * layers: the lives are the one thing in the picture that may never be obscured.
 * @param {CanvasRenderingContext2D} ctx - Context, already carrying the world transform.
 * @param {{x: number, y: number}} playerPosition - Current player position.
 * @param {object} renderState - The loop's render state; `lives`, `maxLives` and
 *   `dashCooldownProgress` are read here.
 * @returns {void}
 */
export function drawPlayerStatusBars(ctx, playerPosition, renderState) {
  if (!playerPosition || renderState.lives === undefined) return;

  const maxLives = Math.max(1, renderState.maxLives ?? renderState.lives);
  const stack = statusStackLayout(playerPosition);
  const dashProgress = renderState.dashCooldownProgress;

  // One backdrop under both bars, rather than one each: it is a single draw call, and it is
  // what makes the two read as one object sitting on the arena floor.
  ctx.fillStyle = BACKDROP_COLOR;
  ctx.fillRect(
    stack.x - BACKDROP_PADDING,
    stack.y - BACKDROP_PADDING,
    stack.width + BACKDROP_PADDING * 2,
    STACK_HEIGHT + BACKDROP_PADDING * 2,
  );

  drawHealthSegments(ctx, stack, maxLives, renderState.lives);

  // A frozen frame before the first round carries no dash state at all, and drawing an empty
  // track there would claim the dash is spent when it is untouched.
  if (dashProgress !== undefined) {
    drawDashBar(ctx, stack, dashProgress);
  }
}

function drawHealthSegments(ctx, stack, maxLives, lives) {
  const filledLives = Math.max(0, Math.min(lives, maxLives));
  const segmentWidth = healthSegmentWidth(maxLives);

  for (let index = 0; index < maxLives; index += 1) {
    const segmentX = stack.x + index * (segmentWidth + HEALTH_BAR_GAP);
    ctx.fillStyle = index < filledLives ? HEALTH_SEGMENT_COLOR : HEALTH_SEGMENT_EMPTY_COLOR;
    ctx.fillRect(segmentX, stack.y, segmentWidth, HEALTH_BAR_HEIGHT);
  }
}

/**
 * One continuous bar, not segments: the cooldown is a continuous quantity, and drawing it the
 * way the lives are drawn would suggest a number of charges the dash does not have.
 */
function drawDashBar(ctx, stack, progress) {
  const level = clamp(progress, 0, 1);
  const barY = stack.y + HEALTH_BAR_HEIGHT + BAR_STACK_GAP;

  ctx.fillStyle = DASH_TRACK_COLOR;
  ctx.fillRect(stack.x, barY, stack.width, DASH_BAR_HEIGHT);

  ctx.fillStyle = level >= DASH_READY_THRESHOLD ? DASH_READY_COLOR : DASH_FILL_COLOR;
  ctx.fillRect(stack.x, barY, stack.width * level, DASH_BAR_HEIGHT);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
