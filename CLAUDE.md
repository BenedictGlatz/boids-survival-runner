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

# Rust coverage (needs `cargo install cargo-llvm-cov` + `rustup component add llvm-tools-preview`)
cd engine && cargo llvm-cov --lib --summary-only
cd engine && cargo llvm-cov --lib --html      # engine/target/llvm-cov/html/index.html

# A single Rust test
cd engine && cargo test update_wraps_boids_at_world_edges

# WASM boundary tests in engine/tests/ — the four-buffer contract (wasm_tests.rs) and
# the obstacle buffer plus player collision (wasm_obstacle_tests.rs).
# `cargo test` reports 0 tests for this file; only wasm-pack actually runs it.
cd engine && wasm-pack test --headless --firefox
cd engine && wasm-pack test --headless --chrome   # if Firefox is unavailable

# Rust lint / format
cd engine && cargo clippy && cargo fmt

# Frontend unit tests (Vitest, all frontend/src/**/*.test.js)
cd frontend && npm test

# Frontend tests in watch mode
cd frontend && npm run test:watch

# Frontend coverage report (text + HTML in frontend/coverage/ + json-summary)
cd frontend && npm run test:coverage

# End-to-end tests (Playwright). Builds WASM + Vite and serves `vite preview` itself.
cd frontend && npm run test:e2e
cd frontend && npx playwright test e2e/boot.spec.js   # a single flow
cd frontend && npm run test:e2e:report

# A single frontend test file
cd frontend && npx vitest run src/loop/frameMetrics.test.js

# Frontend lint (ESLint flat config in frontend/eslint.config.js)
cd frontend && npm run lint
cd frontend && npm run lint:fix

# Format check / apply (Prettier, repo-wide — JS, JSON, CSS, Markdown)
cd frontend && npm run format:check
cd frontend && npm run format
```

`npm run build:wasm` is the authoritative engine build — it emits `--target web` into
`frontend/src/wasm/engine/` (gitignored). The `--target bundler` invocation in the README is
stale; do not build into `engine/pkg/`, the frontend imports from `frontend/src/wasm/engine/`.

ESLint (flat config, `frontend/eslint.config.js`) lints the frontend and must stay at **zero errors
and zero warnings**. `eslint-plugin-jsdoc` enforces JSDoc — presence _and_ typed
`@param`/`@returns` with descriptions — on exported functions/classes and on public methods of an
exported class. Deliberately out of scope: plain exported constants (`gameConfig.js`),
underscore-prefixed private members (`_startDash`), and `*.test.js`. Both the presence rule and the
content rules share one `JSDOC_REQUIRED_CONTEXTS` list, so they never disagree about what counts as
public API. `cargo clippy` is the Rust counterpart.

Prettier owns formatting for JS, JSON, CSS and Markdown; its config lives at the repo root
(`.prettierrc.json` + `.prettierignore`) because its scope is the whole repository, while the
dependency sits in `frontend/package.json` since that is the only Node package root. The scripts
therefore need `--ignore-path ../.prettierignore` — Prettier resolves the ignore file relative to the
working directory, not to the target path. `eslint-config-prettier` is last in the ESLint config, so
formatting belongs to Prettier and semantics to ESLint with no overlapping rules. `cargo fmt` is the
Rust counterpart. Do not hand-format code that Prettier owns; run `npm run format`.

Vitest is configured in `frontend/vitest.config.js` and runs in the `node` environment, so the suite
needs neither a browser nor a built WASM package. Only import-free logic modules are testable this
way — a test that pulls in `engine-bridge.js`, the canvas renderer or any DOM module will not run.
Test files sit beside the module they cover as `<module>.test.js`, mirroring the Rust `#[cfg(test)]`
convention, and count against the same 400-line limit.

