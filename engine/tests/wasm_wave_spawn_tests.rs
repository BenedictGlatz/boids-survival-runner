//! WASM interface contract tests for the wave spawn warning.
//! Run with: wasm-pack test --headless --firefox
//!
//! Split from `wasm_tests.rs` along the same seam the obstacle tests are: the
//! spawn-marker buffer is not index-aligned with the boid buffers, and the whole point
//! of it is that its entries are *not* in the boid buffers yet.
//!
//! What is asserted here is the promise the feature makes to the player:
//!
//!  - announcing a wave puts nothing into the world, only markers on the world edge,
//!  - every marker sits on that edge and keeps the safe distance from the player, even
//!    when the player is pressed into a corner,
//!  - the warning lasts exactly its window — not a step short, not a step long,
//!  - the boids appear where their markers were rather than somewhere else, and
//!  - the markers are gone the moment the boids are there.
//!
//! None of that is reachable from a plain `cargo test`: the buffer getters return
//! `js_sys::Float32Array`, which only exists inside a JavaScript runtime. A green
//! `cargo test` says nothing at all about this file.

mod common;

use common::{
    engine_with_player_in_the_middle, tick_in_place, WAVE_SPAWN_WARNING_STEPS, WORLD_HEIGHT,
    WORLD_WIDTH,
};
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

/// Values per marker in the spawn-marker buffer: `[x, y, warning_progress]`.
/// Duplicated from the engine and the frontend on purpose — the point of a contract
/// test is to fail when one side changes the number without the other.
const SPAWN_MARKER_STRIDE: u32 = 3;

/// The documented floor of the engine's safe spawn distance. The exact value scales with
/// the world size and is crate-private.
const SAFE_SPAWN_DISTANCE: f32 = 180.0;

/// How far off the world edge a marker may sit. The engine pulls a gate a few units
/// inside the border so an arriving boid is drawn whole, so this is that inset plus room
/// for the float arithmetic that got it there — not a tolerance on the rule itself.
const EDGE_TOLERANCE: f32 = 12.0;

fn distance_between(first_x: f32, first_y: f32, second_x: f32, second_y: f32) -> f32 {
    let dx = first_x - second_x;
    let dy = first_y - second_y;

    (dx * dx + dy * dy).sqrt()
}

/// How far a point is from the nearest world edge.
fn distance_to_nearest_edge(x: f32, y: f32) -> f32 {
    let to_left = x;
    let to_right = WORLD_WIDTH as f32 - x;
    let to_top = y;
    let to_bottom = WORLD_HEIGHT as f32 - y;

    to_left.min(to_right).min(to_top).min(to_bottom)
}

#[wasm_bindgen_test]
fn a_fresh_world_announces_nothing_and_has_an_empty_marker_buffer() {
    // The first flock is placed straight into the world, so a round opens with no
    // markers at all — and an empty count has to mean an empty buffer, or the renderer
    // would read stale floats.
    let mut engine = engine_with_player_in_the_middle();
    let frame = engine.snapshot();

    assert_eq!(frame.spawn_marker_count(), 0);
    assert_eq!(frame.spawn_markers().length(), 0);
}

#[wasm_bindgen_test]
fn announcing_a_wave_adds_markers_but_no_boids() {
    // The whole guarantee in one test. If `set_wave` still put boids into the world, the
    // markers would be decoration drawn over a spawn that had already happened.
    let mut engine = engine_with_player_in_the_middle();
    let boids_before = engine.snapshot().entity_count();

    engine.set_wave(2, 500.0, 400.0);
    let frame = engine.snapshot();

    assert!(frame.spawn_marker_count() > 0, "the wave was not announced");
    assert_eq!(
        frame.entity_count(),
        boids_before,
        "announcing a wave must not put a boid into the world"
    );
}

