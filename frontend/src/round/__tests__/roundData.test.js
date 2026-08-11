import { describe, expect, it } from 'vitest';
import {
  advanceClock,
  beginRound,
  countdownSecondsLeft,
  createRoundData,
  dueWaveNumber,
  isPlayerDashReady,
  isPlayerDead,
  isPlayerInvulnerable,
  pauseCountdown,
  playerDashCooldownProgress,
  registerDash,
  registerHit,
  restoreLives,
  resumeCountdown,
  runSummary,
} from '../roundData.js';

// The tuning values are mirrored rather than imported: these tests pin the
// behaviour, not the numbers. The one exception is the step length, which is the
// unit advanceClock counts in.
const STEP_MS = 1000 / 60;
const HIT_COOLDOWN = 900;
const DASH_COOLDOWN = 1400;
const STARTING_LIVES = 3;
const WAVE_SECONDS = 30;

function makeRound(startedAt = 0) {
  return createRoundData(startedAt, { entityCount: 36 });
}

function advanceBy(roundData, milliseconds) {
  const steps = Math.round(milliseconds / STEP_MS);
  for (let i = 0; i < steps; i += 1) {
    advanceClock(roundData);
  }
}

describe('createRoundData', () => {
  it('starts with a full set of lives and nothing scored', () => {
    const round = makeRound();

    expect(round.lives).toBe(STARTING_LIVES);
    expect(round.maxLives).toBe(STARTING_LIVES);
    expect(round.score).toBe(0);
    expect(round.simulationTimeMs).toBe(0);
    expect(round.roundActive).toBe(false);
  });

  it('seeds the boid count from the snapshot taken before the first step', () => {
    // The HUD shows a boid count while the countdown runs, when no tick has
    // happened yet. Starting at zero would flash a wrong number for three seconds.
    const round = createRoundData(0, { entityCount: 48 });

    expect(round.entityCount).toBe(48);
  });

  it('has the dash ready on the very first step', () => {
    // The timestamp is seeded a whole cooldown into the past for exactly this.
    expect(isPlayerDashReady(makeRound())).toBe(true);
    expect(playerDashCooldownProgress(makeRound())).toBe(1);
  });

  it('is not invulnerable before anything has happened', () => {
    expect(isPlayerInvulnerable(makeRound())).toBe(false);
  });
});

describe('advanceClock', () => {
  it('derives the timer and the score from the simulation clock, not wall time', () => {
    const round = makeRound();

    advanceBy(round, 2500);

    expect(round.simulationTimeMs).toBeCloseTo(2500, 4);
    expect(round.timerSeconds).toBeCloseTo(2.5, 4);
    expect(round.score).toBe(2);
  });
});

describe('registerHit', () => {
  it('spends a life and reports that it did', () => {
    const round = makeRound();

    expect(registerHit(round)).toBe(true);
    expect(round.lives).toBe(STARTING_LIVES - 1);
  });

  it('refuses a second hit inside the grace period', () => {
    // Without this, every source of damage would drain all three lives in three
    // consecutive steps, which is 50 ms.
    const round = makeRound();
    registerHit(round);

    advanceBy(round, HIT_COOLDOWN / 2);

    expect(registerHit(round)).toBe(false);
    expect(round.lives).toBe(STARTING_LIVES - 1);
  });

  it('accepts the next hit once the grace period has elapsed', () => {
    const round = makeRound();
    registerHit(round);

    advanceBy(round, HIT_COOLDOWN + STEP_MS);

    expect(registerHit(round)).toBe(true);
    expect(round.lives).toBe(STARTING_LIVES - 2);
  });

  it('lets an absorber cancel a hit without spending a life', () => {
    const round = makeRound();

    expect(registerHit(round, () => true)).toBe(false);
    expect(round.lives).toBe(STARTING_LIVES);
  });

  it('starts no grace period for an absorbed hit, so the next one still costs', () => {
    // A shield is a single charge, not a second invulnerability window.
    const round = makeRound();
    registerHit(round, () => true);

    expect(registerHit(round)).toBe(true);
    expect(round.lives).toBe(STARTING_LIVES - 1);
  });

  it('never asks the absorber during the grace period', () => {
    // Otherwise a shield would be spent on a hit that was free anyway.
    const round = makeRound();
    registerHit(round);
    advanceBy(round, HIT_COOLDOWN / 2);

    let asked = false;
    registerHit(round, () => {
      asked = true;

      return true;
    });

    expect(asked).toBe(false);
  });

  it('spends a life when the absorber declines', () => {
    const round = makeRound();

    expect(registerHit(round, () => false)).toBe(true);
    expect(round.lives).toBe(STARTING_LIVES - 1);
  });

  it('reports death only once the last life is gone', () => {
    const round = makeRound();

    for (let i = 0; i < STARTING_LIVES; i += 1) {
      expect(isPlayerDead(round)).toBe(false);
      registerHit(round);
      advanceBy(round, HIT_COOLDOWN + STEP_MS);
    }

    expect(isPlayerDead(round)).toBe(true);
  });
});

