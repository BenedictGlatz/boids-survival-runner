//! WASM interface contract tests.
//! These tests verify that the public engine API behaves correctly at the boundary.
//! Run with: wasm-pack test --headless --firefox
//!
//! Why they live here and not as a `#[cfg(test)]` module beside the code: the
//! getters on `FrameResponse` return `js_sys::Float32Array` and
//! `js_sys::Uint32Array`, which only exist inside a JavaScript runtime. A plain
//! `cargo test` compiles them but cannot call them, which is why coverage reports
//! `wasm_bridge/response.rs` at zero however many unit tests the engine has. The
//! four-buffer contract is one of the two load-bearing invariants of the project,
//! so leaving it unchecked was the largest hole in the test suite.
//!
//! What the contract says, and therefore what is asserted below: four flat,
//! index-aligned buffers per frame — two floats per boid for positions and
//! velocities, one unsigned integer for the difficulty tier, and one float for the
//! dash phase, whose sign carries the dash state so no fifth buffer is needed.
//!
//! A fifth buffer carries the temporary obstacles, packed six floats each rather
//! than one per obstacle, because an obstacle needs a whole capsule described. It is
//! not index-aligned with the boid buffers and is checked separately below.

use boids_survival_runner_engine::GameEngine;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

const WORLD_WIDTH: u32 = 1000;
const WORLD_HEIGHT: u32 = 800;
const BOID_COUNT: u32 = 24;

/// The player stands in the middle of a default-sized world.
fn engine_with_player_in_the_middle() -> GameEngine {
    GameEngine::new(
        WORLD_WIDTH,
        WORLD_HEIGHT,
        BOID_COUNT,
        WORLD_WIDTH as f32 / 2.0,
        WORLD_HEIGHT as f32 / 2.0,
    )
}

/// Asserts the index alignment the whole renderer depends on: every buffer carries
/// data for exactly the boids the entity count promises, so `positions[2i]` and
/// `tiers[i]` always describe the same boid.
fn assert_buffers_are_index_aligned(
    entity_count: u32,
    positions_len: u32,
    velocities_len: u32,
    tiers_len: u32,
    dash_phases_len: u32,
) {
    assert_eq!(positions_len, entity_count * 2, "positions hold x and y");
    assert_eq!(velocities_len, entity_count * 2, "velocities hold x and y");
    assert_eq!(tiers_len, entity_count, "one tier per boid");
    assert_eq!(dash_phases_len, entity_count, "one dash phase per boid");
}

/// Values per obstacle in the obstacle buffer:
/// `[spine_start_x, spine_start_y, spine_end_x, spine_end_y, radius, life_fraction]`.
/// Duplicated from the engine and the frontend on purpose — the point of a contract
/// test is to fail when one side changes the number without the other.
const OBSTACLE_STRIDE: u32 = 6;

/// Asserts the obstacle buffer is packed the way the renderer decodes it. A separate
/// helper from the boid one because obstacles are not index-aligned with boids: there
/// is no relationship between how many of each exist.
fn assert_obstacle_buffer_is_packed(obstacle_count: u32, obstacles_len: u32) {
    assert_eq!(
        obstacles_len,
        obstacle_count * OBSTACLE_STRIDE,
        "six values per obstacle"
    );
}

#[wasm_bindgen_test]
fn snapshot_fills_every_buffer_for_every_boid() {
    let mut engine = engine_with_player_in_the_middle();
    let frame = engine.snapshot();

    assert_eq!(frame.entity_count(), BOID_COUNT);
    assert_buffers_are_index_aligned(
        frame.entity_count(),
        frame.positions().length(),
        frame.velocities().length(),
        frame.tiers().length(),
        frame.dash_phases().length(),
    );
}

#[wasm_bindgen_test]
fn tick_keeps_the_buffers_index_aligned() {
    let mut engine = engine_with_player_in_the_middle();

    for _ in 0..30 {
        let frame = engine.tick(120.0, 140.0, 120.0, 140.0);

        assert_buffers_are_index_aligned(
            frame.entity_count(),
            frame.positions().length(),
            frame.velocities().length(),
            frame.tiers().length(),
            frame.dash_phases().length(),
        );
    }
}

