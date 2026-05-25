# Boids Survival Runner

A browser-based survival game powered by a high-performance Rust/WebAssembly swarm simulation engine.

## Architecture

| Layer    | Location     | Technology                      |
|----------|--------------|---------------------------------|
| Engine   | `engine/`    | Rust, wasm-bindgen, wasm-pack   |
| Frontend | `frontend/`  | HTML, CSS, JavaScript (ES modules), Vite |

The Rust engine handles all per-frame simulation logic and exposes a minimal, strongly-typed API to the JavaScript frontend via WebAssembly. The frontend owns rendering (HTML5 Canvas), input handling, and game-state transitions.

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/) (stable toolchain)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
- [Node.js](https://nodejs.org/) (LTS)

### Build the engine

```bash
cd engine
wasm-pack build --target bundler
```

### Run the frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Conventions

- All user-facing strings are externalized in `frontend/locales/`.
- Every change is recorded in `CHANGELOG.md` (Keep a Changelog format).
- Commits follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
- Source files must not exceed 400 lines.
