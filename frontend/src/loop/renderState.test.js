import { describe, expect, it } from 'vitest';

import { buildFrozenRenderState, buildRenderState } from './renderState.js';
import { createRoundData } from '../round/roundData.js';
import { PowerupField } from '../powerups/powerups.js';

const TIMING = { renderDeltaSeconds: 1 / 60, timestamp: 12000 };

function makeRound({ roundActive = true } = {}) {
  const round = createRoundData(0, { entityCount: 24 });
  round.roundActive = roundActive;
  round.simulationTimeMs = 5000;

  return round;
}

function makePowerups() {
  const powerups = new PowerupField(() => 0.5);
  powerups.reset(1920, 1080);

  return powerups;
}

const PLAYER = { velocity: { x: 30, y: 40 } };

describe('buildRenderState — a live round', () => {
  it('hands over the three numbers the dash trail samples with', () => {
    const state = buildRenderState(makeRound(), PLAYER, makePowerups(), TIMING);

    expect(state.deltaSeconds).toBe(TIMING.renderDeltaSeconds);
    expect(state.playerSpeed).toBeCloseTo(50, 6);
    expect(state.playerVelocityX).toBe(30);
    expect(state.playerVelocityY).toBe(40);
  });

  it('carries the power-up snapshot along for the renderer and the HUD', () => {
    const powerups = makePowerups();
    powerups.grant('overdrive', 5000);

    const state = buildRenderState(makeRound(), PLAYER, powerups, TIMING);

    expect(state.powerupBuffs.overdrive).toBeCloseTo(1, 6);
    expect(state.powerupMarkers).toEqual([]);
  });

  it('puts the wall clock in seconds, because spin and bob follow the frame rate', () => {
    const state = buildRenderState(makeRound(), PLAYER, makePowerups(), TIMING);

    expect(state.wallClockSeconds).toBe(12);
  });

  it('leaves out the countdown, so nothing dims a running round', () => {
    const state = buildRenderState(makeRound(), PLAYER, makePowerups(), TIMING);

    expect(state.countdownSeconds).toBeUndefined();
  });
});

describe('buildRenderState — the countdown', () => {
  it('omits the sampling fields, which is how the renderer knows the world stands still', () => {
    // Their absence is the signal. A frozen frame sampled into the dash trail would retract
    // the ribbons that belong to the picture.
    const state = buildRenderState(
      makeRound({ roundActive: false }),
      PLAYER,
      makePowerups(),
      TIMING,
    );

    expect(state.deltaSeconds).toBeUndefined();
    expect(state.playerSpeed).toBeUndefined();
  });

  it('claims invulnerability and a full dash bar, because neither can be spent yet', () => {
    // The countdown runs on wall time, so this timestamp has to sit inside it: the round
    // was created at 0 and START_COUNTDOWN_SECONDS have not elapsed at 1000 ms.
    const state = buildRenderState(makeRound({ roundActive: false }), PLAYER, makePowerups(), {
      renderDeltaSeconds: 1 / 60,
      timestamp: 1000,
    });

    expect(state.playerInvulnerable).toBe(true);
    expect(state.dashCooldownProgress).toBe(1);
    expect(state.countdownSeconds).toBeGreaterThan(0);
  });
});

describe('buildFrozenRenderState', () => {
  it('keeps what was lying in the arena but hands over no clock', () => {
    const powerups = makePowerups();
    powerups.grant('aegis', 5000);

    const state = buildFrozenRenderState(makeRound(), powerups);

    expect(state.powerupBuffs.aegis).toBeCloseTo(1, 6);
    expect(state.wallClockSeconds).toBeUndefined();
    expect(state.deltaSeconds).toBeUndefined();
  });

  it('still reports the lives, so the health bar survives into the frozen picture', () => {
    const round = makeRound();
    round.lives = 1;

    expect(buildFrozenRenderState(round, makePowerups()).lives).toBe(1);
  });
});
