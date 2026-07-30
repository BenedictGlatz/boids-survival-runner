import { expect, test } from '@playwright/test';
import { STRINGS, holdKey, hudNumber, openStartMenu, startRound } from './support/game.js';

/**
 * What is and is not asserted here.
 *
 * The player, the boids and the dash cooldown bar are all drawn on the canvas, so
 * there is no DOM to read them from. Pixel comparison is not used as a substitute:
 * the flock moves every frame, so any screenshot of the play area differs from any
 * other and an inequality assertion would pass whatever the input did. The drawing
 * arithmetic is unit-tested instead (`renderer/dashPulse.js`, `player/dashCooldown.js`).
 *
 * What E2E can check, and what no unit test can, is the *ownership of the keyboard*
 * — the one input behaviour that is a documented design decision rather than
 * arithmetic: the dash key is only claimed while a round runs, so the space bar
 * keeps operating the menu everywhere else.
 */
test.describe('keyboard input', () => {
  test('keeps the round running while movement keys are held', async ({ page }) => {
    await openStartMenu(page);
    await startRound(page);
    const scoreBefore = await hudNumber(page, '#hud-score');

    await holdKey(page, 'ArrowRight', 700);
    await holdKey(page, 'ArrowUp', 700);
    await holdKey(page, 'd', 700);

    expect(await hudNumber(page, '#hud-score')).toBeGreaterThan(scoreBefore);
    await expect(page.locator('#menu-overlay')).toBeHidden();
  });

  test('accepts a dash without disturbing the round', async ({ page }) => {
    await openStartMenu(page);
    await startRound(page);

    await page.keyboard.down('ArrowRight');
    await page.keyboard.press('Space');
    await page.waitForTimeout(400);
    await page.keyboard.press('Space');
    await page.keyboard.up('ArrowRight');

    // The second press falls inside the cooldown and must simply be ignored.
    await expect(page.locator('#hud-score')).toBeVisible();
    await expect(page.locator('#menu-overlay')).toBeHidden();
  });

  test('claims the space bar while a round is running', async ({ page }) => {
    // The start button keeps DOM focus after being clicked. If the round did not
    // claim the space bar, this press would re-activate that button.
    await openStartMenu(page);
    await startRound(page);

    await page.keyboard.press('Space');

    await expect(page.locator('#menu-overlay')).toBeHidden();
  });

  test('leaves the space bar to the menu outside a round', async ({ page }) => {
    // The other half of the same decision, and the reason the dash key is latched
    // rather than read as held state: the menu has to stay keyboard-operable.
    await openStartMenu(page);

    await page.locator('#btn-start').focus();
    await page.keyboard.press('Space');

    await expect(page.locator('#menu-overlay')).toBeHidden();
    await expect(page.locator('#hud-score')).toBeVisible();
  });

  test('opens the developer submenu from the keyboard', async ({ page }) => {
    // The menu rows are real buttons, so Enter and Space work without custom state.
    // InputManager must not intercept either while the menu is up.
    await openStartMenu(page);

    await page.locator('#btn-developer').focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('#menu-overlay')).toContainText(STRINGS.settings.frameTimeGraph);
  });

  test('walks the menu list with the arrow keys', async ({ page }) => {
    // The footer of the deck promises that the arrows navigate, so this asserts the
    // promise: the first row has the focus when the menu opens, down moves one row on,
    // and up from the first row wraps to the last.
    await openStartMenu(page);
    const focusedId = () => page.evaluate(() => document.activeElement?.id);

    expect(await focusedId()).toBe('btn-start');

    await page.keyboard.press('ArrowDown');
    expect(await focusedId()).toBe('btn-settings');

    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    expect(await focusedId()).toBe('btn-developer');
  });

  test('leaves a submenu with Escape', async ({ page }) => {
    await openStartMenu(page);
    await page.locator('#btn-settings').click();
    await expect(page.locator('#btn-menu-back')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.locator('#btn-menu-back')).toHaveCount(0);
    await expect(page.locator('#btn-start')).toBeVisible();
  });
});
