//! WASM interface contract tests for the temporary obstacles.
//! Run with: wasm-pack test --headless --firefox
//!
//! Split from `wasm_tests.rs` for length alone, along the seam that was already
//! there: the obstacle buffer is the one buffer that is *not* index-aligned with the
//! boid buffers — there is no relationship between how many boids and how many
//! obstacles exist — and the player-collision contract hangs off the same geometry.
//!
//! What is asserted here: the obstacle buffer is packed the way the renderer decodes
//! it, the render states it carries stay inside the ranges the renderer assumes, a
//! player who runs into an obstacle is pushed clear of it rather than left inside it,
//! and an obstacle that is still materialising lets the player through.

mod common;

use boids_survival_runner_engine::GameEngine;
use common::engine_with_player_in_the_middle;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// Values per obstacle in the obstacle buffer:
/// `[spine_start_x, spine_start_y, spine_end_x, spine_end_y, radius, render_phase,
/// hit_flash]`.
/// Duplicated from the engine and the frontend on purpose — the point of a contract
/// test is to fail when one side changes the number without the other.
const OBSTACLE_STRIDE: u32 = 7;

/// Asserts the obstacle buffer is packed the way the renderer decodes it.
fn assert_obstacle_buffer_is_packed(obstacle_count: u32, obstacles_len: u32) {
    assert_eq!(
        obstacles_len,
        obstacle_count * OBSTACLE_STRIDE,
        "seven values per obstacle"
    );
}

#[wasm_bindgen_test]
fn a_fresh_world_has_no_obstacles_and_an_empty_obstacle_buffer() {
    let mut engine = engine_with_player_in_the_middle();
    let frame = engine.snapshot();

    assert_eq!(frame.obstacle_count(), 0);
    assert_obstacle_buffer_is_packed(frame.obstacle_count(), frame.obstacles().length());
}

