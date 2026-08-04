import { expect, test } from '@playwright/test';
import { COUNTDOWN_MS, STRINGS, hudNumber, openStartMenu, startRound } from './support/game.js';

const INITIAL_BOID_COUNT = 24;

test.describe('starting a round', () => {
  test('swaps the menu for the HUD', async ({ page }) => {
    await openStartMenu(page);

    await page.locator('#btn-start').click();

    await expect(page.locator('#menu-overlay')).toBeHidden();
    await expect(page.locator('#hud-score')).toBeVisible();
    await expect(page.locator('#hud-timer')).toBeVisible();
  });

  test('holds the world still until the countdown is over', async ({ page }) => {
    // The engine advances on a fixed timestep and the countdown deliberately
    // discards simulation debt, so the clock must still read zero when it ends.
    // A visible jump here would mean the frozen span was replayed as a burst.
    await openStartMenu(page);
    await page.locator('#btn-start').click();

    await expect(page.locator('#hud-timer')).toContainText('00:00');
    await page.waitForTimeout(COUNTDOWN_MS - 500);
    await expect(page.locator('#hud-timer')).toContainText('00:00');
  });

  test('runs the clock and the score once the countdown ends', async ({ page }) => {
    await openStartMenu(page);
    await startRound(page);

    const scoreAfterStart = await hudNumber(page, '#hud-score');
    await page.waitForTimeout(2500);
    const scoreLater = await hudNumber(page, '#hud-score');

    expect(scoreLater).toBeGreaterThan(scoreAfterStart);
    await expect(page.locator('#hud-timer')).not.toContainText('00:00');
  });

  test('opens with the first wave and its full flock', async ({ page }) => {
    await openStartMenu(page);
    await startRound(page);

    // Label and value are separate elements, so the wave is asserted on the value
    // alone — two digits, because a HUD number that changes width shifts the layout.
    await expect(page.locator('#hud-wave .hud-stat__value')).toHaveText('01');
    expect(await hudNumber(page, '#hud-boids')).toBe(INITIAL_BOID_COUNT);
  });

  test('shows the boid variant the first wave spawns', async ({ page }) => {
    await openStartMenu(page);
    await startRound(page);

    // The level counts from one where the engine's tier counts from zero, so the baseline
    // flock reads as 01. Its colour is the one the canvas draws that variant in — asserted
    // here because it is the actual announcement of an escalation, not decoration.
    await expect(page.locator('#hud-spawn-tier .hud-stat__value')).toHaveText('01');
    await expect(page.locator('#hud-spawn-tier .hud-stat__value')).toHaveCSS(
      'color',
      'rgb(240, 58, 95)',
    );
  });

  test('labels every HUD value from the locale file', async ({ page }) => {
    await openStartMenu(page);
    await startRound(page);

    await expect(page.locator('#hud-timer')).toContainText(STRINGS.hud.timer);
    await expect(page.locator('#hud-wave')).toContainText(STRINGS.hud.wave);
    await expect(page.locator('#hud-spawn-tier')).toContainText(STRINGS.hud.spawning);
    await expect(page.locator('#hud-score')).toContainText(STRINGS.hud.score);
    await expect(page.locator('#hud-boids')).toContainText(STRINGS.hud.boids);
  });
});
