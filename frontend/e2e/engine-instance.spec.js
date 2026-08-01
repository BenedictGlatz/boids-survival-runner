import { expect, test } from '@playwright/test';
import { COUNTDOWN_MS, hudNumber, watchForBrowserProblems } from './support/game.js';

/**
 * The engine module must be instantiated exactly once per session.
 *
 * This is a memory-safety guard, not a tidiness one. A second WebAssembly instance
 * brings its own linear memory, and nothing downstream knows which of the two a
 * pointer belongs to: `wasm-bindgen`'s wrappers keep raw addresses, and the
 * `FinalizationRegistry` that frees them calls into whichever instance was
 * installed last. The frees then land inside the surviving heap, and the game
 * carries on for a while before dying somewhere unrelated — a bare `RuntimeError`
 * out of `tick()`, minutes into a round, with nothing in the stack pointing back here.
 *
 * The two rapid activations below are how that happened in play: `startGame()`
 * awaits the module load, and until that await returns the card is still on screen
 * with its button still focused.
 */

/** Counts every real instantiation of a WebAssembly module in the page. */
async function countWasmInstantiations(page) {
  await page.addInitScript(() => {
    window.__wasmInstantiations = 0;

    const streaming = WebAssembly.instantiateStreaming;
    if (streaming) {
      WebAssembly.instantiateStreaming = function (...args) {
        window.__wasmInstantiations += 1;
        return streaming.apply(WebAssembly, args);
      };
    }

    const instantiate = WebAssembly.instantiate;
    WebAssembly.instantiate = function (...args) {
      window.__wasmInstantiations += 1;
      return instantiate.apply(WebAssembly, args);
    };
  });
}

test.describe('the engine module across a session', () => {
  test('is instantiated once even when the start button is activated twice', async ({ page }) => {
    await countWasmInstantiations(page);
    const problems = watchForBrowserProblems(page);

    await page.goto('/');
    await page.locator('#btn-start').waitFor({ state: 'visible' });

    // Both activations in one task, which is what a held space bar or a double click
    // produces: the second lands while the first is still waiting for the module.
    await page.evaluate(() => {
      const start = document.getElementById('btn-start');
      start.click();
      start.click();
    });

    await page.locator('#hud-score').waitFor({ state: 'visible' });
    await page.waitForTimeout(COUNTDOWN_MS + 1500);

    expect(await page.evaluate(() => window.__wasmInstantiations)).toBe(1);
    expect(problems).toEqual([]);

    // And the round that came out of it is a working one rather than a wedged shell.
    const score = await hudNumber(page, '#hud-score');
    await page.waitForTimeout(2000);
    expect(await hudNumber(page, '#hud-score')).toBeGreaterThan(score);
  });

  test('is instantiated once across a restart from the pause card', async ({ page }) => {
    // The restart buttons run the same start path, so they can double-activate too.
    await countWasmInstantiations(page);

    await page.goto('/');
    await page.locator('#btn-start').waitFor({ state: 'visible' });
    await page.locator('#btn-start').click();
    await page.locator('#hud-score').waitFor({ state: 'visible' });
    await page.waitForTimeout(COUNTDOWN_MS + 500);

    // Straight into a second round from the pause card, without a reload.
    await page.keyboard.press('Escape');
    await page.locator('#btn-pause-restart').waitFor({ state: 'visible' });
    await page.evaluate(() => {
      const restart = document.getElementById('btn-pause-restart');
      restart.click();
      restart.click();
    });

    await page.locator('#hud-score').waitFor({ state: 'visible' });
    await page.waitForTimeout(COUNTDOWN_MS + 500);

    expect(await page.evaluate(() => window.__wasmInstantiations)).toBe(1);
  });
});
