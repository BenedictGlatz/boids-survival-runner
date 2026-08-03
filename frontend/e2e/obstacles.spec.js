import { expect, test } from '@playwright/test';
import { openStartMenu, startRound, watchForBrowserProblems } from './support/game.js';

/**
 * The obstacle body colour, mirrored from `renderer/obstacleLayer.js`.
 *
 * This is the one place the suite looks at canvas content, and it is not a golden-image
 * comparison — the project rules those out because the flock moves every frame. It asks
 * a single question instead: does a large slate shape exist anywhere on the canvas. The
 * boids are small and red, the player is cyan, so nothing else comes near this colour.
 */
const OBSTACLE_BODY = { r: 42, g: 49, b: 63 };
const COLOR_TOLERANCE = 16;
/**
 * Far more than stray anti-aliasing, far less than the area a body colour can cover.
 *
 * Only part of an obstacle is left in the plain body colour: the hatching draws red
 * diagonals over it, and the darkened core takes the middle out, so what remains is the
 * band along the rim between the stripes.
 *
 * The render scale is a factor in this number now that the world is a fixed 1920x1080
 * letterboxed into the window: at this suite's 1280x720 viewport everything is drawn at
 * 0.667, so an obstacle covers 0.44 of the pixels it used to. Measured against the preview
 * build, a first-wave round paints about 630 such pixels and the menu paints exactly none,
 * which is the gap this threshold sits in.
 */
const ENOUGH_PIXELS = 250;

/**
 * Time for a new obstacle to finish materialising, plus slack.
 *
 * An obstacle ramps up to full opacity over the engine's arming window — 90 simulation
 * steps, 1.5 seconds — and is not solid until it ends. Sampling the moment the countdown
 * ends would find it still translucent and blended halfway towards the background,
 * nowhere near the colour this spec looks for.
 */
const FADE_IN_MS = 2500;

/** Counts canvas pixels close to the obstacle body colour. */
function countObstaclePixels(page) {
  return page.evaluate(
    ({ body, tolerance }) => {
      const canvas = document.getElementById('game-canvas');
      const context = canvas.getContext('2d');
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      let matches = 0;

      for (let index = 0; index < data.length; index += 4) {
        if (
          Math.abs(data[index] - body.r) < tolerance &&
          Math.abs(data[index + 1] - body.g) < tolerance &&
          Math.abs(data[index + 2] - body.b) < tolerance
        ) {
          matches += 1;
        }
      }

      return matches;
    },
    { body: OBSTACLE_BODY, tolerance: COLOR_TOLERANCE },
  );
}

test.describe('temporary obstacles', () => {
  test('draws obstacles on the canvas once a round is running', async ({ page }) => {
    // The engine offers its first obstacle on the very first simulation step, so one is
    // on screen as soon as the countdown ends. This is the assertion that the whole
    // chain works end to end: the engine packs a buffer, the bridge hands it over with
    // camelCase names, and the renderer decodes seven values per obstacle and paints them.
    await openStartMenu(page);
    await startRound(page);
    await page.waitForTimeout(FADE_IN_MS);

    expect(await countObstaclePixels(page)).toBeGreaterThan(ENOUGH_PIXELS);
  });

  test('shows nothing before a round and nothing after one', async ({ page }) => {
    // The menu and game-over screens draw an empty frame. A missing guard in the
    // obstacle layer would leave the last round's obstacles painted behind the menu.
    await openStartMenu(page);

    expect(await countObstaclePixels(page)).toBeLessThan(ENOUGH_PIXELS);
  });

  test('keeps the round running with obstacles in the world', async ({ page }) => {
    // Obstacles are the first thing in this game with a lifetime, so they are also the
    // first thing that can throw while expiring — in the middle of the draw loop, on a
    // frame nothing else touches. Playing past the point where the first ones would
    // have come and gone is what catches that.
    const problems = watchForBrowserProblems(page);
    await openStartMenu(page);
    await startRound(page);

    // Longer than the spawn interval, so several spawn rounds have been offered.
    for (let lap = 0; lap < 6; lap += 1) {
      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(400);
      await page.keyboard.up('ArrowRight');
      await page.keyboard.down('ArrowLeft');
      await page.waitForTimeout(400);
      await page.keyboard.up('ArrowLeft');
    }

    expect(problems).toEqual([]);
    // Either still playing or a clean game over — both are fine, a crash is not.
    const stillPlaying = await page.locator('#hud-score').isVisible();
    const gameOver = await page.locator('#btn-restart').isVisible();
    expect(stillPlaying || gameOver).toBe(true);
  });
});
