//! Helpers shared by the two WASM boundary test targets.
//!
//! Not a test file itself: Cargo only builds `tests/*.rs` as test binaries, so a
//! subdirectory module is the plain way to share setup between them without either
//! file being compiled as part of the other.

use boids_survival_runner_engine::GameEngine;

pub const WORLD_WIDTH: u32 = 1000;
pub const WORLD_HEIGHT: u32 = 800;
pub const BOID_COUNT: u32 = 24;

/// The player stands in the middle of a default-sized world.
pub fn engine_with_player_in_the_middle() -> GameEngine {
    GameEngine::new(
        WORLD_WIDTH,
        WORLD_HEIGHT,
        BOID_COUNT,
        WORLD_WIDTH as f32 / 2.0,
        WORLD_HEIGHT as f32 / 2.0,
    )
}
