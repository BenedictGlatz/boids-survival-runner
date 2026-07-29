/**
 * Translates raw input state into a normalised player control object.
 *
 * Call this once per simulation step: reading the dash request consumes it, so
 * one key press can only ever produce one dash even when a single animation
 * frame runs several steps.
 */
export function buildControls(inputManager) {
  return {
    direction: inputManager.getMovementDirection(),
    dashRequested: inputManager.consumeDashRequest(),
  };
}
