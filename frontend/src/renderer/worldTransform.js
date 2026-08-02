/**
 * How the fixed logical world is placed inside a canvas of whatever size the browser
 * window happens to be.
 *
 * Split into its own import-free module for the same reason `dashPulse.js` and
 * `ui/frameGraphScale.js` are: it is pure arithmetic with edge cases that are invisible to
 * the eye — a stretched world, a world centred half a pixel off, a zero-sized window during
 * a minimise — and a Vitest suite can reach it without a browser or a built WASM package.
 */

/**
 * Smallest canvas extent the fit is computed for.
 *
 * A window mid-minimise, and a Chromium tab being restored, can report a size of zero.
 * Without this floor the scale would come out as `0` and every coordinate would collapse
 * onto a single point, or — once something divides by the scale, as the world-edge hairline
 * does — turn into `Infinity` and poison the whole canvas transform.
 */
const MINIMUM_CANVAS_EXTENT = 1;

/**
 * Fits a fixed logical world into a canvas without distorting it, the way a "contain" image
 * fit works: the world is scaled by the smaller of the two ratios and centred, so whatever
 * space is left over becomes two equal margins on the opposite sides.
 *
 * Scaling each axis on its own would fill the canvas exactly, but it would also stretch the
 * world — and since the obstacles are capsules built from circles, every one of them would
 * come out as an ellipse.
 *
 * There is deliberately no inverse (screen point back to world point): the game is played on
 * the keyboard, nothing in it reads a pointer position, and an untested unused export is
 * worse than the absent one. This is where it belongs if that ever changes.
 * @param {number} canvasWidth - Canvas width in CSS pixels.
 * @param {number} canvasHeight - Canvas height in CSS pixels.
 * @param {number} worldWidth - Logical world width in world units.
 * @param {number} worldHeight - Logical world height in world units.
 * @returns {{scale: number, offsetX: number, offsetY: number}} One scale for both axes, plus
 *   the position of the world's top-left corner inside the canvas, in CSS pixels.
 */
export function fitWorldToCanvas(canvasWidth, canvasHeight, worldWidth, worldHeight) {
  const usableWidth = Math.max(canvasWidth, MINIMUM_CANVAS_EXTENT);
  const usableHeight = Math.max(canvasHeight, MINIMUM_CANVAS_EXTENT);

  // The smaller of the two ratios is the one that makes the world fit on both axes.
  const scale = Math.min(usableWidth / worldWidth, usableHeight / worldHeight);

  // Half of the leftover space on each side, which is what centres the world. On the axis
  // that decided the scale there is no leftover, so that offset comes out as zero.
  return {
    scale,
    offsetX: (usableWidth - worldWidth * scale) * 0.5,
    offsetY: (usableHeight - worldHeight * scale) * 0.5,
  };
}

/**
 * Composes the two mappings a canvas needs into the single matrix `setTransform` takes.
 *
 * Both are affine, so their composition is one matrix: world to CSS pixels is
 * `css = world * scale + offset`, CSS to device pixels is `device = css * ratio`, hence
 * `device = ratio * scale * world + ratio * offset`. The offsets are in CSS pixels and
 * therefore get multiplied by the ratio as well — that is the part that is easy to get wrong,
 * and the reason this is a tested function rather than six arguments spelled out twice.
 *
 * Twice, because there are now two surfaces that carry the same world transform: the visible
 * canvas and the offscreen one the static arena background is baked into. If those two
 * disagreed by so much as a rounding step, the baked background would sit a fraction of a
 * pixel away from everything drawn live on top of it.
 * @param {number} pixelRatio - Device pixels per CSS pixel.
 * @param {{scale: number, offsetX: number, offsetY: number}} view - From `fitWorldToCanvas`.
 * @returns {number[]} The six arguments of `setTransform`, in order: `a, b, c, d, e, f`.
 */
export function worldTransformMatrix(pixelRatio, view) {
  const combinedScale = pixelRatio * view.scale;

  return [combinedScale, 0, 0, combinedScale, pixelRatio * view.offsetX, pixelRatio * view.offsetY];
}
