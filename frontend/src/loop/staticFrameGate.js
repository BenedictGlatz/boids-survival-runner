/**
 * Lets a picture that cannot change be drawn once instead of sixty times a second.
 *
 * Behind the pause card and the game-over card the last frame of the round keeps standing:
 * the swarm, the obstacles and the markers hold their positions. That picture is the point —
 * but it was being rebuilt on every drawn frame, lattice and all, for as long as the card was
 * up. A pause can last minutes, and the card's own `backdrop-filter` blurs the arena behind
 * it again every time it is repainted, so the cost is paid twice over for a still image.
 *
 * A signature rather than a boolean: the caller hands over what the current picture *is*, and
 * the gate answers whether that differs from the one already on the canvas. That way a
 * transition from paused to game-over redraws by itself, without anyone having to remember to
 * invalidate in between.
 *
 * Import-free, so it is unit-testable without a browser.
 */

/**
 * The signature a caller passes for a picture that changes every frame. Never latched, so
 * a live frame always draws and also clears whatever a previous static state left behind.
 */
export const LIVE_FRAME = null;

/** Tracks which still picture is currently on the canvas. */
export class StaticFrameGate {
  constructor() {
    this._drawn = LIVE_FRAME;
  }

  /**
   * @param {?string} signature - What the picture about to be drawn is. `LIVE_FRAME` for
   *   anything that moves; any stable string for a picture that does not.
   * @returns {boolean} Whether this frame has to be drawn.
   */
  needsDraw(signature) {
    if (signature === LIVE_FRAME) {
      // A moving picture is on the canvas now, so no still one is — forget what was latched
      // rather than leaving a stale signature to suppress a later, identical-looking state.
      this._drawn = LIVE_FRAME;

      return true;
    }

    if (this._drawn === signature) {
      return false;
    }

    this._drawn = signature;

    return true;
  }

  /**
   * Forces the next frame to be drawn, whatever its signature.
   *
   * For the case the signature cannot see: a resize changes the picture without changing the
   * state. Without this, a game paused and then resized keeps the old image at the old scale.
   * @returns {void}
   */
  invalidate() {
    this._drawn = LIVE_FRAME;
  }
}
