/**
 * What gets drawn in each game state, and — as of the GPU work — how often.
 *
 * Lifted out of `index.js`, which stood at the 400-line limit. The move pays for itself
 * beyond the line count: the state-to-picture mapping is now one small module instead of a
 * branch buried in the frame loop, and the still-frame gate it owns has somewhere to live.
 */

import { STATE } from '../gameState.js';
import { buildFrozenRenderState, buildRenderState } from './renderState.js';
import { LIVE_FRAME, StaticFrameGate } from './staticFrameGate.js';

/**
 * Both cards keep the last frame of the round standing behind them. Two distinct signatures,
 * so dying out of a pause redraws rather than keeping the pause's picture.
 */
const PAUSED_PICTURE = 'paused';
const GAME_OVER_PICTURE = 'gameover';

/**
 * Binds the renderer to the game state.
 * @param {object} parts - The collaborators, all of them owned by `index.js`.
 * @param {object} parts.state - The `GameState` machine, asked which picture is current.
 * @param {object} parts.renderer - The `Renderer` the frame is drawn through.
 * @param {object} parts.player - The `PlayerController`, for the position to draw at.
 * @param {object} parts.hud - The DOM HUD, updated alongside a live frame.
 * @param {object} parts.powerups - The `PowerupField`, read into the render state.
 * @returns {{render: Function, invalidate: Function}} `render(gameData, timestamp,
 *   renderDeltaSeconds)` draws the frame the current state calls for, and `invalidate()`
 *   forces the next one even if the state has not changed.
 */
export function createStateRenderer({ state, renderer, player, hud, powerups }) {
  const staticFrames = new StaticFrameGate();

  function render(gameData, timestamp, renderDeltaSeconds) {
    // Behind both cards the last frame keeps standing, dimmed by the card's own scrim: the
    // swarm and the obstacles that killed you — or that you walked away from for a moment —
    // stay on screen instead of the arena going empty. Nothing advances, and now nothing is
    // redrawn either: the picture cannot change, so it is painted once per state.
    //
    // Two states spelled out rather than inverting PLAYING, because this branch runs first
    // and MENU must not reach it — a round left behind is still lying in `gameData`. The
    // countdown glyph is deliberately lost here (the frozen state carries no
    // `countdownSeconds`): a ticking countdown behind a pause card would be a lie, and a
    // frozen one would be noise under a card that brings its own title.
    if (state.is(STATE.GAME_OVER) || state.is(STATE.PAUSED)) {
      const picture = state.is(STATE.PAUSED) ? PAUSED_PICTURE : GAME_OVER_PICTURE;

      if (!staticFrames.needsDraw(picture)) {
        return;
      }

      const frozen = buildFrozenRenderState(gameData, powerups);
      renderer.drawFrame(gameData.currentFrame, player.getPosition(), frozen);

      return;
    }

    // Nothing at all on the menu: the game canvas is hidden there rather than wiped, so the
    // swarm behind the deck — a canvas of its own, further back — shows through on its own.
    if (!state.is(STATE.PLAYING)) {
      return;
    }

    staticFrames.needsDraw(LIVE_FRAME);

    const playerPosition = player.getPosition();
    // Built once and handed to both the renderer and the HUD: the dash bar moved into the
    // HUD, but the player's own state is still drawn on the canvas, and they have to agree
    // within a frame.
    const renderState = buildRenderState(gameData, player, powerups, {
      renderDeltaSeconds,
      timestamp,
    });

    renderer.drawFrame(gameData.currentFrame, playerPosition, renderState);
    hud.update(gameData, renderState);
  }

  return { render, invalidate: () => staticFrames.invalidate() };
}
