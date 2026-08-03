//! Which part of the world border a wave arrives through, and which way its boids fly in.
//!
//! Only geometry: nothing here knows about timing, boids or the flock. The counterpart is
//! `wave_spawn.rs`, which owns the warning window, and the split is the same one the
//! obstacles use between `obstacle_spawn.rs` and `obstacle_field.rs` — placement can be
//! tested against hand-picked player positions without a simulation running. The border
//! itself is `world_edge.rs`.
//!
//! Everything is derived from the wave number, so the same wave always arrives through the
//! same gates. There is no `rand` dependency in this engine and there must not be one; the
//! stand-in is the same integer hash the obstacle spawn uses.

use super::world_edge::{perimeter_position, safe_spawn_distance, world_perimeter};
use crate::constants::{
    WAVE_SPAWN_GATE_COUNT, WAVE_SPAWN_GATE_PLACEMENT_ATTEMPTS, WAVE_SPAWN_GATE_SPREAD,
    WAVE_SPAWN_LATERAL_SHARE,
};
use crate::math::vector::Vec2;

/// Resolution of the per-wave rotation, in steps around the perimeter.
const ROTATION_STEPS: u64 = 1000;

/// A large prime, for the same reason `obstacle_spawn.rs` uses one: with a small
/// multiplier the product stays below `ROTATION_STEPS` for the first few waves, so the
/// early waves would all arrive through the same corner of the world.
const WAVE_ROTATION_MULTIPLIER: u64 = 7919;
const WAVE_ROTATION_OFFSET: u64 = 104_729;

/// Where one of a wave's gates opens, as a distance around the perimeter.
///
/// The wave decides the rotation and the gate index spreads the gates evenly around it, so
/// two gates of the same wave start out a third of the border apart. From there the gate is
/// nudged along the edge until it clears the player — the case that needs it is a player
/// standing right against a wall, where a gate would otherwise open under their feet, which
/// is the one thing a warning cannot make fair.
///
/// A nudged gate can end up near its neighbour, since the nudge step and the gate spacing
/// are unrelated. That is accepted rather than prevented: the player can only be standing
/// next to one gate at a time, so at most one gate ever moves, and two gates close together
/// is a denser arrival rather than an unfair one.
pub fn gate_perimeter_offset(
    wave: u32,
    gate_index: u32,
    world_width: f32,
    world_height: f32,
    player_position: Vec2,
) -> f32 {
    let perimeter = world_perimeter(world_width, world_height);
    let safe_distance = safe_spawn_distance(world_width, world_height);
    let gate_share = gate_index as f32 / WAVE_SPAWN_GATE_COUNT.max(1) as f32;
    let base_offset = (wave_rotation(wave) + gate_share) * perimeter;

    let attempts = WAVE_SPAWN_GATE_PLACEMENT_ATTEMPTS.max(1);
    let nudge = perimeter / attempts as f32;
    let mut best_offset = base_offset;
    let mut best_distance = -1.0;

    for attempt in 0..attempts {
        let offset = base_offset + attempt as f32 * nudge;
        let distance =
            perimeter_position(offset, world_width, world_height).distance_to(player_position);

        if distance >= safe_distance {
            return offset;
        }

        if distance > best_distance {
            best_distance = distance;
            best_offset = offset;
        }
    }

    // No point on the border is far enough away, which means the world is smaller than the
    // safe distance. The furthest point is then the fairest gate there is.
    best_offset
}

/// Where one boid of a gate enters the world.
///
/// The slots are spread symmetrically around the gate, so the gate's own offset stays the
/// midpoint of everything that comes out of it. A gate with a single slot puts that boid
/// exactly on the offset rather than off to one side.
pub fn gate_spawn_position(
    gate_offset: f32,
    slot: u32,
    slots_in_gate: u32,
    world_width: f32,
    world_height: f32,
) -> Vec2 {
    let share = if slots_in_gate <= 1 {
        0.0
    } else {
        slot as f32 / (slots_in_gate - 1) as f32 - 0.5
    };

    perimeter_position(
        gate_offset + share * WAVE_SPAWN_GATE_SPREAD,
        world_width,
        world_height,
    )
}

/// The velocity a boid enters the world with: into the arena, bent a little to one side.
///
/// Straight at the world centre is what makes an arriving boid read as coming *in* rather
/// than having always been there. The sideways bend alternates with the slot, so a gate fans
/// its group out instead of firing a column.
pub fn inward_velocity(
    position: Vec2,
    slot: u32,
    speed: f32,
    world_width: f32,
    world_height: f32,
) -> Vec2 {
    let world_centre = Vec2::new(world_width * 0.5, world_height * 0.5);
    let inward = world_centre.sub(position).normalize();

    // A boid dropped exactly on the world centre has no direction to fly in. It cannot
    // happen from a gate on the border, but the caller should not have to know that.
    if inward.length_squared() == 0.0 {
        return Vec2::new(speed, 0.0);
    }

    let lateral_share = if slot.is_multiple_of(2) {
        WAVE_SPAWN_LATERAL_SHARE
    } else {
        -WAVE_SPAWN_LATERAL_SHARE
    };

    inward
        .add(inward.perp().scale(lateral_share))
        .normalize()
        .scale(speed)
}