#[wasm_bindgen_test]
fn the_marker_buffer_is_packed_the_way_the_renderer_decodes_it() {
    let mut engine = engine_with_player_in_the_middle();
    engine.set_wave(2, 500.0, 400.0);
    let frame = engine.snapshot();

    assert_eq!(
        frame.spawn_markers().length(),
        frame.spawn_marker_count() * SPAWN_MARKER_STRIDE,
        "three values per marker"
    );
}

#[wasm_bindgen_test]
fn every_marker_sits_on_the_world_edge() {
    // "At the screen edge" is the feature, not a detail of it: a marker in the middle of
    // the arena would be a warning the player has to hunt for.
    let mut engine = engine_with_player_in_the_middle();
    engine.set_wave(3, 500.0, 400.0);
    let markers = engine.snapshot().spawn_markers().to_vec();

    assert!(!markers.is_empty(), "the wave was not announced");

    for marker in markers.chunks(SPAWN_MARKER_STRIDE as usize) {
        let gap = distance_to_nearest_edge(marker[0], marker[1]);

        assert!(
            gap <= EDGE_TOLERANCE,
            "a marker at ({}, {}) sits {gap} from the nearest edge",
            marker[0],
            marker[1]
        );
    }
}

#[wasm_bindgen_test]
fn every_marker_keeps_its_distance_from_the_player() {
    // A player standing against a wall is the case this exists for: the gate has to move
    // along the edge rather than open under their feet.
    let mut engine = engine_with_player_in_the_middle();
    let wall_positions = [
        (0.0_f32, 0.0_f32),
        (WORLD_WIDTH as f32, 0.0),
        (0.0, WORLD_HEIGHT as f32),
        (WORLD_WIDTH as f32, WORLD_HEIGHT as f32),
        (WORLD_WIDTH as f32 / 2.0, 0.0),
    ];

    for (wave, (player_x, player_y)) in wall_positions.iter().enumerate() {
        engine.set_wave(wave as u32 + 2, *player_x, *player_y);
        let markers = engine.snapshot().spawn_markers().to_vec();

        assert!(!markers.is_empty(), "wave {wave} was not announced");

        for marker in markers.chunks(SPAWN_MARKER_STRIDE as usize) {
            let distance = distance_between(marker[0], marker[1], *player_x, *player_y);

            assert!(
                distance >= SAFE_SPAWN_DISTANCE,
                "a gate opened {distance} from a player at ({player_x}, {player_y})"
            );
        }

        // Cleared before the next player position, so each one is checked against a wave
        // announced while the player was already standing there.
        tick_in_place(&mut engine, WAVE_SPAWN_WARNING_STEPS);
    }
}

#[wasm_bindgen_test]
fn the_warning_progress_stays_inside_the_range_the_renderer_expects() {
    // The renderer scales the marker's intensity by this number directly, so a value
    // outside `[0, 1)` would draw a glow of the wrong size or an invisible one.
    let mut engine = engine_with_player_in_the_middle();
    engine.set_wave(2, 500.0, 400.0);

    for _ in 0..WAVE_SPAWN_WARNING_STEPS {
        for marker in engine
            .snapshot()
            .spawn_markers()
            .to_vec()
            .chunks(SPAWN_MARKER_STRIDE as usize)
        {
            let progress = marker[2];

            assert!(
                (0.0..1.0).contains(&progress),
                "warning progress out of range: {progress}"
            );
        }

        tick_in_place(&mut engine, 1);
    }
}

#[wasm_bindgen_test]
fn the_warning_progress_climbs_as_the_arrival_approaches() {
    // A progress that never moved would satisfy the range test above while leaving the
    // player no sense of *when* the wave lands.
    let mut engine = engine_with_player_in_the_middle();
    engine.set_wave(2, 500.0, 400.0);
    let at_announcement = engine.snapshot().spawn_markers().to_vec()[2];

    tick_in_place(&mut engine, WAVE_SPAWN_WARNING_STEPS / 2);
    let halfway = engine.snapshot().spawn_markers().to_vec()[2];

    assert_eq!(at_announcement, 0.0, "a fresh gate starts at zero");
    assert!(halfway > at_announcement, "the warning has to progress");
}

