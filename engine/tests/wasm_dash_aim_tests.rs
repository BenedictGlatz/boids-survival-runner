//! WASM boundary contract for the dash warning lines.
//! Run with: wasm-pack test --headless --firefox
//!
//! `cargo test` reports **0 tests** for this file — `#[wasm_bindgen_test]` expands to nothing
//! on the host target, and the getters return `js_sys::Float32Array`, which only exists
//! inside a JavaScript runtime. A green `cargo test` therefore says nothing about anything
//! asserted below.
//!
//! What the contract says: one entry of `DASH_AIM_STRIDE` floats per **charging** boid,
//! `[start_x, start_y, end_x, end_y, charge_progress]`, carrying its own position because it
//! is not index-aligned with the boid buffers. The line runs from the boid to where its dash
//! would end if it launched in this very step.
//!
//! Two properties are what the feature is actually about, and both are asserted here rather
//! than left to the eye: an entry exists for exactly as long as the boid's pulse does — it
//! appears with the charge-up and is gone on the launch step — and the line is as long as
//! the dash carries. A file of its own because `wasm_tests.rs` covers the four index-aligned
//! buffers and would pass the project's length limit if it took this too.

mod common;

use common::{advance_to_wave, engine_with_player_in_the_middle, WORLD_HEIGHT, WORLD_WIDTH};
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// Values per warning line. Duplicated from the engine and from the frontend's
/// `DASH_AIM_STRIDE` on purpose: a test that read the real constant would follow a change to
/// it silently instead of reporting that the boundary moved.
const DASH_AIM_STRIDE: u32 = 5;

/// Where the player stands for every tick below — the middle of the world.
const PLAYER_X: f32 = WORLD_WIDTH as f32 / 2.0;
const PLAYER_Y: f32 = WORLD_HEIGHT as f32 / 2.0;

#[wasm_bindgen_test]
fn the_dash_aim_buffer_holds_five_values_per_line() {
    let mut engine = engine_with_player_in_the_middle();
    advance_to_wave(&mut engine, 5);

    for _ in 0..400 {
        let frame = engine.tick(PLAYER_X, PLAYER_Y, PLAYER_X, PLAYER_Y);

        assert_eq!(
            frame.dash_aims().length(),
            frame.dash_aim_count() * DASH_AIM_STRIDE,
            "one five-float line per counted aim"
        );
    }
}

#[wasm_bindgen_test]
fn the_first_two_waves_announce_no_dash_at_all() {
    // Boids only gain the dash from the third wave on, so there is nothing to warn about
    // and the buffer stays empty — the same statement `nothing_pulses_while_no_boid_is_
    // allowed_to_dash` makes about the pulse.
    let mut engine = engine_with_player_in_the_middle();
    advance_to_wave(&mut engine, 2);

    for _ in 0..240 {
        let frame = engine.tick(PLAYER_X, PLAYER_Y, PLAYER_X, PLAYER_Y);

        assert_eq!(frame.dash_aim_count(), 0);
        assert_eq!(frame.dash_aims().length(), 0);
    }
}

#[wasm_bindgen_test]
fn a_line_exists_for_exactly_as_long_as_the_pulse_does() {
    // The whole timing of the feature in one assertion: the line appears when the boid
    // starts pulsing and is gone the moment it launches. A charging boid is the one with a
    // positive dash phase, so counting those is counting the lines there have to be.
    let mut engine = engine_with_player_in_the_middle();
    advance_to_wave(&mut engine, 5);
    let mut saw_a_line = false;

    for _ in 0..600 {
        let frame = engine.tick(PLAYER_X, PLAYER_Y, PLAYER_X, PLAYER_Y);
        let charging = frame
            .dash_phases()
            .to_vec()
            .iter()
            .filter(|phase| **phase > 0.0)
            .count() as u32;

        assert_eq!(
            frame.dash_aim_count(),
            charging,
            "one line per charging boid, and none for a boid already dashing"
        );

        if charging > 0 {
            saw_a_line = true;
        }
    }

    assert!(saw_a_line, "a high-tier flock has to charge at some point");
}

