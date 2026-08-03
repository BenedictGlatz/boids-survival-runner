//! Helpers shared by the WASM boundary test targets.
//!
//! Not a test file itself: Cargo only builds `tests/*.rs` as test binaries, so a
//! subdirectory module is the plain way to share setup between them without any of them
//! being compiled as part of another.
//!
//! `dead_code` is off for the whole module, and that is unavoidable rather than lazy: the
//! file is compiled *into each* test binary separately, so anything one of them does not
//! happen to use is dead code in that binary and warns there. The obstacle tests need only
//! the world and the engine; the wave tests need the tick helpers as well.

#![allow(dead_code)]

use boids_survival_runner_engine::GameEngine;

pub const WORLD_WIDTH: u32 = 1000;
pub const WORLD_HEIGHT: u32 = 800;
pub const BOID_COUNT: u32 = 24;

/// The engine's spawn warning window, in simulation steps.
///
/// Duplicated from `engine/src/constants.rs` on purpose, the same way the buffer strides
/// are: a boundary test that read the real constant would follow it silently instead of
/// failing when the boundary changes.
pub const WAVE_SPAWN_WARNING_STEPS: u32 = 120;

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

/// Ticks the engine with the player standing still in the middle of the world.
pub fn tick_in_place(engine: &mut GameEngine, steps: u32) {
    let player_x = WORLD_WIDTH as f32 / 2.0;
    let player_y = WORLD_HEIGHT as f32 / 2.0;

    for _ in 0..steps {
        engine.tick(player_x, player_y, player_x, player_y);
    }
}

/// Announces a wave and runs the clock until every boid of it has actually arrived.
///
/// `set_wave` only announces: a wave spends `WAVE_SPAWN_WARNING_STEPS` as markers on the
/// world edge before its boids enter the world. Any test about a later wave's *boids*
/// therefore has to tick past that window first, and the ones that are about the warning
/// itself live in `wasm_wave_spawn_tests.rs`.
pub fn advance_to_wave(engine: &mut GameEngine, wave: u32) {
    engine.set_wave(wave, WORLD_WIDTH as f32 / 2.0, WORLD_HEIGHT as f32 / 2.0);
    tick_in_place(engine, WAVE_SPAWN_WARNING_STEPS);
}
