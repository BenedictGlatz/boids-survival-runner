/**
 * How many frames actually reached the screen per second.
 *
 * The frametime graph plots how *long* a frame took, which is not the same question. A
 * target framerate of 60 on a 144 Hz panel can produce 48, 60 or 144 drawn frames per
 * second depending on how the render gate and the display refresh interact, and no curve in
 * the graph distinguishes those three. This counter does, and it is the only falsifiable
 * test for the claim that the framerate setting limits anything at all.
 *
 * Counted rather than derived from a frame duration: one interval says what the gap between
 * two frames was, a count over a window says how many there were. Under a gate that lets
 * frames through unevenly those two disagree, and the count is the one a user would recognise.
 *
 * Import-free arithmetic with an injected clock, so it runs under Vitest without a browser.
 */

/** Window the count is taken over. One second, so the reported number needs no scaling. */
const WINDOW_MS = 1000;

/** Frames drawn per second, over a sliding one-second window. */
export class DrawnFrameRate {
  constructor() {
    this._framesInWindow = 0;
    this._windowStartedAt = null;
    this._rate = null;
  }

  /**
   * Records one drawn frame and reports the last completed window.
   *
   * The value only changes once per second on purpose: a rate recomputed every frame would
   * jitter by several frames per second and be unreadable next to a curve that already
   * scrolls.
   * @param {number} timestampMs - A monotonic clock reading, e.g. the `requestAnimationFrame`
   *   timestamp. Only differences are used, so the origin does not matter.
   * @returns {?number} Frames per second over the last completed window, or `null` until the
   *   first full second has passed.
   */
  sample(timestampMs) {
    // The frame that opens a window is its boundary marker, not a member of it. Counting it
    // would put one frame too many into a span it only delimits — the fencepost that makes a
    // steady 60 report as 61.
    if (this._windowStartedAt === null) {
      this._windowStartedAt = timestampMs;

      return this._rate;
    }

    this._framesInWindow += 1;
    const elapsedMs = timestampMs - this._windowStartedAt;

    // A clock that jumped backwards (or a caller mixing two clocks) would otherwise hold the
    // window open forever. Restarting is the honest response: the samples so far are not
    // attributable to a known span of time.
    if (elapsedMs < 0) {
      this._framesInWindow = 0;
      this._windowStartedAt = timestampMs;

      return this._rate;
    }

    if (elapsedMs >= WINDOW_MS) {
      this._rate = (this._framesInWindow * WINDOW_MS) / elapsedMs;
      this._framesInWindow = 0;
      this._windowStartedAt = timestampMs;
    }

    return this._rate;
  }

  /**
   * Forgets the current window and the last reported rate.
   *
   * Belongs wherever drawing stops for an unknown length of time — a pause, or leaving to
   * the menu. Without it the window that spans the break reports a rate near zero, which
   * describes the break rather than the game.
   * @returns {void}
   */
  reset() {
    this._framesInWindow = 0;
    this._windowStartedAt = null;
    this._rate = null;
  }
}
