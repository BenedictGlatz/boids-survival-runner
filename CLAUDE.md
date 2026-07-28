# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All frontend commands run from `frontend/`, all Rust commands from `engine/`.

```bash
# Dev server (builds the WASM package first, then starts Vite on :5173)
cd frontend && npm install && npm run dev

# Production build (also rebuilds WASM)
cd frontend && npm run build

# Rebuild only the WASM package
cd frontend && npm run build:wasm

# Rust unit tests (all #[cfg(test)] modules inside engine/src)
cd engine && cargo test

# A single Rust test
cd engine && cargo test update_wraps_boids_at_world_edges

# WASM boundary tests in engine/tests/wasm_tests.rs (currently a stub)
cd engine && wasm-pack test --headless --firefox

# Rust lint / format
cd engine && cargo clippy && cargo fmt
```

`npm run build:wasm` is the authoritative engine build — it emits `--target web` into
`frontend/src/wasm/engine/` (gitignored). The `--target bundler` invocation in the README is
stale; do not build into `engine/pkg/`, the frontend imports from `frontend/src/wasm/engine/`.

There is no JS test runner and no JS linter configured.

## Architecture

Two independently testable layers with a deliberately narrow boundary between them.

### Engine — `engine/` (Rust → WASM)

Owns *all* simulation. Has zero knowledge of the DOM, canvas, or browser APIs.

- `math/vector.rs` — `Vec2` with pure operations (`add`, `sub`, `scale`, `limit`, `normalize`).
- `simulation/boid.rs` — `Boid` (position, velocity, acceleration, `difficulty_tier`) and
  `BoidProperties`. **Tuning values live per boid, not globally** — several variants coexist in one
  flock. `constants.rs` holds *defaults*, not invariants.
- `simulation/rules.rs` — the four steering rules as pure functions: `separation`, `alignment`,
  `cohesion`, `seek_target`. Each takes `&Boid` plus a neighbour slice and returns an unweighted force.
- `simulation/physics.rs` — `integrate`, `clamp_force`, `aabb_overlap`.
- `simulation/flock.rs` — `Flock::update()` is the per-step core: it clones the boid vector into a
  **snapshot** so every boid steers against the *previous* step's state, applies weighted rules,
  integrates, wraps at world edges, relaxes overlaps (`BOID_OVERLAP_RELAXATION_STEPS` pairwise
  passes), then counts player hits. This is O(n²) in the boid count.
- `wasm_bridge/` — the only `#[wasm_bindgen]` surface. `GameEngine` owns the flock, world bounds,
  wave state, and reusable output buffers; `create_boid_for_wave` / `properties_for_difficulty_tier`
  derive per-wave variants; `find_spawn_position` keeps new boids a safe distance from the player.

### Frontend — `frontend/src/` (ES modules, Vite)

Owns rendering, input, game state, and UI. Contains **no** simulation math.

- `index.js` — bootstrap plus the `requestAnimationFrame` loop; wires every other module together.
- `engine-bridge.js` — the single place that touches the WASM module. Converts the `snake_case`
  Rust getters into a `camelCase` frame object, so engine naming never leaks further into the frontend.
- `loop/frameScheduler.js` — pure timing arithmetic for the fixed-timestep loop.
- `loop/frameMetrics.js`, `ui/frameTimeGraph.js` — opt-in per-frame performance overlay.
- `player/playerController.js` — player integration (accelerate/decelerate/clamp).
- `renderer/renderer.js` → `renderer/canvasRenderer.js` — indirection so a WebGL backend could
  replace the canvas one without touching callers.
- `gameState.js` — `MENU` / `PLAYING` / `GAME_OVER` state machine, transitions only.
- `ui/menu.js` + `ui/optionGroup.js` — start-menu settings built from one shared option-group module.
- `gameConfig.js` — all frontend constants (no magic numbers in logic modules).

### The two load-bearing invariants