describe('restoreLives', () => {
  it('gives a segment back after one was lost', () => {
    const roundData = makeRound();
    registerHit(roundData);

    expect(restoreLives(roundData, 1)).toBe(true);
    expect(roundData.lives).toBe(STARTING_LIVES);
  });

  it('never goes past the maximum the round started with', () => {
    const roundData = makeRound();

    expect(restoreLives(roundData, 1)).toBe(false);
    expect(roundData.lives).toBe(STARTING_LIVES);
  });

  it('clamps a generous source rather than refusing it', () => {
    const roundData = makeRound();
    registerHit(roundData);

    expect(restoreLives(roundData, 99)).toBe(true);
    expect(roundData.lives).toBe(STARTING_LIVES);
  });

  it('grants no grace period — that belongs to being hit', () => {
    const roundData = makeRound();
    advanceBy(roundData, HIT_COOLDOWN * 2);
    registerHit(roundData);
    advanceBy(roundData, HIT_COOLDOWN * 2);

    restoreLives(roundData, 1);

    // The next hit costs a life immediately: a heal is not a second Aegis.
    expect(isPlayerInvulnerable(roundData)).toBe(false);
    expect(registerHit(roundData)).toBe(true);
  });

  it('buys back one mistake and not the whole run', () => {
    const roundData = makeRound();
    advanceBy(roundData, HIT_COOLDOWN * 2);
    registerHit(roundData);
    advanceBy(roundData, HIT_COOLDOWN * 2);
    registerHit(roundData);

    restoreLives(roundData, 1);

    // Two lives spent, one back: an extension of the run rather than a reset of it.
    expect(roundData.lives).toBe(STARTING_LIVES - 1);
    expect(isPlayerDead(roundData)).toBe(false);
  });
});

describe('the dash cooldown', () => {
  it('blocks a second dash until the cooldown has run out', () => {
    const round = makeRound();
    registerDash(round);

    expect(isPlayerDashReady(round)).toBe(false);
    advanceBy(round, DASH_COOLDOWN / 2);
    expect(isPlayerDashReady(round)).toBe(false);
    expect(playerDashCooldownProgress(round)).toBeLessThan(1);

    advanceBy(round, DASH_COOLDOWN / 2 + STEP_MS);

    expect(isPlayerDashReady(round)).toBe(true);
    expect(playerDashCooldownProgress(round)).toBe(1);
  });
});

