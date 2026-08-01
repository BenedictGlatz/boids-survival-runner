import { expect, test } from '@playwright/test';
import { holdKey, openStartMenu, startRound, watchForBrowserProblems } from './support/game.js';

/**
 * What this suite can and cannot check.
 *
 * Marker positions come from `Math.random`, so walking to one would be a race against a
 * coordinate the spec does not know. Spawn, collection, expiry and absorption are covered
 * exhaustively in `src/powerups/powerups.test.js` instead, where the RNG is injected and the
 * simulation clock is driven by hand.
 *
 * A canvas check is out for a second reason on top of the project's usual one: amber is both
 * the Aegis colour and `PLAYER_HIT_COLOR`, so counting amber pixels cannot tell a marker from
 * a player who just took a hit.
 *
 * What is left is exactly the half Vitest structurally cannot reach — the wiring. That the
 * HUD rows exist, that they stay out of the way until a buff runs, that a restart leaves none
 * of them behind, and that a round survives several spawn intervals of power-up code running
 * inside every simulation step.
 */

const AEGIS_ROW = '#hud-buff-aegis';
const OVERDRIVE_ROW = '#hud-buff-overdrive';

/**
 * Longer than two spawn intervals (9 s each), so markers have been offered, placed and — for
 * the first one — had their obstacle clearance checked against a world that has obstacles in it.
 */
const TWO_SPAWN_INTERVALS_MS = 20000;

/** One lap of the movement the crash test uses to keep the player away from the flock. */
const LAP_MS = 500;

test.describe('power-ups', () => {
  test('keeps both buff rows in the HUD and out of sight until one runs', async ({ page }) => {
    // The rows are built once in the Hud constructor and hidden, rather than created and
    // destroyed per buff: a row that appears has to push the dash bar down by its own height,
    // and doing that from a mid-round DOM insertion is what makes a HUD jump.
    await openStartMenu(page);
    await startRound(page);

    await expect(page.locator(AEGIS_ROW)).toBeAttached();
    await expect(page.locator(OVERDRIVE_ROW)).toBeAttached();
    await expect(page.locator(AEGIS_ROW)).toBeHidden();
    await expect(page.locator(OVERDRIVE_ROW)).toBeHidden();
  });

  test('runs a round with power-ups spawning in it without breaking', async ({ page }) => {
    // The power-up field runs inside every simulation step and reads the obstacle buffer
    // while placing a marker, so a wrong stride or a missing guard would throw on the frame
    // an obstacle happens to exist on — not at start-up, which is what makes it worth playing
    // past several spawn intervals rather than merely booting.
    const problems = watchForBrowserProblems(page);
    await openStartMenu(page);
    await startRound(page);

    const laps = Math.round(TWO_SPAWN_INTERVALS_MS / (LAP_MS * 2));
    for (let lap = 0; lap < laps; lap += 1) {
      await holdKey(page, 'ArrowRight', LAP_MS);
      await holdKey(page, 'ArrowLeft', LAP_MS);
    }

    expect(problems).toEqual([]);
    // Either still playing or a clean game over — both are fine, a crash is not.
    const stillPlaying = await page.locator('#hud-score').isVisible();
    const gameOver = await page.locator('#btn-restart').isVisible();
    expect(stillPlaying || gameOver).toBe(true);
  });

  test('starts a restarted round with nothing left over', async ({ page }) => {
    // `powerups.reset()` sits in beginRound(), where the simulation clock goes back to zero.
    // Left out, the second round would open with the first round's markers and buffs, all of
    // them measured against a clock that just restarted.
    await openStartMenu(page);
    await startRound(page);
    await page.waitForTimeout(TWO_SPAWN_INTERVALS_MS / 2);

    await page.reload();
    await page.locator('#btn-start').waitFor({ state: 'visible' });
    await startRound(page);

    await expect(page.locator(AEGIS_ROW)).toBeHidden();
    await expect(page.locator(OVERDRIVE_ROW)).toBeHidden();
  });
});
