import { dashCooldownProgress, isDashReady } from '../player/dashCooldown.js';
import {
  HIT_COOLDOWN_MS,
  PLAYER_DASH_COOLDOWN_MS,
  PLAYER_STARTING_LIVES,
  SIMULATION_STEP_MS,
  START_COUNTDOWN_SECONDS,
  WAVE_DURATION_SECONDS,
} from '../gameConfig.js';

// The bookkeeping of a single round, kept apart from index.js so it can be tested
// without a browser. Everything here reads the simulation clock rather than wall
// time, which is why none of it takes a timestamp except the countdown.

/**
 * Creates the state of a fresh round.
 * @param {number} startedAt - Wall-clock time the countdown starts at, in milliseconds.
 * @param {{entityCount: number}} initialFrame - Engine snapshot taken before the first step.
 * @returns {object} The round state every other function in this module operates on.
 */
export function createRoundData(startedAt, initialFrame) {
  return {
    score: 0,
    lives: PLAYER_STARTING_LIVES,
    maxLives: PLAYER_STARTING_LIVES,
    timerSeconds: 0,
    wave: 1,
    // Seeded from the initial snapshot so the HUD shows the real boid count
    // while the countdown runs and no simulation step has happened yet.
    entityCount: initialFrame.entityCount,
    // Authoritative game clock: advanced by the fixed simulation step, not by
    // wall time, so backgrounding the tab cannot hand out free score.
    simulationTimeMs: 0,
    lastHitAtSimulationMs: -HIT_COOLDOWN_MS,
    // Seeded a whole cooldown into the past, so the dash is ready on frame one.
    lastDashAtSimulationMs: -PLAYER_DASH_COOLDOWN_MS,
    // The countdown runs before the simulation starts, so it stays on wall
    // time — three seconds should be three real seconds.
    countdownEndsAt: startedAt + START_COUNTDOWN_SECONDS * 1000,
    // Where a pause parks the rest of the countdown. Present from the start rather than
    // appearing at runtime, so the shape of a round never depends on whether it was paused.
    countdownRemainingMs: 0,
    roundActive: false,
    currentFrame: initialFrame,
  };
}

/**
 * Starts the round the countdown was waiting for.
 *
 * The simulation clock jumps back to zero here, so every timestamp measured
 * against it has to be re-seeded in the same place. Leaving an old value behind
 * would compare it to a clock that just restarted.
 * @param {object} roundData - The round state to start.
 * @returns {void}
 */
export function beginRound(roundData) {
  roundData.roundActive = true;
  roundData.simulationTimeMs = 0;
  roundData.lastHitAtSimulationMs = -HIT_COOLDOWN_MS;
  roundData.lastDashAtSimulationMs = -PLAYER_DASH_COOLDOWN_MS;
}

/**
 * Advances the simulation clock by one fixed step and derives the timer and score from it.
 * @param {object} roundData - The round state to advance.
 * @returns {void}
 */
export function advanceClock(roundData) {
  roundData.simulationTimeMs += SIMULATION_STEP_MS;
  roundData.timerSeconds = roundData.simulationTimeMs / 1000;
  roundData.score = Math.floor(roundData.timerSeconds);
}

/**
 * The round as the two cards and the record store all want to read it.
 *
 * One function rather than the same object literal in two places: the game-over card and
 * the pause card must not disagree about what a run is, and `roundRecords.js` consumes the
 * same shape. It is also the only place `timerSeconds` is renamed to `timeSeconds`.
 * @param {object} roundData - The round state to summarise.
 * @returns {{score: number, wave: number, timeSeconds: number, boids: number}} The summary.
 */
export function runSummary(roundData) {
  return {
    score: roundData.score,
    wave: roundData.wave,
    timeSeconds: roundData.timerSeconds,
    boids: roundData.entityCount,
  };
}

/**
 * Whether the player is currently in the grace period after taking a hit.
 * @param {object} roundData - The round state to inspect.
 * @returns {boolean} True while no further hit may be counted.
 */
export function isPlayerInvulnerable(roundData) {
  return roundData.simulationTimeMs - roundData.lastHitAtSimulationMs < HIT_COOLDOWN_MS;
}

/**
 * Spends one life unless the player is still invulnerable or something absorbs the hit.
 *
 * Every source of damage goes through this one function on purpose. Sharing the
 * grace period is what keeps a player who is leaning against something from
 * losing every life within a handful of steps.
 *
 * The order of the two escapes matters and is the reason `absorbHit` is a callback rather
 * than a flag: the grace period is checked first, so a shield is never spent on a hit that
 * would have cost nothing anyway. An absorbed hit deliberately starts no grace period —
 * `lastHitAtSimulationMs` stays where it was, so the next hit costs a life immediately and a
 * shield reads as a single charge rather than as a second invulnerability window.
 * @param {object} roundData - The round state to charge the hit to.
 * @param {() => boolean} [absorbHit] - Asked only for a hit that would really land. Returning
 *   true consumes whatever absorbed it and cancels the damage.
 * @returns {boolean} True if a life was actually spent.
 */
