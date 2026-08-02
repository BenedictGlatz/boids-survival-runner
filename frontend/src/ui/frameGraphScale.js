/**
 * Axis arithmetic and text assembly for the frametime graph.
 *
 * Pure functions, no canvas and no config imports, so the axis behaviour can be
 * unit tested without a browser or a built WASM package.
 */

const MILLISECONDS_PER_SECOND = 1000;

/** Backing-store pixel counts run into the millions, and only one decimal is readable. */
const MILLION = 1_000_000;
const MEGAPIXEL_DECIMALS = 1;

/**
 * What an unavailable figure reads as. An em dash rather than `0`, because zero drawing
 * operations and "not measured yet" are different claims and only one of them is true on
 * the first frame.
 */
const UNKNOWN = '—';

/**
 * Derives the vertical axis from the target framerate chosen in the start menu.
 *
 * The axis is tied to that setting rather than to the measured peak so the plot
 * answers the only question worth asking of it — "is this frame fast enough for
 * the framerate I asked for?" — with a fixed height instead of a moving one. A
 * curve at the same height means the same cost for the whole round.
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

/**
 * Assembles the graph's load row: what the frame cost the GPU, as far as the frontend can
 * honestly say.
 *
 * The three figures answer three different questions and are deliberately shown together,
 * because each one alone invites the wrong conclusion. Frames per second is the falsifiable
 * test for the framerate setting. Drawing operations is the number batching moves. Pixels is
 * the number `devicePixelRatio` squares, and usually the one that explains a hot GPU on a
 * simple-looking scene. None of the three is GPU time.
 *
 * The unit words arrive as an argument rather than being read from `ui/i18n.js`, which keeps
 * this function pure and the module testable in Node — and keeps the no-hard-coded-strings
 * rule intact, since the caller supplies translated labels.
 * @param {object} values - The three figures. Missing, `null` or `NaN` entries render as
 *   unknown rather than as zero: `drawnFps`, `drawCalls`, `pixels`.
 * @param {object} labels - Translated unit words: `framesPerSecond`, `drawCalls`, `pixels`
 *   and `millions`, the suffix on the megapixel figure.
 * @returns {string} One line, ready to draw.
 */
export function formatLoadRow(values, labels) {
  const fps = isMissing(values.drawnFps) ? UNKNOWN : String(Math.round(values.drawnFps));
  const draws = isMissing(values.drawCalls) ? UNKNOWN : String(values.drawCalls);
  const megapixels = isMissing(values.pixels)
    ? UNKNOWN
    : `${(values.pixels / MILLION).toFixed(MEGAPIXEL_DECIMALS)}${labels.millions}`;

  return (
    `${fps} ${labels.framesPerSecond} · ` +
    `${draws} ${labels.drawCalls} · ` +
    `${megapixels} ${labels.pixels}`
  );
}

/** `NaN` counts as missing too: it is what a division by an empty window produces. */
function isMissing(value) {
  return value === null || value === undefined || Number.isNaN(value);
}
