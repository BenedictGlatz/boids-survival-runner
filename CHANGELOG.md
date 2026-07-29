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
- Optional frametime graph, switchable in the start menu and drawn in the top-left corner. Each bar is one rendered frame, stacking simulation time (including the WebAssembly boundary) below draw time, with the current frame total, the window's peak, and a dashed line marking the frame budget. The vertical axis follows the selected target framerate, and frames past the top of the scale are capped in red. It measures script work only, not GPU time.

- Start-menu option for the frametime graph's curves: "separate" keeps simulation and draw time as two curves, "combined" plots a single curve for the whole frame.
- A collapsed "Developer Settings" section in the start menu, holding the frametime-graph options.
- A player dash on the space bar. It fires in the direction currently held on the movement keys and
  gives the player a short burst of about three times their top speed, which then bleeds off as if
  slowed by friction — enough to cover roughly 180 pixels and slip out of a closing swarm. Pressing
  the space bar without a direction held does nothing and does not spend the cooldown, and a dash into
  the edge of the world stops there. A bar at the bottom centre of the screen shows the 1.4 second
  cooldown: it empties on use and refills from the left, cyan again once the dash is ready. The space
  bar is only claimed while a round is running, so it keeps activating the menu buttons everywhere
  else.
- A visible warning before a boid dashes: the boid pulses in both size and brightness, and the pulse
  speeds up and grows stronger the closer the lunge gets, so the swarm reads as "that one, in a
  moment" rather than as a sudden hit out of nowhere. A boid stays slightly enlarged and bright for
  the duration of its lunge.
- Boids from wave three onward can dash at the player. A dash runs in four phases: the boid first
  charges up for about three quarters of a second, then lunges at the position the player stood in
  at the moment of the launch, then flocks normally again, and finally waits out a cooldown before it
  may dash again. Cohesion and alignment are switched off for the duration of the lunge, so a dashing
  boid visibly breaks out of the swarm and is pulled back in by cohesion afterwards; separation stays
  on, so it curves around anything in its path instead of ploughing through it. Only a handful of
  boids may charge or dash at the same time, and the flock hands out a new dash slot only every 40
  simulation steps, so the swarm never turns into a wall of lunges. Later waves warn for a shorter
  time, dash faster and further, and recover quicker.

- Scaffold for the university project and architecture report under `documentation/report/`: one
  Markdown file per required chapter, each pre-filled with the headings the assignment asks for, the
  sources it is to be composed from, and what still blocks it. `00-index.md` tracks per-chapter status
  and holds the assembly recipe.
- `documentation/report/projekt-journal.md`, an append-only record of the facts that cannot be
  reconstructed later: hours actually spent per session, technical decisions with their rejected
  alternatives, and challenges. It is now a mandatory per-change step, so the report grows alongside
  the code instead of being written at the end.
- Prompt logs under `ai/` now carry a `topic` and a `use` field, classifying each prompt by subject
  area and by what became of the answer. All existing entries were classified.
- `npm run docs:ki-verzeichnis` generates the report's AI index from `ai/*.json`, grouped by subject
  area with the model mix.
- `npm run docs:check` reports, without failing, whether today's prompt log, journal entry and
  changelog edit are in place, and flags source files past the 400-line limit.
- Plan hours for the tooling and documentation measures the assignment requires (`T-01`…`T-06`,
  `D-01`) in `docs/specs-overview.md`, together with the resulting over-budget total and the
  deliberate cut that pays for it.
- Coverage reporting on both sides of the language boundary, reported separately rather than blended:
  `npm run test:coverage` in `frontend/` (`@vitest/coverage-v8`, text plus HTML plus a JSON summary)
  and `cargo llvm-cov --lib` in `engine/`. Untested frontend modules count against the percentage,
  and the two largest DOM modules are deliberately not excluded, so the number states how much of the
  frontend this Node-only suite cannot reach instead of hiding it.
- Unit tests for four frontend modules that had none: the fixed-timestep `FrameScheduler` (step
  accounting, leftover time carried between frames, the catch-up cap, and the clock reset that keeps a
  frozen countdown from becoming a burst), the `GameState` machine, `buildControls` (including that one
  space-bar press reaches exactly one simulation step of a multi-step frame), and the whole
  `PlayerController` (acceleration, braking to a complete stop, the dash and its decay, the wall clamp,
  and the delta-time cap that stops a backgrounded tab from teleporting the player).
- WASM boundary tests in `engine/tests/wasm_tests.rs`, which was previously an empty stub. They cover
  the four-buffer frame contract that plain `cargo test` cannot reach at all, because the buffer
  getters return `js_sys` typed arrays and need a JavaScript runtime: index alignment across all four
  buffers, `snapshot` not advancing the world, the wave spawner's safe distance from the player, the
  window-resize wrap, and the sign convention of the dash phase. Run with `wasm-pack test`.

### Changed

- The frametime graph's vertical axis now follows the selected target framerate instead of the measured load. The dashed line always marks the frame budget of that framerate (16.67 ms at 60 FPS) and sits halfway up the plot, so the free half above it shows by how much a frame missed its budget. The axis therefore holds still for a whole round: the same curve height always means the same cost.
- The frametime graph now draws continuous curves instead of stacked bars, in the style of an external frametime monitor: a thin line over a tinted area, scrolling in from the left while the history fills up.
- The frametime graph's numbers are now averages over the visible window rather than the newest frame alone. Browsers deliberately round `performance.now()` (Firefox to a whole millisecond), so a single frame's cost can only ever be reported as an integer; averaging the window restores the decimal place. The peaks stay raw so spikes remain visible.
- The engine now stores movement and perception tuning as per-boid properties with named defaults, so different boid variants can coexist in the same flock.
- The Copilot instructions now explicitly require heterogeneous boid support instead of assuming one global parameter set for every boid.
- Frontend Vite scripts now build the Rust/WASM package into an ignored frontend import folder before dev/build runs.
- The game loop now runs on a fixed timestep: the simulation always advances 60 logical steps per second and only rendering follows the chosen framerate, so difficulty and player speed no longer depend on the display refresh rate.
- Start-menu settings are now built from a shared option-group module, so every setting renders and behaves identically instead of repeating the markup and selection logic per option.

### Fixed

- The score and in-game timer no longer advance while the browser tab is in the background, which previously handed out score for time in which no boid moved.
