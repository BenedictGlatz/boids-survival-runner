# Copilot Instructions – Boids Survival Runner

## Project Overview

Boids Survival Runner is a browser-based game built with a strict architectural separation between a
high-performance Rust/WebAssembly core and a JavaScript web frontend. The Rust engine handles all
compute-intensive simulation logic, while the frontend manages rendering, user input, and game state
presentation. The game runs entirely in the browser with no installation required.

---

## Architecture

The project is divided into two distinct, independently testable layers.

### Rust/WASM Layer (Engine)

- All computationally intensive vector math and simulation logic lives here.
- Compiled to WebAssembly using `wasm-pack` and `wasm-bindgen`.
- Exposes a clean, minimal API to the JavaScript frontend.
- Responsible for all per-frame simulation calculations.
- Must have zero dependencies on the DOM, browser APIs, or any rendering library.

### JavaScript Frontend Layer

- Drives the game loop via `requestAnimationFrame`.
- Captures and normalizes user input (mouse and keyboard).
- Manages all rendering via HTML5 Canvas or WebGL.
- Owns game state transitions (e.g., start menu, active game, game over).
- Calls into the WASM module each frame, passing player state and receiving updated simulation data.

### WASM Interface Contract

- The frontend passes the current player position to the Rust engine on every frame tick.
- The Rust engine returns updated entity positions and any collision/hit events as a structured response.
- The interface must remain minimal and strongly typed; internal engine concepts must not leak into
  the JavaScript layer.
- Data crossing the WASM boundary must use flat, cache-friendly structures (e.g., `Float32Array`)
  to minimize serialization overhead and keep per-frame costs predictable.

---

## Tech Stack

| Layer     | Technology                                        |
|-----------|---------------------------------------------------|
| Frontend  | HTML, CSS, JavaScript (ES modules)                |
| Rendering | HTML5 Canvas or WebGL                             |
| Engine    | Rust (stable toolchain, managed via Cargo)        |
| WASM      | `wasm-bindgen`, `wasm-pack`                       |

---

## Human Readability

**This project is developed by university students learning Rust and WebAssembly. Human readability
is the top priority — always favour clear, teachable code over clever or obscure optimisations.**

- Write code as if the reader is encountering Rust for the first time. Prefer straightforward
  solutions over idiomatic one-liners that sacrifice clarity.
- Avoid advanced Rust features (e.g. complex iterator chains, trait wizardry, macro-heavy patterns)
  unless they are genuinely the simplest way to express the logic.
- When a simpler approach exists — even if marginally less efficient — choose the simpler approach.
- Every non-trivial block of logic must include a plain-language comment explaining *what* it does
  and *why*, not just *how*.
- Prefer explicit variable names over abbreviated or terse identifiers (e.g. `separation_force`
  over `sep_f`).
- Prefer `for` loops over iterator combinators when the loop body is non-trivial; iterators are
  acceptable for simple transformations where readability is not reduced.
- Do not apply micro-optimisations (e.g. manual SIMD, bit-twiddling tricks, unsafe pointer
  arithmetic) unless a profiler identifies a concrete bottleneck and the optimisation is essential.
  Any such optimisation must be accompanied by a detailed comment explaining the technique.

---

## Coding Standards

### Rust

- Use safe Rust wherever possible; every `unsafe` block requires an explicit justification comment.
- All `#[wasm_bindgen]`-exported functions must have documentation comments.
- Unit tests are required for all mathematical and simulation functions.
- Hot-path code (functions called every frame) must minimize or eliminate per-frame heap allocations.
- Follow standard Rust naming conventions: `snake_case` for functions and variables, `PascalCase`
  for types and structs.
- Simulation constants must use named constants with descriptive identifiers — no magic numbers.

### JavaScript

- Use ES module syntax (`import`/`export`) throughout; no global variables.
- Rendering, input handling, and state management must each live in clearly separated modules.
- The game loop must not contain simulation logic; all calculations are delegated to the WASM module.
- WASM calls per frame must complete synchronously within the frame budget; do not introduce
  asynchronous patterns in the hot path.

