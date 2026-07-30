/**
 * The arena itself: the ground the swarm moves over, its lattice, its boundary, and the
 * dead space around it.
 *
 * Split out of `canvasRenderer.js` when the world stopped being the window. Two of the
 * four functions here draw in world space and two in screen space, and keeping that
 * distinction in one small module is easier to hold in your head than a renderer that
 * mixes both — the same reason `obstacleLayer.js` is its own file.
 *
 * The world is a fixed `WORLD_WIDTH × WORLD_HEIGHT`, scaled to fit the window. Whatever is
 * left over is margin, and the margin has to be painted rather than left transparent:
 * `body` carries `var(--arena)`, the *same* colour as the arena floor, so a transparent
 * margin would make the world edge invisible again.
 */

import { WORLD_HEIGHT, WORLD_WIDTH } from '../gameConfig.js';

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

/**
 * `--void`, one shade below the arena floor. It already means "further back, outside" in
 * the rest of the interface, so the letterbox margins invent no new colour meaning.
 */
const VOID_COLOR = '#07080b';

/**
 * `--line-strong`. The boundary is the brightest line in the arena because it is the one
 * that matters: a boid leaving here comes back in on the opposite side.
 */
const WORLD_EDGE_COLOR = 'rgba(255, 255, 255, 0.16)';

/**
 * Paints the whole canvas, margins included, in the void colour.
 *
 * Must be called in screen space — it is the one thing that has to reach *outside* the
 * world, which the world transform by definition cannot. Painting everything and letting
 * the arena cover the middle is both simpler and cheaper than computing two margin bars,
 * and it doubles as the wipe for the margin region.
 * @param {CanvasRenderingContext2D} ctx - Context with its transform reset to screen space.
 * @param {number} screenWidth - Full canvas width in device pixels.
 * @param {number} screenHeight - Full canvas height in device pixels.
 * @returns {void}
 */
export function drawLetterboxMargins(ctx, screenWidth, screenHeight) {
  ctx.fillStyle = VOID_COLOR;
  ctx.fillRect(0, 0, screenWidth, screenHeight);
}

/**
 * Draws the arena floor and its lattice, in world space.
 * @param {CanvasRenderingContext2D} ctx - Context carrying the world transform.
 * @returns {void}
 */
export function drawArena(ctx) {
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  // Two passes over the same lattice function: the fine grid first, the brighter major
  // lines on top. Two `stroke()` calls in total, because a stroke can only carry one
  // colour — drawing the major lines into the same path would repaint them in the fine
  // colour.
  strokeLattice(ctx, GRID_SIZE, GRID_COLOR);
  strokeLattice(ctx, GRID_MAJOR_SIZE, GRID_MAJOR_COLOR);
}

/**
 * Outlines the world, in world space.
 *
 * The grid ending in flat void is already a boundary cue on its own, but the lattice does
 * not divide 1920 by 1080 evenly, so the last row and column are cut short. This line
 * covers those ragged ends and names the edge the swarm wraps around.
 * @param {CanvasRenderingContext2D} ctx - Context carrying the world transform.
 * @param {number} scale - World-to-CSS-pixel scale currently in the transform. The stroke
 *   width is divided by it so the boundary stays a one-pixel hairline at any window size,
 *   the way every other line in the design system is exactly one pixel.
 * @returns {void}
 */
export function drawWorldEdge(ctx, scale) {
  ctx.strokeStyle = WORLD_EDGE_COLOR;
  ctx.lineWidth = 1 / scale;
  ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}

/**
 * One axis-aligned lattice across the world, at the given spacing.
 *
 * Its `lineWidth` is a world unit and therefore scales with the arena, unlike the boundary
 * above: the grid is floor texture and has to keep its weight relative to the boids
 * standing on it, whereas the boundary is a piece of interface that should stay a hairline.
 */
function strokeLattice(ctx, spacing, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = 0; x <= WORLD_WIDTH; x += spacing) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD_HEIGHT);
  }

  for (let y = 0; y <= WORLD_HEIGHT; y += spacing) {
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD_WIDTH, y);
  }

  ctx.stroke();
}
