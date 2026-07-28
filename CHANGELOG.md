# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Initial project structure with separate `engine` (Rust/WASM) and `frontend` (JavaScript) directories.
- Skeleton modules for engine: `math`, `simulation`, `wasm_bridge`.
- Skeleton modules for frontend: `renderer`, `input`, `ui`.
- i18n locale directory with English default (`locales/en.json`).
- `.gitignore` covering Rust build artifacts, WASM `pkg/` output, and frontend `dist/` and `node_modules`.
- First playable fullscreen browser frontend with a dark grid canvas, start screen, game-over screen, and semi-transparent HUD panels for lives, score, timer, wave, and boid count.
- WASM-facing `GameEngine` bridge that spawns boids, advances the flock, reports collisions, and returns flat position buffers to JavaScript.
- Player-seeking boid steering with unit coverage for the new target-seeking rule and flock update behaviour.
- Keyboard-driven player movement with acceleration, deceleration, and maximum speed.
- Post-update boid overlap resolution so the flock stays spread out instead of collapsing into a single stacked point.
- A local segmented life bar drawn directly beneath the player character.
- Wave progression that spawns additional, harder boid variants with colour tiers.
- Three-second start countdown with initial boids spawned away from the player.
- Boids are now drawn as small arrows that point along their flight direction, so the swarm's movement is readable at a glance.
- Target framerate selector (30, 60, or 120 FPS) in the start menu; the highest option renders as fast as the display allows. The choice is kept for the rest of the session, including restarts.
- Vitest as the frontend test runner (`npm test`, `npm run test:watch` in `frontend/`), configured to
  run in Node so the suite needs neither a browser nor a built WebAssembly package. First covered
  module is the frametime graph's `FrameMetrics`: simulation-time accumulation across undrawn frames,
  ring-buffer wraparound, the peak leaving the window, `summary()` on an empty buffer, and `reset()`.
- Optional frametime graph, switchable in the start menu and drawn in the top-left corner. Each bar is one rendered frame, stacking simulation time (including the WebAssembly boundary) below draw time, with the current frame total, the window's peak, and a dashed line marking the 16.67 ms budget of a single simulation step. The vertical axis snaps to a fixed ladder of millisecond values so light and overloaded frames are both readable, and frames past the top of the scale are capped in red. It measures script work only, not GPU time.

- Start-menu option for the frametime graph's curves: "separate" keeps simulation and draw time as two curves, "combined" plots a single curve for the whole frame.
- Start-menu option for the frametime graph's vertical axis: "dynamic" keeps snapping the axis to the visible peak, while a fixed 33 ms or 100 ms top holds it still so two moments of the same round can be compared directly. Samples above a fixed axis are clamped and marked, and their real cost stays in the peak readout.
- A collapsed "Developer Settings" section in the start menu, holding the three frametime-graph options.

### Changed
- The frametime graph now draws continuous curves instead of stacked bars, in the style of an external frametime monitor: a thin line over a tinted area, scrolling in from the left while the history fills up.
- The frametime graph's numbers are now averages over the visible window rather than the newest frame alone. Browsers deliberately round `performance.now()` (Firefox to a whole millisecond), so a single frame's cost can only ever be reported as an integer; averaging the window restores the decimal place. The peaks stay raw so spikes remain visible.
- The engine now stores movement and perception tuning as per-boid properties with named defaults, so different boid variants can coexist in the same flock.
- The Copilot instructions now explicitly require heterogeneous boid support instead of assuming one global parameter set for every boid.
- Frontend Vite scripts now build the Rust/WASM package into an ignored frontend import folder before dev/build runs.
- The game loop now runs on a fixed timestep: the simulation always advances 60 logical steps per second and only rendering follows the chosen framerate, so difficulty and player speed no longer depend on the display refresh rate.
- Start-menu settings are now built from a shared option-group module, so every setting renders and behaves identically instead of repeating the markup and selection logic per option.

### Fixed
- The score and in-game timer no longer advance while the browser tab is in the background, which previously handed out score for time in which no boid moved.