### File Size & Modularity

- No source file (Rust or JavaScript) may exceed **400 lines**.
- If a file approaches this limit, split it into focused, single-responsibility modules before
  adding further code.
- Module boundaries should reflect logical separation of concerns, not arbitrary line counts.

### Localization (i18n)

- All user-facing strings (UI labels, menu text, messages) must be externalized via an i18n
  solution — no hard-coded display text in source files.
- String keys must be descriptive and namespaced by context (e.g., `menu.start`, `hud.score`).
- The default locale is English (`en`); additional locales can be added without touching source code.

---

## Performance Requirements

- The engine targets a sustained 60 FPS while simulating hundreds to thousands of entities.
- Per-frame allocations in the Rust engine must be minimized or eliminated on the hot path.
- Benchmark and profile before optimizing — do not prematurely optimize code that is not on the
  critical path.
- WebAssembly memory layout and data transfer costs must be considered when designing the
  WASM interface.

---

## Project & Repository Conventions

- The Rust crate and the JavaScript frontend reside in separate top-level directories within the
  repository.
- All WASM build artifacts are gitignored; the build must be fully reproducible via `wasm-pack build`.
- Mathematical algorithms (e.g., swarm rules) are implemented as pure functions with no side
  effects, making them straightforward to unit-test and reason about in isolation.
- JavaScript files must use `camelCase` file names.
- Markdown files must use `kebab-case` file names.
- The project must remain installationless and platform-independent for end users — no server-side
  runtime is required to play.

### Commit Discipline

- Every completed change must be committed immediately using the
  **[Conventional Commits](https://www.conventionalcommits.org/)** format:
  ```
  <type>(<optional scope>): <short description>
  ```
  Common types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `perf`.
- Commits must be atomic — one logical change per commit.
- **Do not push (`git push`) unless the user explicitly requests it.**

### Changelog

- All user-visible changes must be recorded in `CHANGELOG.md` following the
  **[Keep a Changelog](https://keepachangelog.com/)** standard.
- Entries are grouped under version headings and categorized as `Added`, `Changed`, `Deprecated`,
  `Removed`, `Fixed`, or `Security`.
- Unreleased changes accumulate under an `[Unreleased]` section at the top.
- The changelog is updated in the same commit as the change it describes.

---

## AI-Assisted Development Guidelines

- **Spec-Driven Development** is the preferred workflow: define expected mathematical behavior and
  edge cases before writing implementation code.
- When generating or modifying simulation/math code in Rust, always include or update corresponding
  unit tests.
- When scaffolding or modifying the WASM bridge, follow `wasm-bindgen` best practices for type
  safety and minimal boundary overhead.
- When suggesting swarm algorithms, prefer well-documented, reproducible formulations with clearly
  named parameters.
- Code generation for boilerplate (e.g., WASM bridge setup, Cargo configuration) is a valid and
  encouraged use of AI assistance.

### AI Prompt Logging

- This is a mandatory step — DO NOT SKIP IT. Every user prompt must be appended to the active prompt-history file before replying.

- Every prompt submitted to an LLM in the context of this repository must be logged in the
  `ai/` directory at the repository root.
- Each log entry must record at minimum:
  - **Model** used (e.g. `claude-sonnet-4.6`, `gpt-4o`)
  - **Prompt** (full text as sent)
- Log files may be structured as Markdown or JSON; one file per session or per day is acceptable.
- The `ai/` directory and its contents are committed to the repository and must not be gitignored.

### Testing Obligations for New Features

- Whenever a new feature is implemented, the responsible agent must assess whether automated
  tests are appropriate for the change.
- If tests are warranted, the agent must either create them in the same step or — if deferred —
  **explicitly inform the developer** that tests are still outstanding and describe what should
  be covered.
- The choice of test type is left to the agent's judgment based on context:
  - **Unit tests** for pure functions, math utilities, and isolated modules (preferred in Rust).
  - **End-to-end tests** for user-facing flows that span multiple layers (e.g., input → render).
- Test files follow the same 400-line limit and modularity rules as production code.
