/**
 * Counts the drawing operations the renderer issues per frame.
 *
 * The frametime overlay measures script time, which is the wrong half for a question about
 * GPU load: a `fill()` returns almost immediately and the rasterisation it queues is paid
 * for afterwards, off-thread. So the graph can show a comfortable 2 ms frame while the GPU
 * is saturated, and it will not contradict itself doing so — it never claimed otherwise.
 *
 * What the frontend *can* count honestly is how many drawing operations it hands over, and
 * that is the number every batching measure moves. It is a **proxy**, not GPU time: two
 * `fill()` calls covering wildly different areas cost wildly differently, and the whole
 * fill-rate half of the problem is invisible here. Its use is before-and-after comparison
 * of one scene against itself, nothing more.
 *
 * Counting works by replacing the drawing methods on one context object with wrappers that
 * increment and forward. Two deliberate consequences:
 *
 * - The patch is **one-way**. Nothing un-patches, because a context whose methods are swapped
 *   back and forth on every settings change is a worse deal than a wrapper nobody reads.
 * - `arguments` is forwarded through `apply` rather than collected with a rest parameter. A
 *   rest parameter allocates an array per call, and these are the hottest calls in the
 *   renderer — several hundred per frame.
 *
 * The module touches no DOM, so it runs under Vitest against any plain object that carries
 * the same method names.
 */

/**
 * The operations that actually put pixels on the canvas.
 *
 * Path building — `beginPath`, `moveTo`, `lineTo`, `arc`, `closePath` — is deliberately not
 * counted. It costs CPU but issues nothing to draw, and counting it would make a batched
 * path look exactly as expensive as an unbatched one, which is the opposite of what this
 * number exists for.
 */
export const COUNTED_DRAW_METHODS = Object.freeze([
  'clearRect',
  'fillRect',
  'strokeRect',
  'fill',
  'stroke',
  'fillText',
  'strokeText',
  'drawImage',
  'putImageData',
]);

/** Counts drawing operations on a single canvas context. */
export class DrawCallCounter {
  constructor() {
    this._count = 0;
    this._attachedTo = null;
  }

  /**
   * Installs the counting wrappers on a context.
   *
   * Calling it again with the same context does nothing, so a caller may attach on every
   * round start without checking first. A context missing one of the methods simply has that
   * one left alone — that is what keeps a hand-written test double from having to implement
   * the whole 2D API.
   * @param {object} context - A canvas 2D context, or any object carrying the same methods.
   * @returns {boolean} `true` if the wrappers were installed by this call, `false` if the
   *   context was already attached or is not an object.
   */
  attach(context) {
    if (!context || this._attachedTo === context) {
      return false;
    }

    this._attachedTo = context;

    for (const methodName of COUNTED_DRAW_METHODS) {
      this._wrap(context, methodName);
    }

    return true;
  }

  /**
   * @returns {boolean} Whether a context is currently being counted.
   */
  isAttached() {
    return this._attachedTo !== null;
  }

  /**
   * Reads the operations counted since the previous read and starts the next window.
   *
   * Read-and-reset rather than a plain getter plus a separate `reset()`: the two always
   * belong together here, and a caller that forgets the reset would report a number that
   * only ever grows.
   * @returns {number} Drawing operations issued since the previous call.
   */
  readAndReset() {
    const count = this._count;
    this._count = 0;

    return count;
  }

  /**
   * Replaces one method with a wrapper that counts and forwards.
   *
   * `self` rather than an arrow function, because the wrapper has to keep the context as its
   * own `this` — a canvas context method called with the wrong receiver throws.
   */
  _wrap(context, methodName) {
    const original = context[methodName];

    if (typeof original !== 'function') {
      return;
    }

    const self = this;

    context[methodName] = function countedDrawCall() {
      self._count += 1;

      return original.apply(this, arguments);
    };
  }
}