#[wasm_bindgen_test]
fn obstacles_appear_and_stay_packed_seven_values_at_a_time() {
    // The frontend reads this buffer seven values at a time with no separate shape
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
fn the_render_phase_of_every_obstacle_stays_in_the_range_the_renderer_expects() {
    // The renderer fades an obstacle in and out straight from this number and branches
    // on its sign, so a value outside [-1, 1] would draw at the wrong opacity, and an
    // exact zero would leave the phase unreadable.
    let mut engine = engine_with_player_in_the_middle();

    for _ in 0..2_000 {
        let frame = engine.tick(500.0, 400.0, 500.0, 400.0);
        let obstacles = frame.obstacles().to_vec();

        for index in 0..frame.obstacle_count() as usize {
            let render_phase = obstacles[index * OBSTACLE_STRIDE as usize + 5];

            assert!(
                (-1.0..=1.0).contains(&render_phase) && render_phase != 0.0,
                "render phase out of range: {render_phase}"
            );
        }
    }
}

#[wasm_bindgen_test]
fn an_obstacle_reports_a_negative_render_phase_while_it_appears_and_a_positive_one_after() {
    // The sign is the whole contract: negative means drawn but not solid yet, positive
    // means solid. Both have to be observable from the buffer alone.
    let mut engine = engine_with_player_in_the_middle();
    let appearing = play_until_an_obstacle_appears(&mut engine);

    assert!(!appearing.is_empty(), "no obstacle appeared");
    assert!(
        appearing[5] < 0.0,
        "an obstacle has to start out materialising, got {}",
        appearing[5]
    );

    let solid = play_until_a_solid_obstacle_exists(&mut engine);

    assert!(!solid.is_empty(), "the obstacle never turned solid");
    assert!(solid[5] > 0.0);
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

/// Plays until an obstacle in the buffer satisfies `wanted` and returns that
/// obstacle's seven values.
///
/// Where obstacles appear is not known in advance, so every collision test has to wait
/// for one and then read its geometry out of the buffer. The predicate is what tells
/// the two states apart: the player is only blocked by an obstacle that has finished
/// materialising.
fn play_until_an_obstacle(engine: &mut GameEngine, wanted: fn(f32) -> bool) -> Vec<f32> {
    let stride = OBSTACLE_STRIDE as usize;

    for _ in 0..2_000 {
        let frame = engine.tick(500.0, 400.0, 500.0, 400.0);
        let obstacles = frame.obstacles().to_vec();

        for index in 0..frame.obstacle_count() as usize {
            let start = index * stride;

            if wanted(obstacles[start + 5]) {
                return obstacles[start..start + stride].to_vec();
            }
        }
    }

    Vec::new()
}

/// The first obstacle that is still materialising, which is the state every obstacle
/// enters the world in.
fn play_until_an_obstacle_appears(engine: &mut GameEngine) -> Vec<f32> {
    play_until_an_obstacle(engine, |render_phase| render_phase < 0.0)
}

/// The first obstacle that has finished materialising and can be collided with.
fn play_until_a_solid_obstacle_exists(engine: &mut GameEngine) -> Vec<f32> {
    play_until_an_obstacle(engine, |render_phase| render_phase > 0.0)
}

#[wasm_bindgen_test]
fn a_player_flying_into_an_obstacle_that_is_still_appearing_passes_through_it() {
    // The unfair death this window exists to prevent, across the boundary: an obstacle
    // that appeared a moment ago must not take a life away from a player who was
    // already moving towards that spot. Its spawn animation is the warning, and until
    // that animation is over the player flies straight through.
    let mut engine = engine_with_player_in_the_middle();
    let appearing = play_until_an_obstacle_appears(&mut engine);

    assert!(!appearing.is_empty(), "no obstacle appeared to fly into");

    let target_x = (appearing[0] + appearing[2]) / 2.0;
    let target_y = (appearing[1] + appearing[3]) / 2.0;

    // Straight at the middle of it, from far enough out that the swept move covers the
    // whole obstacle. It is the only one in the world this early.
    let frame = engine.tick(target_x - 200.0, target_y, target_x, target_y);

    assert!(
        !frame.obstacle_hit(),
        "an obstacle that is still appearing must not cost a life"
    );
    assert_eq!(frame.player_x(), target_x);
    assert_eq!(frame.player_y(), target_y);
}

#[wasm_bindgen_test]
fn a_player_walking_into_an_obstacle_is_blocked_and_told_which_way_to_slide() {
    // The one path that exercises the whole player-collision contract across the
    // boundary: walking the player straight at the centre of a standing obstacle.
    let mut engine = engine_with_player_in_the_middle();
    let obstacle = play_until_a_solid_obstacle_exists(&mut engine);

    assert!(
        !obstacle.is_empty(),
        "no solid obstacle appeared to walk into"
    );

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

#[wasm_bindgen_test]
fn hitting_an_obstacle_lights_its_flash_in_the_buffer() {
    // The signal the renderer draws the red flash from. It travels in the obstacle
    // buffer rather than in a field of its own, so it is checked there.
    let mut engine = engine_with_player_in_the_middle();
    let obstacle = play_until_a_solid_obstacle_exists(&mut engine);

    assert!(
        !obstacle.is_empty(),
        "no solid obstacle appeared to walk into"
    );

    let target_x = (obstacle[0] + obstacle[2]) / 2.0;
    let target_y = (obstacle[1] + obstacle[3]) / 2.0;

    let frame = engine.tick(target_x - 200.0, target_y, target_x, target_y);
    let obstacles = frame.obstacles().to_vec();
    let mut brightest_flash = 0.0_f32;

    for index in 0..frame.obstacle_count() as usize {
        let flash = obstacles[index * OBSTACLE_STRIDE as usize + 6];
        assert!(
            (0.0..=1.0).contains(&flash),
            "hit flash out of range: {flash}"
        );
        if flash > brightest_flash {
            brightest_flash = flash;
        }
    }

    assert!(
        brightest_flash > 0.0,
        "the obstacle that was hit has to glow"
    );
}

#[wasm_bindgen_test]
fn a_player_pushed_off_an_obstacle_can_walk_away_from_it_again() {
    // The regression test for getting stuck. The player used to be placed exactly on
    // the surface, which the next step read as another collision and corrected back —
    // so a move leading away from the obstacle never took effect.
    let mut engine = engine_with_player_in_the_middle();
    let obstacle = play_until_a_solid_obstacle_exists(&mut engine);

    assert!(
        !obstacle.is_empty(),
        "no solid obstacle appeared to walk into"
    );

    let target_x = (obstacle[0] + obstacle[2]) / 2.0;
    let target_y = (obstacle[1] + obstacle[3]) / 2.0;

    // A dash-length move straight through the middle of it, which is the case that got
    // stuck the most reliably.
    let blocked = engine.tick(target_x - 30.0, target_y, target_x + 30.0, target_y);
    let pushed_x = blocked.player_x();
    let pushed_y = blocked.player_y();

    assert!(blocked.obstacle_hit());

    // A step straight back out along the normal the engine reported, which is the
    // direction it just pushed the player in.
    let away_x = pushed_x + blocked.block_normal_x() * 6.0;
    let away_y = pushed_y + blocked.block_normal_y() * 6.0;
    let leaving = engine.tick(pushed_x, pushed_y, away_x, away_y);

    assert!(
        !leaving.obstacle_hit(),
        "walking away from an obstacle must not count as hitting it"
    );
    assert_eq!(leaving.player_x(), away_x);
    assert_eq!(leaving.player_y(), away_y);
}