Playwright (`frontend/playwright.config.js`) covers everything Vitest structurally cannot: the WASM
module loading, the menu, the HUD, the round lifecycle, and keyboard ownership. It runs against the
**production build** — `npm run test:e2e` builds and serves `vite preview` itself — because the dev
server serves the whole project directory and therefore hides anything the build forgets to copy;
that is exactly how the missing `dist/locales/` went unnoticed. Specs live in `frontend/e2e/` as
`*.spec.js`, deliberately disjoint from Vitest's `src/**/*.test.js` so neither runner collects the
other's files. Expected user-facing strings are read from `public/locales/en.json` rather than
written into a spec, which keeps the no-hard-coded-strings rule intact and makes a missing key fail.
Three limits are deliberate and documented in `08-qualitaet.md` §8.2: Chromium only, one worker (a
second flock simulation on the same CPU makes timing assertions flaky for unrelated reasons), and no
canvas pixel comparison — the flock moves every frame, so an inequality assertion would always pass
and a golden image would always break. Drawing arithmetic is unit-tested instead, which is why
`dashPulse.js` and `frameGraphScale.js` are separate modules in the first place.

Coverage is measured on **both** sides of the language boundary and reported separately, because a
single blended number would hide which half is actually tested: `npm run test:coverage`
(`@vitest/coverage-v8`) for the frontend, `cargo llvm-cov --lib` for the engine. Two deliberate
choices in `frontend/vitest.config.js`: `all: true`, so modules without a test count against the
percentage instead of being invisible; and no `exclude` for `index.js` or `frameTimeGraph.js`, the
two files that depress the number most — the low frontend figure is the honest statement that this
suite cannot reach the DOM half, and that half is covered by the Playwright suite instead. The only
exclusions are generated WASM glue, the test files, and `gameConfig.js` (constants, nothing
executable). `--lib` on the Rust side is load-bearing: it keeps the host run to the `#[cfg(test)]`
modules and out of `engine/tests/`, which only ever runs under `wasm-pack`.

**Two consequences of that split which are easy to misread.** First, the files under
`engine/tests/` compile for the host target but report **0 tests** under `cargo test` —
`#[wasm_bindgen_test]` expands to nothing there. A green `cargo test` therefore says nothing at all
about the WASM boundary, and that is exactly how `wasm_tests.rs` sat as an empty stub for two months
without any signal. The boundary is only checked by `wasm-pack test`. Second, `cargo llvm-cov`
instruments the host target, so those tests do **not** raise the Rust coverage figure:
`wasm_bridge/response.rs` still reports 0 % while being covered by 21 browser tests. The number understates reality there, and any report of it has to
say so rather than leaving the two facts side by side looking contradictory.

## Architecture

Two independently testable layers with a deliberately narrow boundary between them.

### Engine — `engine/` (Rust → WASM)

Owns _all_ simulation. Has zero knowledge of the DOM, canvas, or browser APIs.

- `math/vector.rs` — `Vec2` with pure operations (`add`, `sub`, `scale`, `limit`, `normalize`).
- `simulation/boid.rs` — `Boid` (position, velocity, acceleration, `difficulty_tier`) and
  `BoidProperties`. **Tuning values live per boid, not globally** — several variants coexist in one
  flock. `constants.rs` holds _defaults_, not invariants.
- `simulation/rules.rs` — the four steering rules as pure functions: `separation`, `alignment`,
  `cohesion`, `seek_target`. Each takes `&Boid` plus a neighbour slice and returns an unweighted force.
  All four scale their desired velocity by `properties.max_speed`, so raising that property changes
  steering strength as well as top speed — which is why a dash passes a speed cap instead.
- `simulation/physics.rs` — `integrate(boid, speed_limit)`, `clamp_force`, `aabb_overlap`. The speed
  limit is a parameter, not read from the boid, so a dashing boid can exceed its normal `max_speed`
  for a few steps without its steering being rescaled.
- `simulation/dash.rs` + `dash_properties.rs` — the per-boid dash state machine
  (`Idle → Charging → Dashing → Cooling`), its tuning, the per-tier ramp, and `dash_render_phase`,
  the single number the frontend draws the warning pulse from. Durations count in **simulation
  steps**, never milliseconds.
- `simulation/dash_selection.rs` — who dashes next, derived deterministically from
  `Flock::step_counter` with the same integer-hash trick as `find_spawn_position`. There is no `rand`
  dependency anywhere in the engine, and adding one would break reproducibility.
- `simulation/overlap.rs` — `resolve_boid_overlaps` and `wrap_position`. A dashing boid is immovable
  inside the relaxation so it keeps its line; the wrap uses `rem_euclid`, so a displacement larger
  than the world cannot leak a boid off-screen.