export function registerHit(roundData, absorbHit) {
  if (isPlayerInvulnerable(roundData)) {
    return false;
  }

  if (absorbHit !== undefined && absorbHit() === true) {
    return false;
  }

  roundData.lives -= 1;
  roundData.lastHitAtSimulationMs = roundData.simulationTimeMs;

  return true;
}

/**
 * Gives life segments back, never past the number the round started with.
 *
 * The counterpart of `registerHit`, and like it the single funnel for its direction: whatever
 * restores a life goes through here, so the clamp against `maxLives` exists once. How many
 * segments a source is worth is the source's business and is passed in — `MEND_SEGMENTS` for
 * the power-up that has the only claim on it today.
 *
 * It grants **no** invulnerability, and that is deliberate rather than an omission: the grace
 * period belongs to being hit, and Aegis is already the ability that buys protection. Two
 * abilities with overlapping effects is one too many.
 * @param {object} roundData - The round state to credit the lives to.
 * @param {number} segments - How many segments to restore; at least 1 to have any effect.
 * @returns {boolean} True if at least one segment was actually restored, false at full lives.
 */
export function restoreLives(roundData, segments) {
  if (roundData.lives >= roundData.maxLives) {
    return false;
  }

  roundData.lives = Math.min(roundData.maxLives, roundData.lives + segments);

  return true;
}

/**
 * Whether the round is over because the player ran out of lives.
 * @param {object} roundData - The round state to inspect.
 * @returns {boolean} True once no lives are left.
 */
export function isPlayerDead(roundData) {
  return roundData.lives <= 0;
}

/**
 * Whether the dash cooldown has elapsed.
 * @param {object} roundData - The round state to inspect.
 * @returns {boolean} True if a dash may start on this step.
 */
export function isPlayerDashReady(roundData) {
  return isDashReady(
    roundData.simulationTimeMs,
    roundData.lastDashAtSimulationMs,
    PLAYER_DASH_COOLDOWN_MS,
  );
}

/**
 * Records that a dash started on this step, which restarts its cooldown.
 * @param {object} roundData - The round state to record the dash in.
 * @returns {void}
 */
export function registerDash(roundData) {
  roundData.lastDashAtSimulationMs = roundData.simulationTimeMs;
}

/**
 * How far the dash cooldown has recharged, for the bar the renderer draws.
 * @param {object} roundData - The round state to inspect.
 * @returns {number} Progress between 0 and 1, where 1 means ready.
 */
export function playerDashCooldownProgress(roundData) {
  return dashCooldownProgress(
    roundData.simulationTimeMs,
    roundData.lastDashAtSimulationMs,
    PLAYER_DASH_COOLDOWN_MS,
  );
}

/**
 * The wave the elapsed round time calls for, which may be the current one.
 * @param {object} roundData - The round state to inspect.
 * @returns {number} The wave number, counting from 1.
 */
export function dueWaveNumber(roundData) {
  return Math.floor(roundData.timerSeconds / WAVE_DURATION_SECONDS) + 1;
}

/**
 * Whole seconds left on the start countdown, rounded up for display.
 * @param {object} roundData - The round state to inspect.
 * @param {number} timestamp - Current wall-clock time in milliseconds.
 * @returns {number} Seconds still to show.
 */
export function countdownSecondsLeft(roundData, timestamp) {
  return Math.ceil((roundData.countdownEndsAt - timestamp) / 1000);
}

/**
 * Parks the rest of the countdown when the game is paused.
 *
 * `countdownEndsAt` is the only wall-clock value in this module — everything else measures
 * against `simulationTimeMs`, which simply stops when no step runs. It is therefore also
 * the only value a pause can invalidate: pausing at "3" and resuming ten seconds later
 * would find the deadline long past and start the round with no countdown at all.
 *
 * The `roundActive` check lives here rather than in the caller, so pausing in the middle of
 * a round cannot rewind a countdown that finished long ago, and so the caller needs no
 * branch of its own.
 * @param {object} roundData - The round state to pause.
 * @param {number} timestamp - Current wall-clock time in milliseconds.
 * @returns {void}
 */
export function pauseCountdown(roundData, timestamp) {
  if (roundData.roundActive) {
    return;
  }

  roundData.countdownRemainingMs = Math.max(0, roundData.countdownEndsAt - timestamp);
}

/**
 * Gives the parked countdown a fresh deadline, measured from now.
 *
 * The counterpart of `pauseCountdown`, with the same guard for the same reason. A pause
 * longer than the whole countdown leaves a remainder of zero, so the round starts on the
 * first resumed frame instead of owing the player time it already took.
 * @param {object} roundData - The round state to resume.
 * @param {number} timestamp - Current wall-clock time in milliseconds.
 * @returns {void}
 */
export function resumeCountdown(roundData, timestamp) {
  if (roundData.roundActive) {
    return;
  }

  roundData.countdownEndsAt = timestamp + roundData.countdownRemainingMs;
}