#[wasm_bindgen_test]
fn snapshot_reports_the_world_without_advancing_it() {
    // The frontend draws a snapshot during the countdown, while the world is
    // deliberately frozen. Two snapshots in a row must therefore be identical.
    let mut engine = engine_with_player_in_the_middle();

    let first = engine.snapshot().positions().to_vec();
    let second = engine.snapshot().positions().to_vec();
    assert_eq!(first, second);

    engine.tick(400.0, 300.0, 400.0, 300.0);
    let after_a_tick = engine.snapshot().positions().to_vec();
    assert_ne!(first, after_a_tick, "a tick has to move the flock");
}

#[wasm_bindgen_test]
fn a_boid_count_of_zero_falls_back_to_the_default_flock() {
    // The exact default lives in a crate-private constant that is already
    // duplicated in the frontend config, so this checks that the fallback happened
    // at all rather than adding a third copy of the number to keep in sync.
    let mut engine = GameEngine::new(WORLD_WIDTH, WORLD_HEIGHT, 0, 500.0, 400.0);

    assert!(engine.snapshot().entity_count() > 0);
}

#[wasm_bindgen_test]
fn a_zero_sized_world_still_produces_a_usable_frame() {
    // The canvas follows the browser window, which can report a zero dimension
    // while a tab is being restored. The engine clamps to at least one pixel, so
    // the buffers must stay well-formed instead of filling with NaN.
    let mut engine = GameEngine::new(0, 0, 8, 0.0, 0.0);
    let frame = engine.tick(0.0, 0.0, 0.0, 0.0);

    for value in frame.positions().to_vec() {
        assert!(value.is_finite(), "position must not be NaN or infinite");
    }
}

#[wasm_bindgen_test]
fn no_hit_is_reported_while_the_player_stands_clear_of_the_flock() {
    let mut engine = engine_with_player_in_the_middle();

    // The starting boids spawn a safe distance away, so the very first step cannot
    // be a hit however the flock happens to be arranged.
    let frame = engine.tick(
        WORLD_WIDTH as f32 / 2.0,
        WORLD_HEIGHT as f32 / 2.0,
        WORLD_WIDTH as f32 / 2.0,
        WORLD_HEIGHT as f32 / 2.0,
    );

    assert_eq!(frame.hit_count(), 0);
    assert!(!frame.hit());
}

#[wasm_bindgen_test]
fn hit_agrees_with_the_hit_count_once_the_swarm_arrives() {
    // The flock seeks the player and the simulation carries no randomness, so a
    // player standing still is caught within a bounded number of steps. This is the
    // only way to exercise `hit`, the one getter the frontend reads every step to
    // decide whether a life is lost.
    let mut engine = engine_with_player_in_the_middle();
    let mut saw_a_hit = false;

    for _ in 0..600 {
        let frame = engine.tick(
            WORLD_WIDTH as f32 / 2.0,
            WORLD_HEIGHT as f32 / 2.0,
            WORLD_WIDTH as f32 / 2.0,
            WORLD_HEIGHT as f32 / 2.0,
        );

        assert_eq!(
            frame.hit(),
            frame.hit_count() > 0,
            "hit is exactly hit_count > 0"
        );

        if frame.hit() {
            saw_a_hit = true;
            break;
        }
    }

    assert!(saw_a_hit, "a stationary player has to be caught eventually");
}

#[wasm_bindgen_test]
fn set_wave_adds_boids_and_keeps_the_buffers_aligned() {
    let mut engine = engine_with_player_in_the_middle();
    let before = engine.snapshot().entity_count();

    engine.set_wave(3, 500.0, 400.0);
    let frame = engine.snapshot();

    assert!(frame.entity_count() > before);
    assert_buffers_are_index_aligned(
        frame.entity_count(),
        frame.positions().length(),
        frame.velocities().length(),
        frame.tiers().length(),
        frame.dash_phases().length(),
    );
}