**1. Fixed timestep.** `GameEngine::tick()` advances exactly one step and does *not* scale by delta
time. The frontend therefore runs the simulation at a constant 60 steps/second
(`SIMULATION_STEP_MS`) and throttles *only rendering* to the chosen target FPS. Consequences that
break subtly if ignored:

- The player must be integrated inside the same step as the flock — its position is an input to
  `tick()` and to the engine's collision test.
- Hits must be consumed for **every** step of a multi-step frame; reading only the last frame drops hits.
- Simulation debt is clamped (`MAX_SIMULATION_STEPS_PER_FRAME`) and deliberately discarded whenever
  the world is frozen (countdown, round start, death), or a restart would open with a catch-up burst.
- Score and the in-game timer derive from `simulationTimeMs`, never from wall time.

**2. Flat buffers across the boundary.** `FrameResponse` returns `Float32Array` positions and
velocities plus a `Uint32Array` of difficulty tiers — flat, cache-friendly, index-aligned. Keep the
interface minimal and strongly typed; do not pass objects or per-entity structs across.

Note that `INITIAL_BOID_COUNT` is duplicated in `engine/src/constants.rs` and
`frontend/src/gameConfig.js` — keep the two in sync when changing it.

## Project conventions

These come from `.github/copilot-instructions.md` and apply to Claude Code equally.

### Human readability is the top priority

This project is developed by university students learning Rust and WebAssembly.

- Write as if the reader is meeting Rust for the first time. Prefer straightforward code over
  idiomatic one-liners; avoid trait wizardry, macro-heavy patterns, and dense iterator chains.
- Prefer `for` loops over iterator combinators when the body is non-trivial.
- Every non-trivial block gets a plain-language comment explaining *what* and *why*, not *how*.
- Explicit names over abbreviations (`separation_force`, not `sep_f`).
- No micro-optimisation (manual SIMD, bit tricks, `unsafe` pointer arithmetic) unless a profiler
  identified the bottleneck; any such code needs a detailed comment.
- When a simpler approach exists, take it even if marginally less efficient.

### Hard rules

- **No source file over 400 lines** (Rust, JS, or test). Split into focused modules before growing past it.
- **No hard-coded user-facing strings.** Everything goes through `ui/i18n.js` with namespaced keys
  (`menu.start`, `hud.score`); English (`frontend/locales/en.json`) is the default locale.
- **No magic numbers.** Named constants in `engine/src/constants.rs` or `frontend/src/gameConfig.js`.
- Every `#[wasm_bindgen]` export needs a doc comment. Every `unsafe` block needs a justification comment.
- Unit tests are required for all math and simulation functions; keep them as `#[cfg(test)]` modules
  beside the code they cover.
- Simulation values that can differ per boid belong on the boid / in `BoidProperties`, never as a
  new global constant.
- Hot-path Rust code minimises per-frame heap allocation. No async in the frontend hot path.
- File naming: JavaScript `camelCase.js`, Markdown `kebab-case.md`.
- Rust naming: `snake_case` functions/variables, `PascalCase` types.

### Mandatory per-change steps

1. **AI prompt logging — do not skip.** Append every user prompt to the active session file in
   `ai/` (`ai/YYYY-MM-DD-session.json`, a JSON array of `{"model": "...", "prompt": "..."}`) *before*
   replying. `ai/` is committed and must never be gitignored.
2. **Changelog.** Record user-visible changes in `CHANGELOG.md` under `[Unreleased]`
   (Keep a Changelog categories), in the same commit as the change.
3. **Commit.** Every completed change is committed immediately, atomically, using
   [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <description>`
   with `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, or `perf`.
   **Never `git push` unless explicitly asked.**
4. **Tests.** Assess whether the change warrants automated tests. Either write them in the same step
   or explicitly tell the developer which coverage is still outstanding.

### Workflow

Spec-driven development is preferred: define the expected mathematical behaviour and edge cases
before implementing. `docs/specs-overview.md` (German) tracks the feature specs and effort estimates.
The game must stay installationless and server-free for end users.
