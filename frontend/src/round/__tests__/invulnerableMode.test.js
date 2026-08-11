import { describe, expect, it } from 'vitest';
import {
  advanceClock,
  createRoundData,
  isPlayerDead,
  isPlayerInvulnerable,
  registerHit,
  restoreLives,
} from '../roundData.js';

/**
 * The developer mode that makes the player unlosable, in its own file rather than in
 * `roundData.test.js`: that file is a full description of a round's bookkeeping and stood
 * within a line of the 400-line limit, and this is one flag with a handful of consequences
 * — the same split as `playerObstacleBlock.test.js` beside `playerController.test.js`.
 *
 * What is worth pinning here is not that the flag stops damage, which is one branch. It is
 * that it stops damage *and nothing else*: no shield spent, no grace period opened, no life
 * count moved. The mode exists to measure a long round, so anything else it changed would
 * be measured along with it.
 */

// Mirrored rather than imported, like in roundData.test.js: these tests pin the
// behaviour, not the numbers.
const STEP_MS = 1000 / 60;
const HIT_COOLDOWN = 900;
const STARTING_LIVES = 3;

function makeInvulnerableRound() {
  return createRoundData(0, { entityCount: 36 }, { invulnerable: true });
}

function advanceBy(roundData, milliseconds) {
  const steps = Math.round(milliseconds / STEP_MS);
  for (let i = 0; i < steps; i += 1) {
    advanceClock(roundData);
  }
}

describe('the invulnerable developer mode', () => {
  it('is off unless a round is explicitly opened with it', () => {
    // Both the missing options object and an empty one mean an ordinary round: a mode
    // that could be switched on by omission is one nobody chose.
    expect(createRoundData(0, { entityCount: 36 }).invulnerable).toBe(false);
    expect(createRoundData(0, { entityCount: 36 }, {}).invulnerable).toBe(false);
  });

  it('survives more hits than the round has lives', () => {
    const round = makeInvulnerableRound();

    // Spaced a full grace period apart, so every one of them is a hit that would
    // otherwise land. Four times the lives available is well past death.
    for (let i = 0; i < STARTING_LIVES * 4; i += 1) {
      expect(registerHit(round)).toBe(false);
      advanceBy(round, HIT_COOLDOWN + STEP_MS);
    }

    expect(round.lives).toBe(STARTING_LIVES);
    expect(isPlayerDead(round)).toBe(false);
  });

  it('spends no shield and opens no grace period', () => {
    // Both would be visible on screen: a spent Aegis flashes and breaks into shards, and
    // a grace period nothing ever ends would blink the player amber for the whole run.
    const round = makeInvulnerableRound();
    let asked = false;

    registerHit(round, () => {
      asked = true;

      return true;
    });

    expect(asked).toBe(false);
    expect(isPlayerInvulnerable(round)).toBe(false);
  });

  it('leaves healing alone, because there is nothing to heal', () => {
    // Mend still spawns and is still collected — the field decides that from the life
    // count, which never drops here. `restoreLives` declining at full lives is what keeps
    // the power-up from claiming an effect it did not have.
    const round = makeInvulnerableRound();

    registerHit(round);

    expect(restoreLives(round, 1)).toBe(false);
    expect(round.lives).toBe(STARTING_LIVES);
  });
});