- `simulation/flock.rs` — `Flock::update()` is the per-step core: it offers at most one new dash,
  clones the boid vector into a **snapshot** so every boid steers against the _previous_ step's state,
  advances each boid's dash state, applies weighted rules (a dashing boid gets separation only —
  cohesion, alignment and seeking are off, which is what makes it break out of the swarm),
  integrates, wraps at world edges, relaxes overlaps, then counts player hits. O(n²) in the boid count.
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
- `input/inputManager.js` + `input/controls.js` — keyboard state and the per-step control object.
  The dash key is edge-triggered and latched, and only captured while a round is running: outside one
  the space bar has to keep activating the menu buttons and the developer `<details>`.
- `player/playerController.js` — player integration (accelerate/decelerate/clamp) plus the dash, whose
  impulse survives the per-step speed clamp by temporarily raising the limit.
- `player/dashCooldown.js`, `renderer/dashPulse.js` — the dash's import-free arithmetic, split out so
  it is testable under Vitest in the same way `loop/frameGraphScale.js` is.
- `renderer/renderer.js` → `renderer/canvasRenderer.js` — indirection so a WebGL backend could
  replace the canvas one without touching callers.
- `loop/simulationStep.js` — the body of one fixed step. The only module in `loop/` without a unit
  test, because it drives `engine-bridge.js`; Playwright covers it instead.
- `gameState.js` — `MENU` / `PLAYING` / `PAUSED` / `GAME_OVER` state machine, transitions only. It
  validates nothing; `PAUSED` is kept reachable only from `PLAYING` by the guards in `index.js`.
- `input/pauseControl.js` — Escape and the auto-pause on window blur. One window listener owns
  **both** directions on purpose: `ui/menuNavigation.js` gates its Escape on the overlay being
  visible, and a second handler would change that gate synchronously inside the same event, so a
  split version either closes the card as it opens or re-pauses right after resuming.
- `ui/menu.js` + `ui/optionGroup.js` — start-menu settings built from one shared option-group module.
- `gameConfig.js` — all frontend constants (no magic numbers in logic modules).

### The two load-bearing invariants

**1. Fixed timestep.** `GameEngine::tick()` advances exactly one step and does _not_ scale by delta
time. The frontend therefore runs the simulation at a constant 60 steps/second
(`SIMULATION_STEP_MS`) and throttles _only rendering_ to the chosen target FPS. Consequences that
break subtly if ignored:

- The player must be integrated inside the same step as the flock — its position is an input to
  `tick()` and to the engine's collision test.
- Hits must be consumed for **every** step of a multi-step frame; reading only the last frame drops hits.
- Conversely, one-shot player input must be **latched and consumed once**, not read as held state:
  a "is the key down" check per step turns one space-bar press into up to five dashes.
- Simulation debt is clamped (`MAX_SIMULATION_STEPS_PER_FRAME`) and deliberately discarded whenever
  the world is frozen (countdown, round start, death, pause), or a restart would open with a
  catch-up burst. The pause is the only one of the four that can last minutes.
- Score, the in-game timer and every ability cooldown derive from `simulationTimeMs`, never from wall
  time — and any timestamp measured against it must be re-seeded in `beginRound()`, where that clock
  jumps back to zero. `countdownEndsAt` is the one deliberate exception and runs on wall time, which
  is why it is also the one value a pause has to carry across itself (`pauseCountdown` /
  `resumeCountdown`).

**2. Flat buffers across the boundary.** `FrameResponse` returns `Float32Array` positions,
velocities and dash phases plus a `Uint32Array` of difficulty tiers — flat, cache-friendly,
index-aligned, four buffers in total. Keep the interface minimal and strongly typed; do not pass
objects or per-entity structs across. `dash_phases` shows the pattern for packing a per-boid render
state into one number: `0` means nothing to draw, a positive value is charge-up progress and a
negative one is dash-remaining, so the sign carries the state and no second buffer is needed.

Note that `INITIAL_BOID_COUNT` is duplicated in `engine/src/constants.rs` and
`frontend/src/gameConfig.js` — keep the two in sync when changing it.

## Project conventions

These come from `.github/copilot-instructions.md` and apply to Claude Code equally.

### Human readability is the top priority

This project is developed by university students learning Rust and WebAssembly.

