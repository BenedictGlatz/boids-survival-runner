import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests for the paths that only exist in a real browser.
 *
 * These run against the **production build** served by `vite preview`, not against
 * the dev server. The reason is not thoroughness for its own sake: the dev server
 * serves the whole project directory, so it hides anything the build forgets to
 * copy. That is not hypothetical — it is how the missing locale file in `dist/`
 * went unnoticed through months of development while every unit test stayed green.
 *
 * Everything the Node-only Vitest suite cannot reach lives here: that the WASM
 * module loads at all, the menu, the HUD, keyboard input, and the round lifecycle.
 */
const PREVIEW_PORT = 4173;
const BASE_URL = `http://localhost:${PREVIEW_PORT}`;

export default defineConfig({
  // `e2e/**/*.spec.js` is deliberately disjoint from Vitest's `src/**/*.test.js`,
  // so neither runner ever collects the other one's files.
  testDir: 'e2e',
  testMatch: '**/*.spec.js',

  // The game is a canvas application: a flow needs real seconds of simulation
  // before there is anything to assert on.
  timeout: 90_000,
  expect: { timeout: 15_000 },

  // One worker. Several browsers each running a 60-steps-per-second O(n²) flock on
  // the same machine would starve each other and make timing assertions flaky for
  // reasons that have nothing to do with the code under test.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),

  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],

  use: {
    baseURL: BASE_URL,
    // A fixed viewport is still a correctness requirement, though no longer for the
    // reason it once was. The world is a fixed size and no longer derived from the
    // window, so the simulation does not depend on this at all any more — but the
    // viewport does set the render scale (0.667 here, since the world is 1920x1080),
    // and obstacles.spec.js counts the pixels of a drawn obstacle. A varying viewport
    // would vary that count. letterbox.spec.js overrides it on purpose, because at
    // exactly 16:9 there are no margins for it to look at.
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  // Chromium only. The engine is WebAssembly behind a canvas, so cross-browser
  // breadth would mostly re-test the browsers' own WASM and canvas implementations
  // rather than this project's code. See documentation/report/08-qualitaet.md §8.2.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    command: `npm run build && npm run preview -- --port ${PREVIEW_PORT} --strictPort`,
    url: BASE_URL,
    // Generous, because `build` runs wasm-pack first and a cold Rust build is slow.
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
  },
});
