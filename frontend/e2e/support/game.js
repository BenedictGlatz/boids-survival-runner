import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Expected user-facing strings are read from the locale file rather than written
 * into the specs. Two reasons: the project forbids hard-coded user-facing strings,
 * and an assertion against the locale fails when a key disappears — which is the
 * failure mode that shipped a build rendering "menu.play" instead of "Play".
 */
export const STRINGS = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../public/locales/en.json', import.meta.url)), 'utf8'),
);

/** The start countdown before the simulation runs, plus slack for the first frames. */
export const COUNTDOWN_MS = 3000;

/**
 * Opens the game and waits until the start menu is interactive, which only happens
 * after the WASM module has loaded and the first snapshot has been drawn.
 */
export async function openStartMenu(page) {
  await page.goto('/');
  await page.locator('#btn-start').waitFor({ state: 'visible' });
}

/** Starts a round and waits out the countdown, so the simulation is running. */
export async function startRound(page) {
  await page.locator('#btn-start').click();
  await page.locator('#hud-score').waitFor({ state: 'visible' });
  await page.waitForTimeout(COUNTDOWN_MS + 500);
}

/** Reads an integer out of a HUD panel, e.g. "Score: 12" -> 12. */
export async function hudNumber(page, panelId) {
  const text = await page.locator(panelId).textContent();
  const digits = text.replace(/[^0-9]/g, '');

  return Number(digits);
}

/**
 * Collects console errors and failed requests for the lifetime of a test.
 *
 * The missing locale file produced exactly this signature — a 404 and nothing else
 * visible — so a boot test that only checked for a canvas would have passed.
 */
export function watchForBrowserProblems(page) {
  const problems = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      problems.push(`console: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => problems.push(`requestfailed: ${request.url()}`));
  page.on('response', (response) => {
    if (response.status() >= 400) {
      problems.push(`http ${response.status()}: ${response.url()}`);
    }
  });

  return problems;
}

/** Holds a key down for a while, the way a player actually moves. */
export async function holdKey(page, key, durationMs) {
  await page.keyboard.down(key);
  await page.waitForTimeout(durationMs);
  await page.keyboard.up(key);
}