/// Turns a wave number into a fraction of one trip around the perimeter.
fn wave_rotation(wave: u32) -> f32 {
    let steps = (wave as u64 * WAVE_ROTATION_MULTIPLIER + WAVE_ROTATION_OFFSET) % ROTATION_STEPS;

    steps as f32 / ROTATION_STEPS as f32
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::constants::WAVE_SPAWN_EDGE_INSET;

    const WORLD_WIDTH: f32 = 1920.0;
    const WORLD_HEIGHT: f32 = 1080.0;
    const CENTRE: Vec2 = Vec2 { x: 960.0, y: 540.0 };

    fn is_on_the_border(point: Vec2) -> bool {
        let inset = WAVE_SPAWN_EDGE_INSET;
        let on_vertical_edge =
            (point.x - inset).abs() < 1e-3 || (point.x - (WORLD_WIDTH - inset)).abs() < 1e-3;
        let on_horizontal_edge =
            (point.y - inset).abs() < 1e-3 || (point.y - (WORLD_HEIGHT - inset)).abs() < 1e-3;

        on_vertical_edge || on_horizontal_edge
    }

    #[test]
    fn the_same_wave_always_opens_the_same_gates() {
        // Determinism is the reason this engine has no random number generator. It matters
        // twice over here: the marker the player sees and the boid that arrives are two
        // separate calls, so a wave that moved between them would announce the wrong place.
        for gate_index in 0..WAVE_SPAWN_GATE_COUNT {
            let first = gate_perimeter_offset(6, gate_index, WORLD_WIDTH, WORLD_HEIGHT, CENTRE);
            let again = gate_perimeter_offset(6, gate_index, WORLD_WIDTH, WORLD_HEIGHT, CENTRE);

            assert_eq!(first, again);
        }
    }

    #[test]
    fn different_waves_arrive_from_different_places() {
        let sixth = gate_perimeter_offset(6, 0, WORLD_WIDTH, WORLD_HEIGHT, CENTRE);
        let seventh = gate_perimeter_offset(7, 0, WORLD_WIDTH, WORLD_HEIGHT, CENTRE);

        assert_ne!(sixth, seventh);
    }

    #[test]
    fn early_waves_are_spread_around_the_world_rather_than_bunched_in_one_corner() {
        // The failure the obstacle spawn already ran into once: with a small multiplier the
        // hash stays below its modulus for the first few seeds, so every early wave would
        // arrive through the same edge and the feature would look broken exactly where a
        // player meets it first.
        let mut saw_top = false;
        let mut saw_bottom = false;
        let mut saw_left = false;
        let mut saw_right = false;

        for wave in 2..12 {
            for gate_index in 0..WAVE_SPAWN_GATE_COUNT {
                let offset =
                    gate_perimeter_offset(wave, gate_index, WORLD_WIDTH, WORLD_HEIGHT, CENTRE);
                let gate = perimeter_position(offset, WORLD_WIDTH, WORLD_HEIGHT);

                if gate.y <= WAVE_SPAWN_EDGE_INSET {
                    saw_top = true;
                }
                if gate.y >= WORLD_HEIGHT - WAVE_SPAWN_EDGE_INSET {
                    saw_bottom = true;
                }
                if gate.x <= WAVE_SPAWN_EDGE_INSET {
                    saw_left = true;
                }
                if gate.x >= WORLD_WIDTH - WAVE_SPAWN_EDGE_INSET {
                    saw_right = true;
                }
            }
        }

        assert!(saw_top && saw_bottom && saw_left && saw_right);
    }

    #[test]
    fn the_gates_of_one_wave_are_spread_around_the_border() {
        // Three gates in the same spot would be one gate, and the player could sit out the
        // whole wave on the far side of the arena.
        let perimeter = world_perimeter(WORLD_WIDTH, WORLD_HEIGHT);
        let mut offsets = Vec::new();

        for gate_index in 0..WAVE_SPAWN_GATE_COUNT {
            offsets.push(
                gate_perimeter_offset(4, gate_index, WORLD_WIDTH, WORLD_HEIGHT, CENTRE)
                    .rem_euclid(perimeter),
            );
        }

        for (index, first) in offsets.iter().enumerate() {
            for second in &offsets[index + 1..] {
                let gap = (first - second)
                    .abs()
                    .min(perimeter - (first - second).abs());

                assert!(gap > WAVE_SPAWN_GATE_SPREAD, "two gates only {gap} apart");
            }
        }
    }

    #[test]
    fn a_gate_keeps_its_distance_from_a_player_pressed_against_a_wall() {
        // The reason the nudging exists. A player in the middle of the arena is always
        // clear of the border; a player in a corner is what breaks a fixed gate.
        let safe_distance = safe_spawn_distance(WORLD_WIDTH, WORLD_HEIGHT);
        let wall_positions = [
            Vec2::new(0.0, 0.0),
            Vec2::new(WORLD_WIDTH, 0.0),
            Vec2::new(0.0, WORLD_HEIGHT),
            Vec2::new(WORLD_WIDTH, WORLD_HEIGHT),
            Vec2::new(WORLD_WIDTH * 0.5, 0.0),
            Vec2::new(0.0, WORLD_HEIGHT * 0.5),
        ];

        for player_position in wall_positions {
            for wave in 2..40 {
                for gate_index in 0..WAVE_SPAWN_GATE_COUNT {
                    let offset = gate_perimeter_offset(
                        wave,
                        gate_index,
                        WORLD_WIDTH,
                        WORLD_HEIGHT,
                        player_position,
                    );
                    let gate = perimeter_position(offset, WORLD_WIDTH, WORLD_HEIGHT);

                    assert!(
                        gate.distance_to(player_position) >= safe_distance,
                        "wave {wave} gate {gate_index} opened {} from a player at {player_position:?}",
                        gate.distance_to(player_position)
                    );
                }
            }
        }
    }

    #[test]
    fn every_slot_of_a_gate_still_lands_on_the_border() {
        // The spread runs *along* the perimeter, so it may round a corner but must never
        // leave the edge.
        let offset = gate_perimeter_offset(5, 1, WORLD_WIDTH, WORLD_HEIGHT, CENTRE);

        for slot in 0..6 {
            let position = gate_spawn_position(offset, slot, 6, WORLD_WIDTH, WORLD_HEIGHT);

            assert!(is_on_the_border(position), "slot {slot} at {position:?}");
        }
    }

    #[test]
    fn the_slots_of_a_gate_are_spread_out_rather_than_stacked() {
        let offset = gate_perimeter_offset(5, 0, WORLD_WIDTH, WORLD_HEIGHT, CENTRE);
        let first = gate_spawn_position(offset, 0, 4, WORLD_WIDTH, WORLD_HEIGHT);
        let last = gate_spawn_position(offset, 3, 4, WORLD_WIDTH, WORLD_HEIGHT);

        assert!(first.distance_to(last) > WAVE_SPAWN_GATE_SPREAD * 0.5);
    }

    #[test]
    fn a_single_slot_sits_exactly_on_its_gate() {
        let offset = gate_perimeter_offset(5, 0, WORLD_WIDTH, WORLD_HEIGHT, CENTRE);
        let gate = perimeter_position(offset, WORLD_WIDTH, WORLD_HEIGHT);
        let only_slot = gate_spawn_position(offset, 0, 1, WORLD_WIDTH, WORLD_HEIGHT);

        assert_eq!(gate, only_slot);
    }

    #[test]
    fn a_boid_entering_from_any_edge_flies_towards_the_arena() {
        // The test that would catch a sign error in the launch direction: a boid aimed
        // outwards leaves through the border it just came in at.
        let perimeter = world_perimeter(WORLD_WIDTH, WORLD_HEIGHT);

        for step in 0..200 {
            let position =
                perimeter_position(step as f32 / 200.0 * perimeter, WORLD_WIDTH, WORLD_HEIGHT);
            let velocity = inward_velocity(position, step, 4.0, WORLD_WIDTH, WORLD_HEIGHT);
            let towards_centre = CENTRE.sub(position).normalize();

            assert!(
                velocity.normalize().dot(towards_centre) > 0.0,
                "a boid at {position:?} was launched away from the arena"
            );
        }
    }

    #[test]
    fn the_launch_speed_is_what_the_caller_asked_for() {
        let position = perimeter_position(120.0, WORLD_WIDTH, WORLD_HEIGHT);
        let velocity = inward_velocity(position, 0, 4.0, WORLD_WIDTH, WORLD_HEIGHT);

        assert!((velocity.length() - 4.0).abs() < 1e-4);
    }

    #[test]
    fn neighbouring_slots_fan_out_to_opposite_sides() {
        let position = perimeter_position(500.0, WORLD_WIDTH, WORLD_HEIGHT);
        let even = inward_velocity(position, 0, 4.0, WORLD_WIDTH, WORLD_HEIGHT);
        let odd = inward_velocity(position, 1, 4.0, WORLD_WIDTH, WORLD_HEIGHT);
        let towards_centre = CENTRE.sub(position).normalize();

        // Opposite sides of the line into the arena, which the cross product's sign is.
        assert!(towards_centre.cross(even) * towards_centre.cross(odd) < 0.0);
    }
}
