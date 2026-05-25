/**
 * Translates raw input state into a normalised player control object.
 */
export function buildControls(inputManager) {
  return {
    direction: inputManager.getMovementDirection(),
  };
}
