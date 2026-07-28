/**
 * Vertical-axis arithmetic for the frametime graph.
 *
 * Pure functions, no canvas and no config imports, so the axis behaviour can be
 * unit tested without a browser or a built WASM package.
 */

const MILLISECONDS_PER_SECOND = 1000;

/**
 * Derives the vertical axis from the target framerate chosen in the start menu.
 *
 * The axis is tied to that setting rather than to the measured peak so the plot
 * answers the only question worth asking of it — "is this frame fast enough for
 * the framerate I asked for?" — with a fixed height instead of a moving one. A
 * curve at the same height means the same cost for the whole round.
 *
 * @param {number} targetFps - Frames per second the renderer is aiming for.
 * @param {number} headroomFactor - How much taller the axis is than the budget.
 * @returns {{budgetMs: number, topMs: number}} The frame budget of one target
 *   frame (where the dashed line goes) and the top of the axis above it.
 */
export function resolveAxis(targetFps, headroomFactor) {
  const budgetMs = MILLISECONDS_PER_SECOND / targetFps;

  return {
    budgetMs,
    topMs: budgetMs * headroomFactor,
  };
}
