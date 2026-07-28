/**
 * Vertical-axis arithmetic for the frametime graph.
 *
 * Pure functions, no canvas and no config imports, so the axis behaviour can be
 * unit tested without a browser or a built WASM package.
 */

/**
 * Picks the top of the vertical axis: the lowest ladder rung that still contains
 * `peakMs`, so the curves use as much of the panel's height as they can.
 *
 * Falls back to the highest rung when even that is too small — the caller then
 * clamps those samples and marks them, rather than letting a single spike
 * flatten the whole history into a line at the bottom.
 *
 * @param {number} peakMs - Largest value that has to fit on the axis.
 * @param {readonly number[]} ladderMs - Candidate axis tops, ascending.
 * @returns {number} The chosen axis top in milliseconds.
 */
export function chooseScale(peakMs, ladderMs) {
  for (const rung of ladderMs) {
    if (peakMs <= rung) {
      return rung;
    }
  }

  return ladderMs[ladderMs.length - 1];
}
