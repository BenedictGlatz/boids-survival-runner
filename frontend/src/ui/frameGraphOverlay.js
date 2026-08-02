/**
 * Everything the frametime overlay needs assembled that is not the overlay itself.
 *
 * It exists to keep `index.js` from growing a fourth concern in its frame loop, and to keep
 * the load figures in one place: the drawn-frame-rate window lives here, and the two numbers
 * that come off the renderer are read here rather than at the call site. The loop then has
 * one line for the whole overlay.
 *
 * The renderer arrives as an argument and is never imported, so this module stays on the UI
 * side of the boundary the way `ui/hud.js` does — it reads two diagnostic numbers off
 * whatever it is handed and knows nothing else about drawing.
 *
 * A module-level singleton for the frame-rate window, the same shape as `dashTrails` in
 * `renderer/dashTrailHistory.js`: there is exactly one overlay, and threading an instance
 * through the loop would buy nothing.
 */

import { DrawnFrameRate } from './drawnFrameRate.js';

const drawnFrameRate = new DrawnFrameRate();

/**
 * Draws the overlay, if it is switched on.
 *
 * Call it **after** the frame was drawn and after the frame measurement was committed: the
 * drawing-operation count has to include the frame it reports on, and the overlay must not
 * appear inside the render time it displays.
 * @param {import('./frameTimeGraph.js').FrameTimeGraph} graph - The overlay to draw.
 * @param {import('../loop/frameMetrics.js').FrameMetrics} metrics - The window to plot.
 * @param {{frameGraphEnabled: boolean, frameGraphMode: string, targetFps: number}} settings -
 *   The current display settings.
 * @param {{readDrawCalls: Function, backingStorePixels: Function}} renderer - Source of the
 *   two load figures.
 * @param {number} timestamp - The `requestAnimationFrame` timestamp of this frame.
 * @returns {void}
 */
export function drawFrameGraph(graph, metrics, settings, renderer, timestamp) {
  if (!settings.frameGraphEnabled) {
    return;
  }

  graph.draw(metrics, {
    mode: settings.frameGraphMode,
    targetFps: settings.targetFps,
    drawnFps: drawnFrameRate.sample(timestamp),
    drawCalls: renderer.readDrawCalls(),
    pixels: renderer.backingStorePixels(),
  });
}

/**
 * Forgets the frame-rate window, so the next reading describes the next round.
 *
 * Belongs on the way back to the start menu: the window that spans "end of a round, a while
 * on the deck, start of the next" reports neither of the two rounds.
 * @returns {void}
 */
export function resetFrameGraphLoad() {
  drawnFrameRate.reset();
}
