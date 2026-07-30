import { expect, test } from '@playwright/test';
import { openStartMenu, startRound, watchForBrowserProblems } from './support/game.js';

/**
 * The world is a fixed size scaled into the window, so a window that is not 16:9 has space
 * left over. These are the parts of that arrangement Vitest structurally cannot reach: the
 * real canvas, a real device pixel ratio, and a real resize event.
 *
 * A deliberately non-16:9 viewport, because the suite's default 1280x720 matches the
 * world's own aspect ratio exactly — the margins are zero pixels wide there and a letterbox
 * test against it would assert nothing at all.
 */
test.use({ viewport: { width: 1400, height: 720 } });

/** Reads one canvas pixel as `[r, g, b]`, in device-pixel coordinates. */
function readPixel(page, x, y) {
  return page.evaluate(
    ({ pixelX, pixelY }) => {
      const canvas = document.getElementById('game-canvas');
      const { data } = canvas.getContext('2d').getImageData(pixelX, pixelY, 1, 1);

      return [data[0], data[1], data[2]];
    },
    { pixelX: x, pixelY: y },
  );
}

test.describe('the fixed world inside a wider window', () => {
  test('separates the area outside the world from the arena floor', async ({ page }) => {
    // The claim being tested is "the world edge is visible", and the way to phrase it so
    // it cannot go stale is that the two areas differ — not that either one is a
    // particular hex value. It matters because `body` carries the *same* colour as the
    // arena floor, so a margin left transparent would make the boundary invisible again.
    await openStartMenu(page);
    await startRound(page);

    const canvasSize = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');

      return { width: canvas.width, height: canvas.height };
    });

    const insideMargin = await readPixel(page, 2, Math.floor(canvasSize.height / 2));
    // A quarter of the way across is comfortably inside the world at this viewport, and
    // far enough from the centre that the player is not standing on it.
    const insideWorld = await readPixel(
      page,
      Math.floor(canvasSize.width / 2),
      Math.floor(canvasSize.height / 4),
    );

    expect(insideMargin).not.toEqual(insideWorld);
  });

  test('keeps the round intact across a resize', async ({ page }) => {
    // The regression guard for the new handleResize(): a resize may only rescale the
    // picture. If anything reached the engine or the player again, the world would change
    // size mid-round and obstacles would be dropped underneath the player.
    const problems = watchForBrowserProblems(page);
    await openStartMenu(page);
    await startRound(page);

    await page.setViewportSize({ width: 760, height: 1100 });
    await page.waitForTimeout(500);
    await page.setViewportSize({ width: 1400, height: 720 });
    await page.waitForTimeout(500);

    expect(problems).toEqual([]);
    await expect(page.locator('#hud-score')).toBeVisible();
  });

  test('plays in a window smaller than the world', async ({ page }) => {
    // At 1000x600 the render scale drops to ~0.52 and every world unit is drawn at about
    // half a pixel. Nothing is clipped — the whole world stays on screen, which is the
    // point of fitting it rather than filling the window with it.
    const problems = watchForBrowserProblems(page);
    await page.setViewportSize({ width: 1000, height: 600 });
    await openStartMenu(page);
    await startRound(page);
    await page.waitForTimeout(1000);

    expect(problems).toEqual([]);
    await expect(page.locator('#hud-score')).toBeVisible();
  });
});