#[wasm_bindgen_test]
fn every_line_starts_at_a_boid_and_carries_a_charge_progress() {
    let mut engine = engine_with_player_in_the_middle();
    advance_to_wave(&mut engine, 5);
    let mut checked_a_line = false;

    for _ in 0..600 {
        let frame = engine.tick(PLAYER_X, PLAYER_Y, PLAYER_X, PLAYER_Y);
        let positions = frame.positions().to_vec();
        let aims = frame.dash_aims().to_vec();

        for line in aims.chunks(DASH_AIM_STRIDE as usize) {
            let (start_x, start_y, progress) = (line[0], line[1], line[4]);

            // The buffer is not index-aligned, so the start point is the only thing tying
            // a line back to its boid. If the stride were off by one, this is what fails.
            let sits_on_a_boid = positions
                .chunks(2)
                .any(|boid| boid[0] == start_x && boid[1] == start_y);
            assert!(sits_on_a_boid, "a line has to start at a boid");

            // The renderer fades the line up by this value, so anything outside (0, 1)
            // would either draw nothing or draw a line at more than full opacity.
            assert!(
                progress > 0.0 && progress < 1.0,
                "charge progress out of range: {progress}"
            );

            checked_a_line = true;
        }
    }

    assert!(checked_a_line, "no line was ever announced to check");
}

#[wasm_bindgen_test]
fn a_line_is_as_long_as_the_dash_carries() {
    // The player's own dash covers about 260 px and a boid's between 220 and 280, so a line
    // shorter than a boid or longer than the world would be a broken direction or a broken
    // distance rather than a tuning value. Every line of one wave is the same length, since
    // only the boids of that wave can dash and they share a tier — asserted below, because
    // it is what a mixed-up start and end point would break.
    let mut engine = engine_with_player_in_the_middle();
    advance_to_wave(&mut engine, 3);
    let world_diagonal = ((WORLD_WIDTH * WORLD_WIDTH + WORLD_HEIGHT * WORLD_HEIGHT) as f32).sqrt();
    let mut first_length: Option<f32> = None;

    for _ in 0..600 {
        let frame = engine.tick(PLAYER_X, PLAYER_Y, PLAYER_X, PLAYER_Y);

        for line in frame.dash_aims().to_vec().chunks(DASH_AIM_STRIDE as usize) {
            let length = ((line[2] - line[0]).powi(2) + (line[3] - line[1]).powi(2)).sqrt();

            assert!(
                length > 50.0 && length < world_diagonal,
                "aim line length out of range: {length}"
            );

            match first_length {
                None => first_length = Some(length),
                Some(expected) => assert!(
                    (length - expected).abs() < 0.5,
                    "boids of one wave dash equally far: {length} vs {expected}"
                ),
            }
        }
    }

    assert!(
        first_length.is_some(),
        "no line was ever announced to check"
    );
}

#[wasm_bindgen_test]
fn a_snapshot_keeps_the_lines_of_the_frozen_frame() {
    // The frontend draws a snapshot while the world is deliberately held still — the
    // countdown, a death, a pause. A snapshot is handed no player position, so the lines are
    // measured against the last tick's; they must not vanish just because nothing moved.
    let mut engine = engine_with_player_in_the_middle();
    advance_to_wave(&mut engine, 5);

    for _ in 0..600 {
        let ticked = engine.tick(PLAYER_X, PLAYER_Y, PLAYER_X, PLAYER_Y);
        if ticked.dash_aim_count() == 0 {
            continue;
        }

        let lines = ticked.dash_aims().to_vec();
        let frozen = engine.snapshot();

        assert_eq!(frozen.dash_aim_count(), ticked.dash_aim_count());
        assert_eq!(frozen.dash_aims().to_vec(), lines);
        return;
    }

    panic!("no line was ever announced to freeze");
}
