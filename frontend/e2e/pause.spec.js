import { expect, test } from '@playwright/test';
import { COUNTDOWN_MS, STRINGS, hudNumber, openStartMenu, startRound } from './support/game.js';

/**
 * Holding a running round: the freeze itself, the key that owns both directions, and the
 * three ways out of the card.
 *
 * Nothing here needs a new helper. What it does need is `input.spec.js` and
 * `settings.spec.js` to keep passing untouched — both press Escape while the start menu is
 * up, and both still mean "leave the submenu", because the pause listener ignores every
 * state that is not a running or a held round. `settings.spec.js` is the free canary for
 * that: it presses Escape and then starts a round, so a state-blind pause key would break it
 * immediately.
 */
test.describe('pausing a round', () => {
  test('freezes the world on Escape', async ({ page }) => {
    // The load-bearing assertion of the whole feature, and the one no unit test can make.
    // The technique is `round.spec.js`'s countdown freeze, but stronger: the clock is
    // already running here, so a world that keeps stepping shows up as a rising number
    // rather than as an absence of one.
    await openStartMenu(page);
    await startRound(page);
    await page.waitForTimeout(2000);

    await page.keyboard.press('Escape');

    await expect(page.locator('#btn-resume')).toBeVisible();
    await expect(page.locator('#menu-overlay')).toContainText(STRINGS.menu.paused);

    // Read after pausing, never before: a value sampled before the keypress can be a
    // simulation second stale by the time the world actually stops, and the test would flake.
    const heldScore = await hudNumber(page, '#hud-score');
    const heldTimer = await page.locator('#hud-timer .hud-stat__value').textContent();
    await page.waitForTimeout(2000);

    expect(await hudNumber(page, '#hud-score')).toBe(heldScore);
    expect(await page.locator('#hud-timer .hud-stat__value').textContent()).toBe(heldTimer);
  });

  test('resumes on Escape and lets the clock run again', async ({ page }) => {
    // Escape has to work in both directions from one listener. If it were split across the
    // pause listener and the menu's existing Escape handler, the two would see the same
    // event and either close the card as it opens or re-pause the moment it resumes — so
    // this test failing means that split came back.
    await openStartMenu(page);
    await startRound(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('#btn-resume')).toBeVisible();
    const heldScore = await hudNumber(page, '#hud-score');

    await page.keyboard.press('Escape');

    await expect(page.locator('#menu-overlay')).toBeHidden();
    await page.waitForTimeout(1500);
    expect(await hudNumber(page, '#hud-score')).toBeGreaterThan(heldScore);
  });

  test('resumes from the focused button with the space bar', async ({ page }) => {
    // Pausing hands the space bar back to the menu, so it activates the focused Resume
    // button instead of queueing a dash — the same arrangement the game-over card relies on.
    await openStartMenu(page);
    await startRound(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('#btn-resume')).toBeVisible();

    await page.keyboard.press('Space');

    await expect(page.locator('#menu-overlay')).toBeHidden();
  });

  test('ignores a repeated Escape while the key is held', async ({ page }) => {
    // A held key auto-repeats, and a toggle is not idempotent: without the `repeat` guard
    // the card would open and close at the keyboard's repeat rate. Playwright's
    // `keyboard.down` sends exactly one keydown and emulates no auto-repeat, so the natural
    // version of this test would pass without exercising anything. The event is dispatched
    // by hand instead, which is what actually reaches the guard.
    await openStartMenu(page);
    await startRound(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('#btn-resume')).toBeVisible();

    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', repeat: true }));
    });

    await expect(page.locator('#btn-resume')).toBeVisible();
  });

  test('pauses by itself when the window loses focus', async ({ page }) => {
    // The reason the feature is a fix and not only a convenience: a round left unattended
    // used to hand the loop the whole absence as simulation debt on the first frame back.
    // A real focus loss is not reachable in a headless run, so the event is dispatched —
    // which still covers the listener and the guard, just not the browser's own bookkeeping.
    await openStartMenu(page);
    await startRound(page);
    // Long enough for the score to have left zero, so "unchanged" below is a statement
    // about a clock that was running rather than one that had not started yet.
    await page.waitForTimeout(1500);

    await page.evaluate(() => window.dispatchEvent(new Event('blur')));

    await expect(page.locator('#btn-resume')).toBeVisible();
    const heldScore = await hudNumber(page, '#hud-score');
    await page.waitForTimeout(1500);
    expect(await hudNumber(page, '#hud-score')).toBe(heldScore);
  });

  test('restarts into a fresh round from the pause card', async ({ page }) => {
    // The same assertion as the game-over card's restart, without that test's minute of
    // dying first.
    await openStartMenu(page);
    await startRound(page);
    await page.keyboard.press('Escape');
    await page.locator('#btn-pause-restart').click();

    await expect(page.locator('#menu-overlay')).toBeHidden();
    await expect(page.locator('#hud-timer')).toContainText('00:00');
    await expect(page.locator('#hud-wave .hud-stat__value')).toHaveText('01');
    expect(await hudNumber(page, '#hud-score')).toBe(0);
  });

  test('takes the in-game overlays back to the menu with it', async ({ page }) => {
    // Clearing the HUD used to belong to the end of a round, which was the only route back
    // to the start screen. Leaving a paused round is a second route, and without the move
    // the deck opens with the score and the dash bar drawn over it.
    await openStartMenu(page);
    await startRound(page);
    await page.keyboard.press('Escape');

    await page.locator('#btn-pause-menu').click();

    await expect(page.locator('#btn-start')).toBeVisible();
    await expect(page.locator('#hud-score')).toBeHidden();
    await expect(page.locator('#frame-time-graph')).toBeHidden();
  });

  test('does not record a run the player walked away from', async ({ page }) => {
    // The exact inverse of `gameover.spec.js`'s "remembers the run": a fresh context has an
    // empty storage, so the panel must still read "no runs yet" after abandoning a round
    // that had a score. Read together, the two tests state what counts as a run.
    await openStartMenu(page);
    await startRound(page);
    // `startRound` returns with about half a second played, and the score is the elapsed
    // seconds floored — so it has to run a little longer before there is a run worth not
    // recording.
    await page.waitForTimeout(1500);
    expect(await hudNumber(page, '#hud-score')).toBeGreaterThan(0);
    await page.keyboard.press('Escape');

    await page.locator('#btn-pause-menu').click();

    await expect(page.locator('#menu-overlay')).toContainText(STRINGS.menu.noRuns);
  });

  test('keeps the rest of the countdown across a pause', async ({ page }) => {
    // `countdownEndsAt` is the one wall-clock deadline a round carries, so it is the one
    // value a pause can invalidate. Without parking the remainder, a pause longer than the
    // countdown makes the round start the instant it resumes — with no countdown at all.
    await openStartMenu(page);
    await page.locator('#btn-start').click();
    // Roughly a second in, so about two seconds of countdown are still owed.
    await page.waitForTimeout(1000);

    await page.keyboard.press('Escape');
    await expect(page.locator('#btn-resume')).toBeVisible();
    // Held for longer than the whole countdown, which is what would swallow it.
    await page.waitForTimeout(COUNTDOWN_MS);
    await page.keyboard.press('Escape');

    // The discriminating assertion: a second and a half after resuming, the round must
    // still not have started, because two seconds were owed. A swallowed remainder would
    // have started it the instant it resumed, and the score would already be ticking.
    await page.waitForTimeout(1500);
    expect(await hudNumber(page, '#hud-score')).toBe(0);

    // And it does start, once the rest of the countdown has really run.
    await page.waitForTimeout(COUNTDOWN_MS);
    expect(await hudNumber(page, '#hud-score')).toBeGreaterThan(0);
  });
});
