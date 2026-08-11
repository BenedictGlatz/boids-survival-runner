# Boids Survival Runner

A browser-based survival game powered by a high-performance Rust/WebAssembly swarm simulation engine.

## Architecture

| Layer    | Location    | Technology                               |
| -------- | ----------- | ---------------------------------------- |
| Engine   | `engine/`   | Rust, wasm-bindgen, wasm-pack            |
| Frontend | `frontend/` | HTML, CSS, JavaScript (ES modules), Vite |

The Rust engine handles all per-frame simulation logic and exposes a minimal, strongly-typed API to the JavaScript frontend via WebAssembly. The frontend owns rendering (HTML5 Canvas), input handling, and game-state transitions.

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/) (stable toolchain)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
- [Node.js](https://nodejs.org/) (LTS)

### Build the engine

```bash
cd frontend
npm run build:wasm
```

> This is the authoritative engine build. It emits `--target web` into
> `frontend/src/wasm/engine/`, which is where the frontend imports from. Running `wasm-pack` directly
> in `engine/` writes to `engine/pkg/`, which nothing reads.

### Run the frontend

```bash
cd frontend
npm install
npm run dev
```

> `npm run dev` automatically builds the WebAssembly engine first, then starts the Vite dev server at **http://localhost:5173**.

---

## Opening the app in a browser

### Option A — VSCode Simple Browser (preferred)

The Simple Browser is built into VSCode; no extension required.

1. Open a terminal inside VSCode (**Terminal → New Terminal**).
2. Navigate to the frontend folder and start the dev server:
   ```bash
   cd frontend
   npm run dev
   ```
3. Wait until the terminal shows a line like:
   ```
   ➜  Local:   http://localhost:5173/
   ```
4. Open the Command Palette: **Ctrl + Shift + P** (Windows/Linux) or **Cmd + Shift + P** (macOS).
5. Type `Simple Browser: Show` and press **Enter**.
6. In the URL bar that appears, type `http://localhost:5173` and press **Enter**.

The game now runs in a split-pane tab inside VSCode. To reload after a code change, press **Ctrl + R** inside the Simple Browser panel.

### Option B — Firefox

1. Open a terminal and start the dev server (same as above, step 2).
2. Open Firefox and navigate to:
   ```
   http://localhost:5173
   ```

Vite's hot-module replacement keeps the browser in sync automatically while the dev server is running.

## Controls

| Key                           | Action                                                |
| ----------------------------- | ----------------------------------------------------- |
| **W A S D** or **arrow keys** | Move                                                  |
| **Space**                     | Dash — a short burst in the direction you are holding |

The dash needs a direction: pressing Space while standing still does nothing and does not spend the
cooldown. The bar at the bottom centre of the screen shows when the dash is ready again.

From wave three onward some boids can dash at you as well. A boid about to lunge pulses in size and
brightness, and pulses faster the closer it gets to striking — that pulse is your cue to move.

Outside a running round the space bar belongs to the menu, where it activates the focused button, so
the whole start screen stays operable by keyboard.

## Running the tests

Each layer has its own test runner, matching the split between simulation and presentation.

### Engine (Rust)

```bash
cd engine
cargo test
```

Covers the vector math and the simulation rules as `#[cfg(test)]` modules beside the code they test.

### Frontend (JavaScript)

```bash
cd frontend
npm install
npm test          # single run
npm run test:watch  # re-runs on file changes
```

Uses [Vitest](https://vitest.dev/). Tests live in a `__tests__/` folder inside the folder holding the
module they cover and are named `<module>.test.js`; the runner picks up
`frontend/src/**/__tests__/*.test.js`. That keeps a test one directory away from its module without
letting the test files outnumber the modules in a folder listing.

The suite is scoped to the **pure logic** modules — frame timing, the player controller, and the
like. Those have no imports, so it runs in plain Node without a browser and **without a built
WebAssembly package**, which keeps `npm test` fast and independent of the Rust toolchain. Anything
that touches the canvas, the DOM or the engine bridge is deliberately left out, and simulation
behaviour belongs in `cargo test` instead.

Covered so far: `src/loop/frameMetrics.js`, `src/ui/frameGraphScale.js`,
`src/player/dashCooldown.js`, `src/renderer/dashPulse.js`.

## Project Conventions

- All user-facing strings are externalized in `frontend/public/locales/`.
- Every change is recorded in `CHANGELOG.md` (Keep a Changelog format).
- Commits follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
- Source files must not exceed 400 lines.
