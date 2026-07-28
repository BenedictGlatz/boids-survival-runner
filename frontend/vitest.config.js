import { defineConfig } from 'vitest/config';

/**
 * Test setup for the frontend modules.
 *
 * Only the pure logic modules are covered: everything that touches the DOM,
 * the canvas or the WebAssembly engine is deliberately left out, so the suite
 * needs neither a browser nor a built engine package and runs in plain Node.
 * Simulation math itself is tested on the Rust side (`cargo test`).
 */
export default defineConfig({
  test: {
    environment: 'node',
    // Tests live next to the module they cover, the same way the Rust code
    // keeps its `#[cfg(test)]` modules beside the functions they exercise.
    include: ['src/**/*.test.js'],
  },
});
