import { expect, test } from '@playwright/test';
import { STRINGS, openStartMenu, startRound } from './support/game.js';

/**
 * Covers `ui/menu.js` and `ui/optionGroup.js`, the two modules the Node-only unit
 * suite cannot reach at all: both exist to mutate the DOM, so there is nothing left
 * to test once the DOM is taken away.
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
    const options = page.locator('#fps-options .menu-option');
    const thirtyFps = options.filter({ hasText: /^30$/ });

    await thirtyFps.click();

    await expect(thirtyFps).toHaveAttribute('aria-pressed', 'true');
    // Exactly one, so choosing an option really deselects the previous one instead
    // of leaving two options announced as pressed.
    await expect(page.locator('#fps-options [aria-pressed="true"]')).toHaveCount(1);
    await expect(options.filter({ hasText: /^60$/ })).toHaveAttribute('aria-pressed', 'false');
  });

  test('keeps the developer settings collapsed until asked', async ({ page }) => {
    await openStartMenu(page);
    const details = page.locator('#menu-overlay details');

    await expect(details).not.toHaveAttribute('open', '');
    await expect(details.locator('summary')).toHaveText(STRINGS.settings.developerSettings);
  });

  test('turns the frametime graph on and draws it in the round', async ({ page }) => {
    await openStartMenu(page);
    await page.locator('#menu-overlay summary').click();
    await page
      .locator('#frame-graph-options .menu-option')
      .filter({ hasText: STRINGS.settings.on })
      .click();

    await startRound(page);

    await expect(page.locator('#frame-time-graph')).toBeVisible();
  });

  test('leaves the frametime graph hidden by default', async ({ page }) => {
    await openStartMenu(page);

    await startRound(page);

    await expect(page.locator('#frame-time-graph')).toBeHidden();
  });
});