describe('beginRound', () => {
  it('restarts the simulation clock and re-seeds every timestamp measured against it', () => {
    // The clock jumps back to zero here. A timestamp left over from the countdown
    // would be compared against a clock that just restarted, which would read as a
    // dash on cooldown and an invulnerable player for the first second of play.
    const round = makeRound();
    advanceBy(round, 5000);
    registerDash(round);
    registerHit(round);

    beginRound(round);

    expect(round.roundActive).toBe(true);
    expect(round.simulationTimeMs).toBe(0);
    expect(isPlayerDashReady(round)).toBe(true);
    expect(isPlayerInvulnerable(round)).toBe(false);
  });

  it('keeps the lives already spent during the countdown', () => {
    // Only the clock restarts. Refilling the lives here would make the countdown a
    // free pass, and resetting the score would discard nothing but is just as wrong.
    const round = makeRound();
    registerHit(round);

    beginRound(round);

    expect(round.lives).toBe(STARTING_LIVES - 1);
  });
});

describe('dueWaveNumber', () => {
  it('starts at wave one and steps up once per wave duration', () => {
    const round = makeRound();

    expect(dueWaveNumber(round)).toBe(1);

    round.timerSeconds = WAVE_SECONDS - 0.1;
    expect(dueWaveNumber(round)).toBe(1);

    round.timerSeconds = WAVE_SECONDS;
    expect(dueWaveNumber(round)).toBe(2);

    round.timerSeconds = WAVE_SECONDS * 3.5;
    expect(dueWaveNumber(round)).toBe(4);
  });
});

describe('countdownSecondsLeft', () => {
  it('rounds up, so the last fraction of a second still shows a one', () => {
    // Rounding down would show a zero for a whole second before the round starts.
    const round = makeRound(1000);

    expect(countdownSecondsLeft(round, 1000)).toBe(3);
    expect(countdownSecondsLeft(round, 3100)).toBe(1);
    expect(countdownSecondsLeft(round, 4000)).toBe(0);
  });
});

describe('pausing the countdown', () => {
  it('owes the same time after a pause as it did before it', () => {
    // The whole point. `countdownEndsAt` is the only wall-clock value a round carries, so
    // it is the only one a pause can invalidate: without parking the remainder, a pause
    // longer than the countdown makes the round start with no countdown at all.
    const round = makeRound(0);
    const leftAtPause = countdownSecondsLeft(round, 1000);

    pauseCountdown(round, 1000);
    resumeCountdown(round, 60_000);

    expect(countdownSecondsLeft(round, 60_000)).toBe(leftAtPause);
  });

  it('leaves the round waiting rather than starting it behind the card', () => {
    const round = makeRound(0);

    pauseCountdown(round, 1000);
    resumeCountdown(round, 60_000);

    expect(round.roundActive).toBe(false);
    expect(round.countdownEndsAt).toBeGreaterThan(60_000);
  });

  it('owes nothing once the countdown had already run out', () => {
    // Clamped rather than negative, so a pause taken after the deadline cannot hand the
    // player back time the countdown already spent.
    const round = makeRound(0);

    pauseCountdown(round, 10_000);

    expect(round.countdownRemainingMs).toBe(0);

    resumeCountdown(round, 60_000);

    expect(round.countdownEndsAt).toBe(60_000);
  });

  it('does not touch a round that is already running', () => {
    // Pausing in the fortieth second must not rewind a countdown that finished long ago.
    // The guard lives in these two functions, which is why the caller needs no branch.
    const round = makeRound(0);
    beginRound(round);
    const deadline = round.countdownEndsAt;

    pauseCountdown(round, 40_000);
    resumeCountdown(round, 90_000);

    expect(round.countdownEndsAt).toBe(deadline);
    expect(round.countdownRemainingMs).toBe(0);
  });
});

describe('runSummary', () => {
  it('reports the run the way both cards and the record store read it', () => {
    // One shape for the game-over card, the pause card and `roundRecords`, and the only
    // place the round's `timerSeconds` is renamed to the `timeSeconds` they expect.
    const round = makeRound(0);
    beginRound(round);
    advanceBy(round, 5000);
    round.wave = 3;

    expect(runSummary(round)).toEqual({
      score: 5,
      wave: 3,
      timeSeconds: round.timerSeconds,
      boids: 36,
    });
  });
});
