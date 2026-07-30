import { expect, test } from '@playwright/test';
import { STRINGS, openStartMenu, watchForBrowserProblems } from './support/game.js';

test.describe('booting the built game', () => {
  test('loads the WASM engine and shows an interactive start menu', async ({ page }) => {
    const problems = watchForBrowserProblems(page);

    await openStartMenu(page);

    await expect(page.locator('#game-canvas')).toBeVisible();
    await expect(page.locator('#btn-start')).toBeEnabled();
    expect(problems).toEqual([]);
  });

  test('sizes the canvas to the window', async ({ page }) => {
    // The world no longer follows the window — it is a fixed size that the renderer
    // letterboxes *inside* this canvas. What the assertion guards now is that the canvas
    // itself still spans the whole viewport, because it is the reference surface the HUD
    // and every CSS overlay position themselves against (`position: fixed; inset: 0`).
    await openStartMenu(page);

    const canvas = await page.locator('#game-canvas').boundingBox();
    const viewport = page.viewportSize();

    expect(canvas.width).toBeGreaterThanOrEqual(viewport.width - 1);
    expect(canvas.height).toBeGreaterThanOrEqual(viewport.height - 1);
  });

  test('shows translated labels rather than raw i18n keys', async ({ page }) => {
    // The regression guard for the bug this suite found on its first run: the
    // locale file was missing from dist/, so t() returned every key unchanged.
    await openStartMenu(page);

    const menu = page.locator('#menu-overlay');
    await expect(menu).toContainText(STRINGS.menu.title);
    // Contains rather than equals: the play row also carries its index and its keycap.
    await expect(page.locator('#btn-start')).toContainText(STRINGS.menu.play);
    await expect(menu).toContainText(STRINGS.settings.targetFps);
    await expect(menu).not.toContainText('menu.');
    await expect(menu).not.toContainText('settings.');
  });

  test('serves the locale file from the production build', async ({ page }) => {
    // Asserted directly as well, so a failure names the cause instead of leaving
    // the reader to work out why a label was wrong.
    const response = await page.request.get('/locales/en.json');

    expect(response.status()).toBe(200);
    expect(await response.json()).toHaveProperty('menu.play');
  });
});