#[wasm_bindgen_test]
fn set_wave_ignores_a_wave_that_has_already_been_spawned() {
    // The frontend calls set_wave every simulation step, not only when the wave
    // changes, so repeating the current wave must not keep adding boids.
    let mut engine = engine_with_player_in_the_middle();
    engine.set_wave(3, 500.0, 400.0);
    let after_wave_three = engine.snapshot().entity_count();

    engine.set_wave(3, 500.0, 400.0);
    engine.set_wave(1, 500.0, 400.0);

    assert_eq!(engine.snapshot().entity_count(), after_wave_three);
}

#[wasm_bindgen_test]
fn boids_added_by_a_later_wave_spawn_away_from_the_player() {
    let player_x = WORLD_WIDTH as f32 / 2.0;
    let player_y = WORLD_HEIGHT as f32 / 2.0;
    let mut engine = engine_with_player_in_the_middle();
    let boids_before = engine.snapshot().entity_count() as usize;

    engine.set_wave(4, player_x, player_y);
    let positions = engine.snapshot().positions().to_vec();

    // Only the tail of the buffer is new; the boids already in flight are wherever
    // the simulation put them. 180 is the documented floor of the safe spawn
    // distance — the exact value scales with the world size and is crate-private.
    for index in boids_before..(positions.len() / 2) {
        let dx = positions[index * 2] - player_x;
        let dy = positions[index * 2 + 1] - player_y;

        assert!(
            (dx * dx + dy * dy).sqrt() >= 180.0,
            "a new boid must not spawn on top of the player"
        );
    }
}

#[wasm_bindgen_test]
fn a_later_wave_brings_higher_difficulty_tiers() {
    let mut engine = engine_with_player_in_the_middle();

    for tier in engine.snapshot().tiers().to_vec() {
        assert_eq!(tier, 0, "the first wave is the baseline tier");
    }

    engine.set_wave(4, 500.0, 400.0);
    let tiers = engine.snapshot().tiers().to_vec();

    assert!(tiers.iter().any(|&tier| tier > 0));
}

#[wasm_bindgen_test]
fn resize_pulls_every_boid_into_the_new_world() {
    // Shrinking the window leaves boids outside the new bounds. One step has to be
    // enough to wrap them all back in, because the renderer would otherwise draw
    // them off-screen for as long as they drift.
    let mut engine = engine_with_player_in_the_middle();
    let narrow_width = 320;
    let narrow_height = 240;

    engine.resize(narrow_width, narrow_height);
    let positions = engine.tick(160.0, 120.0, 160.0, 120.0).positions().to_vec();

    for index in 0..(positions.len() / 2) {
        let x = positions[index * 2];
        let y = positions[index * 2 + 1];

        assert!(x >= 0.0 && x < narrow_width as f32, "x out of bounds: {x}");
        assert!(y >= 0.0 && y < narrow_height as f32, "y out of bounds: {y}");
    }
}

#[wasm_bindgen_test]
fn nothing_pulses_while_no_boid_is_allowed_to_dash() {
    // Boids only gain the dash from the third wave on. Until then every dash phase
    // has to be exactly zero, which is the "nothing to draw" half of the contract.
    let mut engine = engine_with_player_in_the_middle();
    engine.set_wave(2, 500.0, 400.0);

    for _ in 0..120 {
        for phase in engine
            .tick(500.0, 400.0, 500.0, 400.0)
            .dash_phases()
            .to_vec()
        {
            assert_eq!(phase, 0.0);
        }
    }
}

#[wasm_bindgen_test]
fn dash_phases_stay_inside_the_range_the_renderer_expects() {
    // The sign carries the state: positive is charge-up progress, negative is dash
    // remaining. The renderer scales the warning pulse by this number directly, so a
    // value outside [-1, 1] would draw outside the boid.
    let mut engine = engine_with_player_in_the_middle();
    engine.set_wave(5, 500.0, 400.0);
    let mut saw_a_pulse = false;

    for _ in 0..400 {
        for phase in engine
            .tick(500.0, 400.0, 500.0, 400.0)
            .dash_phases()
            .to_vec()
        {
            assert!(
                (-1.0..=1.0).contains(&phase),
                "dash phase out of range: {phase}"
            );

            if phase != 0.0 {
                saw_a_pulse = true;
            }
        }
    }

    assert!(saw_a_pulse, "a high-tier flock has to dash at some point");
}

