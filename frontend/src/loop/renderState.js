/**
 * Builds the one object the renderer and the HUD both read for a drawn frame.
 *
 * It lives here rather than in `index.js` for two reasons: that file stood at the 400-line
 * limit when the power-ups arrived, and everything this function does is plain reading and
 * arithmetic, which makes it testable under Vitest while `index.js` — which pulls in the
 * renderer and the DOM — is not.
 *
 * Nothing here decides anything. The renderer and the HUD are handed data and ask nothing
 * back, which is what keeps them free of any reference to the simulation side.
 */

import {
  countdownSecondsLeft,
  isPlayerInvulnerable,
  playerDashCooldownProgress,
} from '../round/roundData.js';

/**
 * The state of one drawn frame, for the renderer and the HUD together.
 *
 * The live and the frozen branch differ in more than their values: `deltaSeconds`,
 * `playerSpeed` and the velocity are simply **absent** while the world stands still, and
 * their absence is how the renderer knows not to sample a frozen frame into the dash trail.
 * The countdown branch also claims invulnerability and a full dash bar, because neither can
 * be spent before the round has started.
 * @param {object} roundData - The current round state, from `round/roundData.js`.
 * @param {import('../player/playerController.js').PlayerController} player - For its velocity.
 * @param {import('../powerups/powerups.js').PowerupField} powerups - Asked for its snapshot.
 * @param {{renderDeltaSeconds: number, timestamp: number}} timing - Wall-clock time of this
 *   frame and the wall-clock seconds since the previous drawn one.
 * @returns {object} The render state to hand to `drawFrame` and `hud.update`.
 */
export function buildRenderState(roundData, player, powerups, timing) {
  const shared = {
    lives: roundData.lives,
    maxLives: roundData.maxLives,
    // Wall time, for the spin and the bob of a marker. Everything a power-up decides runs on
    // the simulation clock; only how it looks follows the frame rate.
    wallClockSeconds: timing.timestamp / 1000,
    ...powerups.snapshot(roundData.simulationTimeMs),
  };

  if (!roundData.roundActive) {
    return {
      ...shared,
      countdownSeconds: countdownSecondsLeft(roundData, timing.timestamp),
      playerInvulnerable: true,
      dashCooldownProgress: 1,
    };
  }

  return {
    ...shared,
    playerInvulnerable: isPlayerInvulnerable(roundData),
    dashCooldownProgress: playerDashCooldownProgress(roundData),
    deltaSeconds: timing.renderDeltaSeconds,
    playerSpeed: Math.hypot(player.velocity.x, player.velocity.y),
    playerVelocityX: player.velocity.x,
    playerVelocityY: player.velocity.y,
  };
}

/**
 * The frozen picture behind the game-over card and behind the pause card.
 *
 * Nothing advances here, so no wall clock is handed over and the markers stand as still as
 * everything else — but whatever was lying in the arena stays lying in it, the same way the
 * swarm and the obstacles that killed you stay on screen.
 *
 * It carries no `countdownSeconds` either, which is what drops the countdown glyph behind a
 * pause taken before the round began. That is deliberate: the live builder would tick the
 * countdown down behind the card, and a card cannot say "paused" over a running clock.
 * @param {object} roundData - The round state the run ended with.
 * @param {import('../powerups/powerups.js').PowerupField} powerups - Asked for its snapshot.
 * @returns {object} The render state to hand to `drawFrame`.
 */
export function buildFrozenRenderState(roundData, powerups) {
  return {
    lives: roundData.lives,
    maxLives: roundData.maxLives,
    ...powerups.snapshot(roundData.simulationTimeMs),
  };
}
