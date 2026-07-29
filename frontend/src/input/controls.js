/**
 * Translates raw input state into a normalised player control object.
 *
 * Call this once per simulation step: reading the dash request consumes it, so
 * one key press can only ever produce one dash even when a single animation
 * frame runs several steps.
 * @param {import('./inputManager.js').InputManager} inputManager - Source of raw key state.
 * @returns {{direction: {x: number, y: number}, dashRequested: boolean}} This step's controls.
 */
export function buildControls(inputManager) {
  return {
    direction: inputManager.getMovementDirection(),
    dashRequested: inputManager.consumeDashRequest(),
  };
}