#[wasm_bindgen_test]
fn the_wave_arrives_after_exactly_its_warning_window() {
    // The window is the player's reaction time, so it must be neither a step short nor a
    // step long. Both halves are asserted, because a window that never closed would look
    // exactly like a window that closed too late.
    let mut engine = engine_with_player_in_the_middle();
    let boids_before = engine.snapshot().entity_count();

    engine.set_wave(2, 500.0, 400.0);
    tick_in_place(&mut engine, WAVE_SPAWN_WARNING_STEPS - 1);

    assert_eq!(
        engine.snapshot().entity_count(),
        boids_before,
        "the wave arrived a step early"
    );

    tick_in_place(&mut engine, 1);

    assert!(
        engine.snapshot().entity_count() > boids_before,
        "the wave arrived a step late"
    );
}

#[wasm_bindgen_test]
fn the_markers_are_gone_once_the_wave_has_arrived() {
    // The marker buffer says "nothing here yet". A marker left behind after the boid
    // arrived would be a warning about something that is already in the world.
    let mut engine = engine_with_player_in_the_middle();

    engine.set_wave(2, 500.0, 400.0);
    tick_in_place(&mut engine, WAVE_SPAWN_WARNING_STEPS);
    let frame = engine.snapshot();

    assert_eq!(frame.spawn_marker_count(), 0);
    assert_eq!(frame.spawn_markers().length(), 0);
}

#[wasm_bindgen_test]
fn the_boids_appear_where_their_markers_were() {
    // The one assertion that makes the warning honest rather than merely present: a
    // marker somewhere other than the arrival point would be worse than no marker,
    // because the player would dodge the wrong way.
    let mut engine = engine_with_player_in_the_middle();
    let boids_before = engine.snapshot().entity_count() as usize;

    engine.set_wave(2, 500.0, 400.0);
    let markers = engine.snapshot().spawn_markers().to_vec();

    tick_in_place(&mut engine, WAVE_SPAWN_WARNING_STEPS);
    let positions = engine.snapshot().positions().to_vec();
    let arrived = positions.len() / 2 - boids_before;

    assert_eq!(
        arrived,
        markers.len() / SPAWN_MARKER_STRIDE as usize,
        "as many boids arrived as there were markers"
    );

    // The order the queue hands boids out in is the order they were announced in, so
    // marker `i` belongs to the `i`-th boid of the tail. One step of flight has already
    // happened by the time the buffer can be read, hence the small tolerance rather than
    // an exact comparison.
    for marker_index in 0..arrived {
        let marker = &markers[marker_index * SPAWN_MARKER_STRIDE as usize..];
        let boid_index = boids_before + marker_index;
        let drift = distance_between(
            positions[boid_index * 2],
            positions[boid_index * 2 + 1],
            marker[0],
            marker[1],
        );

        assert!(
            drift < 20.0,
            "boid {boid_index} arrived {drift} away from the gate that announced it"
        );
    }
}

#[wasm_bindgen_test]
fn a_wave_the_player_never_ticks_past_stays_out_of_the_world() {
    // The countdown, a pause and the moment after a death all freeze the simulation, and
    // the warning is counted in simulation steps rather than wall time. A frozen world
    // must therefore hold its announcement instead of letting the wave in behind the
    // player's back.
    let mut engine = engine_with_player_in_the_middle();
    let boids_before = engine.snapshot().entity_count();

    engine.set_wave(2, 500.0, 400.0);

    // Reading the frame changes nothing, so a handful of reads is the whole point: the
    // announcement has to survive being looked at without the clock moving.
    for _ in 0..10 {
        let frame = engine.snapshot();

        assert_eq!(frame.entity_count(), boids_before);
        assert!(frame.spawn_marker_count() > 0);
    }
}
