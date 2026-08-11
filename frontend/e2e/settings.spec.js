import { expect, test } from '@playwright/test';
import { STRINGS, openStartMenu, startRound } from './support/game.js';

/**
 * Covers `ui/menu.js`, `ui/menuDeck.js`, `ui/menuPanels.js`, `ui/menuNavigation.js` and
 * `ui/optionGroup.js` — the modules the Node-only unit suite cannot reach at all: they
 * exist to mutate the DOM, so there is nothing left to test once the DOM is taken away.
 */
/** The framerate setting lives behind the Game Settings row, not on the start screen. */
async function openGameSettings(page) {
  await openStartMenu(page);
  await page.locator('#btn-settings').click();
}

test.describe('start-menu settings', () => {
  test('renders every option group with its label and hint', async ({ page }) => {
    await openGameSettings(page);

    await expect(page.locator('#fps-options')).toBeVisible();
    await expect(page.locator('#menu-overlay')).toContainText(STRINGS.settings.fpsHint);
  });

  test('names the measured refresh rate in the hint', async ({ page }) => {
    // Whichever rate the runner's display reports, the hint has to state it — that is
    // what explains a missing option instead of leaving it looking like a bug.
    await openGameSettings(page);

    await expect(page.locator('#menu-overlay')).toContainText(STRINGS.settings.hertz);
  });

  test('preselects the fastest offered framerate', async ({ page }) => {
    // Deliberately display-independent: which options exist depends on the machine,
    // but the last of them is always the one that starts out chosen.
    await openGameSettings(page);

    await expect(page.locator('#fps-options button').last()).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('marks the chosen framerate as pressed and unmarks the previous one', async ({ page }) => {
    // The selection state lives in `aria-pressed`, not only in a CSS class, because
    // the options are toggle buttons rather than radio inputs. That is what makes
    // the group announce correctly, so it is worth asserting on the attribute.
    await openGameSettings(page);
    // 30 is the one option every display can show, so it is always on the list.
    const options = page.locator('#fps-options button');
    const thirtyFps = options.filter({ hasText: /^30$/ });

    await thirtyFps.click();

    await expect(thirtyFps).toHaveAttribute('aria-pressed', 'true');
    // Exactly one, so choosing an option really deselects the previous one instead
    // of leaving two options announced as pressed.
    await expect(page.locator('#fps-options [aria-pressed="true"]')).toHaveCount(1);
  });

  test('keeps the diagnostic settings out of the start screen', async ({ page }) => {
    // They live behind the fourth menu row, so the start screen opens on the one
    // setting that affects play instead of on a wall of options.
    await openStartMenu(page);

    await expect(page.locator('#menu-overlay')).not.toContainText(STRINGS.settings.frameTimeGraph);
    await expect(page.locator('#btn-developer')).toContainText(STRINGS.settings.developerSettings);
  });

  test('keeps the framerate setting out of the start screen', async ({ page }) => {
    // It used to sit in the right-hand stack as well, which offered the same setting
    // twice. It now has exactly one home, behind the row that names it.
    await openStartMenu(page);

    await expect(page.locator('#fps-options')).toHaveCount(0);

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

    // The load row's contents live inside the canvas and cannot be read from here, but the
    // room it needs can: the panel is one text row taller than the two-row version, and the
    // backing store follows the device pixel ratio. Shrinking the panel back without dropping
    // the row would draw it over the plot, which no other assertion would catch.
    const panel = await page.evaluate(() => {
      const graph = document.getElementById('frame-time-graph');

      return { cssHeight: graph.style.height, backingHeight: graph.height };
    });

    expect(panel.cssHeight).toBe('109px');
    expect(panel.backingHeight).toBeGreaterThanOrEqual(109);
  });

  test('keeps the invulnerability switch off and behind the developer row', async ({ page }) => {
    // A round nobody can lose is a measuring instrument, so it must not be reachable
    // by accident: it exists only in the diagnostic submenu and starts out off.
    await openStartMenu(page);

    await expect(page.locator('#invulnerable-options')).toHaveCount(0);

    await page.locator('#btn-developer').click();

    const options = page.locator('#invulnerable-options button');

    await expect(options.filter({ hasText: STRINGS.settings.off })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('remembers the invulnerability choice across leaving the submenu', async ({ page }) => {
    // The submenu markup is rebuilt from the settings object on every render, so a
    // choice that is not written through would silently fall back to off on re-entry.
    await openStartMenu(page);
    await page.locator('#btn-developer').click();
    await page
      .locator('#invulnerable-options button')
      .filter({ hasText: STRINGS.settings.on })
      .click();

    await page.keyboard.press('Escape');
    await page.locator('#btn-developer').click();

    await expect(
      page.locator('#invulnerable-options button').filter({ hasText: STRINGS.settings.on }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('leaves the frametime graph hidden by default', async ({ page }) => {
    await openStartMenu(page);

    await startRound(page);

    await expect(page.locator('#frame-time-graph')).toBeHidden();
  });
});
