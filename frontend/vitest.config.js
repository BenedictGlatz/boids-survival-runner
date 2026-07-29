import { defineConfig } from 'vitest/config';

/**
 * Test setup for the frontend modules.
 *
 * Only the pure logic modules are covered: everything that touches the DOM,
 * the canvas or the WebAssembly engine is deliberately left out, so the suite
 * needs neither a browser nor a built engine package and runs in plain Node.
 * Simulation math itself is tested on the Rust side (`cargo test`).
 *
 * The coverage report counts those excluded modules anyway. The low number that
 * results is the honest one: it shows how much of the frontend this suite cannot
 * reach, and that part is covered by the Playwright suite in `e2e/` instead.
 */
export default defineConfig({
  test: {
    environment: 'node',
    // Tests live next to the module they cover, the same way the Rust code
    // keeps its `#[cfg(test)]` modules beside the functions they exercise.
    // Deliberately disjoint from Playwright's `e2e/**/*.spec.js`, so neither
    // runner ever picks up the other one's files.
    include: ['src/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      // `text` for the console (and later the CI log), `html` to look at and to
      // screenshot for the report, `json-summary` so the report's coverage table
      // can be generated from a file instead of typed off the screen.
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.js'],
      // `all` makes untested modules count. Without it the percentage would only
      // describe the files that happen to have a test, which flatters the number
      // by exactly the gap it is supposed to expose.
      all: true,
      exclude: [
        // Generated wasm-bindgen glue — not our code.
        'src/wasm/**',
        // The tests themselves.
        '**/*.test.js',
        // Constants only: nothing executable to cover, so counting its lines
        // would move the percentage without saying anything about testing.
        'src/gameConfig.js',
      ],
      // No thresholds here on purpose. A floor is only worth enforcing once it
      // sits at a level the suite actually reaches; setting an aspirational one
      // now would make every CI run red without telling anybody anything new.
    },
  },
});
