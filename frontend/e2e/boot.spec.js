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
    // The canvas is the whole game surface and the world size is derived from the
    // window, so a canvas of the wrong size is a simulation bug, not a visual one.
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
    await expect(page.locator('#btn-start')).toHaveText(STRINGS.menu.play);
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
