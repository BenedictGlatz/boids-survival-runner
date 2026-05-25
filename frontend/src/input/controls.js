/**
 * Translates raw input state into a normalised player control object.
 */
export function buildControls(inputManager) {
  return {
    position: inputManager.getPlayerPosition(),
  };
}
