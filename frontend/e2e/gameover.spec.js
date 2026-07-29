import { expect, test } from '@playwright/test';
import { STRINGS, hudNumber, openStartMenu, startRound } from './support/game.js';

/**
 * The full round lifecycle: menu → round → death → restart.
 *
 * Death is reached by standing still. The flock seeks the player and the simulation
 * carries no randomness, so this terminates — but it costs real seconds, three lives
 * with a hit cooldown between them. It is the slowest test in the suite by a wide
 * margin, and the only one that needs a generous timeout.
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

  test('restarts into a fresh round from the game-over screen', async ({ page }) => {
    await openStartMenu(page);
    await startRound(page);
    await page.locator('#btn-restart').waitFor({ state: 'visible', timeout: 60_000 });

    await page.locator('#btn-restart').click();

    await expect(page.locator('#menu-overlay')).toBeHidden();
    await expect(page.locator('#hud-timer')).toContainText('00:00');
    // The clock is re-seeded on restart, so the new round starts from wave one with
    // the opening flock rather than inheriting the previous round's state.
    await expect(page.locator('#hud-wave')).toContainText(`${STRINGS.hud.wave}: 1`);
    expect(await hudNumber(page, '#hud-score')).toBe(0);
  });
});