#[wasm_bindgen_test]
fn a_fresh_world_has_no_obstacles_and_an_empty_obstacle_buffer() {
    let mut engine = engine_with_player_in_the_middle();
    let frame = engine.snapshot();

    assert_eq!(frame.obstacle_count(), 0);
    assert_obstacle_buffer_is_packed(frame.obstacle_count(), frame.obstacles().length());
}

#[wasm_bindgen_test]
fn obstacles_appear_and_stay_packed_six_values_at_a_time() {
    // The frontend reads this buffer six values at a time with no separate shape
    // flag, so a stride that ever disagreed would draw every obstacle in the wrong
    // place rather than failing loudly.
    let mut engine = engine_with_player_in_the_middle();
    let mut saw_an_obstacle = false;

    for _ in 0..2_000 {
        let frame = engine.tick(500.0, 400.0, 500.0, 400.0);

        assert_obstacle_buffer_is_packed(frame.obstacle_count(), frame.obstacles().length());

        if frame.obstacle_count() > 0 {
            saw_an_obstacle = true;
        }

        for value in frame.obstacles().to_vec() {
            assert!(value.is_finite(), "obstacle value must not be NaN");
        }
    }

    assert!(
        saw_an_obstacle,
        "obstacles have to show up within the first half minute of play"
    );
}

#[wasm_bindgen_test]
fn the_life_fraction_of_every_obstacle_stays_in_the_range_the_renderer_expects() {
    // The renderer fades an obstacle in and out straight from this number, so a value
    // outside (0, 1] would draw at the wrong opacity or size.
    let mut engine = engine_with_player_in_the_middle();

    for _ in 0..2_000 {
        let frame = engine.tick(500.0, 400.0, 500.0, 400.0);
        let obstacles = frame.obstacles().to_vec();

        for index in 0..frame.obstacle_count() as usize {
            let life_fraction = obstacles[index * OBSTACLE_STRIDE as usize + 5];

            assert!(
                life_fraction > 0.0 && life_fraction <= 1.0,
                "life fraction out of range: {life_fraction}"
            );
        }
    }
}

#[wasm_bindgen_test]
fn a_player_in_open_space_keeps_the_position_it_asked_for() {
    // The engine may now correct the player's position, so the no-contact case has to
    // hand it straight back. Anything else would nudge the player every single step.
    let mut engine = engine_with_player_in_the_middle();
    let frame = engine.tick(500.0, 400.0, 505.0, 400.0);

    assert_eq!(frame.player_x(), 505.0);
    assert_eq!(frame.player_y(), 400.0);
    assert!(!frame.obstacle_hit());
    assert_eq!(frame.block_normal_x(), 0.0);
    assert_eq!(frame.block_normal_y(), 0.0);
}

#[wasm_bindgen_test]
fn a_player_walking_into_an_obstacle_is_blocked_and_told_which_way_to_slide() {
    // The one path that exercises the whole player-collision contract across the
    // boundary. The obstacle position is not known in advance, so the test plays until
    // one exists and then walks the player straight at its centre.
    let mut engine = engine_with_player_in_the_middle();
    let mut obstacle = Vec::new();

    for _ in 0..2_000 {
        let frame = engine.tick(500.0, 400.0, 500.0, 400.0);
        if frame.obstacle_count() > 0 {
            obstacle = frame.obstacles().to_vec();
            break;
        }
    }

    assert!(!obstacle.is_empty(), "no obstacle appeared to walk into");

    // Aim at the middle of the capsule's centre line from a little way off.
    let target_x = (obstacle[0] + obstacle[2]) / 2.0;
    let target_y = (obstacle[1] + obstacle[3]) / 2.0;
    let approach_x = target_x - 200.0;

    let frame = engine.tick(approach_x, target_y, target_x, target_y);

    assert!(
        frame.obstacle_hit(),
        "walking into an obstacle has to register"
    );
    // Placed outside it rather than at the centre it aimed for.
    assert_ne!(frame.player_x(), target_x);
    // A unit normal, so the caller can project its velocity onto it directly.
    let normal_length = (frame.block_normal_x() * frame.block_normal_x()
        + frame.block_normal_y() * frame.block_normal_y())
    .sqrt();
    assert!((normal_length - 1.0).abs() < 1e-4);
}
