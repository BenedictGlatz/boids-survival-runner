import { expect, test } from '@playwright/test';
import { STRINGS, openStartMenu, startRound } from './support/game.js';

/**
 * Covers `ui/menu.js`, `ui/menuDeck.js`, `ui/menuPanels.js`, `ui/menuNavigation.js` and
 * `ui/optionGroup.js` — the modules the Node-only unit suite cannot reach at all: they
 * exist to mutate the DOM, so there is nothing left to test once the DOM is taken away.
 */
test.describe('start-menu settings', () => {
  test('renders every option group with its label and hint', async ({ page }) => {
    await openStartMenu(page);

    await expect(page.locator('#fps-options')).toBeVisible();
    await expect(page.locator('#menu-overlay')).toContainText(STRINGS.settings.fpsHint);
  });

  test('marks the chosen framerate as pressed and unmarks the previous one', async ({ page }) => {
    // The selection state lives in `aria-pressed`, not only in a CSS class, because
    // the options are toggle buttons rather than radio inputs. That is what makes
    // the group announce correctly, so it is worth asserting on the attribute.
    await openStartMenu(page);
    const options = page.locator('#fps-options button');
    const thirtyFps = options.filter({ hasText: /^30$/ });

    await thirtyFps.click();

    await expect(thirtyFps).toHaveAttribute('aria-pressed', 'true');
    // Exactly one, so choosing an option really deselects the previous one instead
    // of leaving two options announced as pressed.
    await expect(page.locator('#fps-options [aria-pressed="true"]')).toHaveCount(1);
    await expect(options.filter({ hasText: /^60$/ })).toHaveAttribute('aria-pressed', 'false');
  });

  test('keeps the diagnostic settings out of the start screen', async ({ page }) => {
    // They live behind the fourth menu row, so the start screen opens on the one
    // setting that affects play instead of on a wall of options.
    await openStartMenu(page);

    await expect(page.locator('#menu-overlay')).not.toContainText(STRINGS.settings.frameTimeGraph);
    await expect(page.locator('#btn-developer')).toContainText(STRINGS.settings.developerSettings);
  });

  test('shows a settings group in one place at a time', async ({ page }) => {
    // A submenu takes its group out of the right-hand stack and into the left column.
    // The group is found by id, so a second copy would break its click handling.
    await openStartMenu(page);

    await page.locator('#btn-settings').click();

    await expect(page.locator('#fps-options')).toHaveCount(1);
  });

  test('turns the frametime graph on and draws it in the round', async ({ page }) => {
    await openStartMenu(page);
    await page.locator('#btn-developer').click();
    await page
      .locator('#frame-graph-options button')
      .filter({ hasText: STRINGS.settings.on })
      .click();
    // Back to the start screen, where the play row lives — the choice is kept.
    await page.keyboard.press('Escape');

    await startRound(page);

    await expect(page.locator('#frame-time-graph')).toBeVisible();
  });

  test('leaves the frametime graph hidden by default', async ({ page }) => {
    await openStartMenu(page);

    await startRound(page);

    await expect(page.locator('#frame-time-graph')).toBeHidden();
  });
});
