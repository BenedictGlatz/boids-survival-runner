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

### Changed
- The engine now stores movement and perception tuning as per-boid properties with named defaults, so different boid variants can coexist in the same flock.
- The Copilot instructions now explicitly require heterogeneous boid support instead of assuming one global parameter set for every boid.
- Frontend Vite scripts now build the Rust/WASM package into an ignored frontend import folder before dev/build runs.