- Write as if the reader is meeting Rust for the first time. Prefer straightforward code over
  idiomatic one-liners; avoid trait wizardry, macro-heavy patterns, and dense iterator chains.
- Prefer `for` loops over iterator combinators when the body is non-trivial.
- Every non-trivial block gets a plain-language comment explaining _what_ and _why_, not _how_.
- Explicit names over abbreviations (`separation_force`, not `sep_f`).
- No micro-optimisation (manual SIMD, bit tricks, `unsafe` pointer arithmetic) unless a profiler
  identified the bottleneck; any such code needs a detailed comment.
- When a simpler approach exists, take it even if marginally less efficient.

### Hard rules

- **No source file over 400 lines** (Rust, JS, or test). Split into focused modules before growing
  past it. This rule does **not** apply under `documentation/` — a five-page report chapter
  necessarily exceeds it and must not be sharded.
- **No hard-coded user-facing strings.** Everything goes through `ui/i18n.js` with namespaced keys
  (`menu.start`, `hud.score`); English (`frontend/public/locales/en.json`) is the default locale.
  It lives under `public/` because `ui/i18n.js` `fetch`es it at runtime rather than importing it —
  files Vite never sees in the module graph are only shipped if they sit in `public/`. Anywhere else
  and the production build silently omits them, leaving every label as its raw key.
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
   `ai/` (`ai/YYYY-MM-DD-session.json`) _before_ replying. `ai/` is committed and must never be
   gitignored. Each entry is `{"model", "prompt", "topic", "use"}`:
   - `topic` (required) — one of `engine`, `wasm-bridge`, `frontend-ui`, `loop-input`,
     `tooling-tests`, `prozess-doku`. These are the six sections of the report's KI-Verzeichnis.
   - `use` (optional, set at commit time) — one of `rein-informativ`, `recherche-informativ`,
     `impl`, `uebernommen`, `ueberarbeitet`. Omitted means `impl`. Mark the two informational
     values explicitly; they are the minority and the ones that show whether an answer was
     weighed or just accepted.
2. **Changelog.** Record user-visible changes in `CHANGELOG.md` under `[Unreleased]`
   (Keep a Changelog categories), in the same commit as the change.
3. **Commit.** Every completed change is committed immediately, atomically, using
   [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <description>`
   with `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, or `perf`.
   **Never `git push` unless explicitly asked.**
4. **Tests.** Assess whether the change warrants automated tests. Either write them in the same step
   or explicitly tell the developer which coverage is still outstanding.
5. **Journal.** Append to `documentation/report/projekt-journal.md`, **in German**, in the same
   commit:
   - **always** one row in _Aufwand_ — date, hours, spec/measure ID (`S-01`…`S-06`, `T-01`…`T-06`,
     `D-01` from `docs/specs-overview.md`), one line on what was done;
   - **when applicable** an _Entscheidung_ block for any non-obvious technical decision — chosen
     option, rejected alternatives, why, consequence, and a `→ Kap. n` tag;
   - **when applicable** a _Herausforderung_ bullet for anything that cost more than ~30 min of
     unplanned work.

   Never record anything a command can regenerate (LOC, test counts, script lists) — those belong
   in `documentation/report/09-quellcode-uebersicht.md` as the command that produces them.

   Before writing or revising any chapter under `documentation/report/`, read
   `documentation/muster-referenz.md` first. It is a transcript and analysis of the professor's
   sample report (`documentation/Prüfungsleistung_Muster.pdf`) — chapter-by-chapter structure,
   the writing style the report has to match, the mapping from the sample's chapters onto ours,
   and the house rules that follow from it (German, impersonal, present tense, no claim without a
   reason, negative findings stated plainly, numbers interpreted rather than just printed, tables
   and code listings moved to the appendix and referenced by number). The PDFs themselves are
   image-heavy and only partly machine-readable; the Markdown file is the working source.

   The university report is written _alongside_ development, not afterwards. Structure chapters
   (01–06) are composed in a few sittings; only chapters 07, 08 and 12 grow per commit. What every
   commit owes is **facts**, not prose. See `documentation/report/00-index.md`.

### Workflow

Spec-driven development is preferred: define the expected mathematical behaviour and edge cases
before implementing. `docs/specs-overview.md` (German) tracks the feature specs and effort estimates.
The game must stay installationless and server-free for end users.
