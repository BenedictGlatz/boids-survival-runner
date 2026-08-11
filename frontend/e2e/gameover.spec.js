import { expect, test } from '@playwright/test';
import { STRINGS, hudNumber, openStartMenu, startRound } from './support/game.js';

/**
 * The full round lifecycle: menu → round → death → restart.
 *
 * Death is reached by standing still. The flock seeks the player and the simulation
 * carries no randomness, so this terminates — but it costs real seconds, three lives
 * with a hit cooldown between them. It is the slowest test in the suite by a wide
 * margin, and the only one that needs a generous timeout.
 *
 * That same standing-still death is what makes the invulnerable developer mode testable
 * at all: it is the only assertion in the suite about something that must *not* happen,
 * and an absence is only worth anything next to the proof that it otherwise would.
 */
test.describe('the round lifecycle', () => {
  test('ends the round when the swarm has taken every life', async ({ page }) => {
    await openStartMenu(page);
    await startRound(page);

    // Standing still is the fastest way to die and needs no input at all.
    await expect(page.locator('#btn-restart')).toBeVisible({ timeout: 60_000 });

    await expect(page.locator('#menu-overlay')).toContainText(STRINGS.menu.gameover);
    await expect(page.locator('#menu-overlay')).toContainText(STRINGS.menu.finalScore);
    await expect(page.locator('#hud-score')).toBeHidden();
  });

  test('never ends the round while the invulnerable developer mode is on', async ({ page }) => {
    // The mirror image of the test above, and the reason the two belong in one file: the
    // same input — no input at all — spends three lives in a handful of seconds up there
    // and has to spend none here. Standing still keeps the swarm on the player the whole
    // time, so twenty seconds are several deaths' worth of contact.
    await openStartMenu(page);
    await page.locator('#btn-developer').click();
    await page
      .locator('#invulnerable-options button')
      .filter({ hasText: STRINGS.settings.on })
      .click();
    await page.keyboard.press('Escape');

    await startRound(page);
    await page.waitForTimeout(20_000);

    // The game-over card is built from scratch when a round ends, so its absence is the
    // assertion — not a hidden element.
    await expect(page.locator('#btn-restart')).toHaveCount(0);
    // And the round is genuinely still running rather than stuck: the score is the
    // simulation clock in whole seconds.
    await expect(page.locator('#hud-score')).toBeVisible();
    expect(await hudNumber(page, '#hud-score')).toBeGreaterThan(15);
  });

  test('restarts into a fresh round from the game-over screen', async ({ page }) => {
    await openStartMenu(page);
    await startRound(page);
    await page.locator('#btn-restart').waitFor({ state: 'visible', timeout: 60_000 });

    await page.locator('#btn-restart').click();

    await expect(page.locator('#menu-overlay')).toBeHidden();
    await expect(page.locator('#hud-timer')).toContainText('00:00');
    // The clock is re-seeded on restart, so the new round starts from wave one with
    // the opening flock rather than inheriting the previous round's state.
    await expect(page.locator('#hud-wave .hud-stat__value')).toHaveText('01');
    expect(await hudNumber(page, '#hud-score')).toBe(0);
  });

  test('remembers the run and shows it as the personal best', async ({ page }) => {
    // The one thing this game keeps between sessions. It is written when the round ends
    // and read when the menu opens, so this is the only place the round trip is visible.
    await openStartMenu(page);
    await startRound(page);
    await page.locator('#btn-restart').waitFor({ state: 'visible', timeout: 60_000 });
    await expect(page.locator('.card--defeat')).toContainText(STRINGS.menu.best);

    await page.locator('#btn-main-menu').click();

    const panel = page.locator('#menu-overlay');
    await expect(panel).toContainText(STRINGS.menu.personalBest);
    await expect(panel).toContainText(STRINGS.menu.lastRun);
    await expect(panel).not.toContainText(STRINGS.menu.noRuns);
  });

  test('opens on the start screen with no records at all', async ({ page }) => {
    // A first-time visitor has an empty storage, and an empty record must read as
    // "no runs yet" rather than as a score of zero.
    await openStartMenu(page);

    await expect(page.locator('#menu-overlay')).toContainText(STRINGS.menu.noRuns);
  });
});
