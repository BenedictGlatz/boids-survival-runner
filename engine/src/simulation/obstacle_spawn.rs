use super::obstacle::Obstacle;
use crate::constants::{
    MINIMUM_CORRIDOR_WIDTH, MINIMUM_OBSTACLE_BAR_LENGTH, MINIMUM_OBSTACLE_CIRCLE_RADIUS,
    MINIMUM_OBSTACLE_RADIUS, OBSTACLE_BAR_LENGTH_RANGE, OBSTACLE_BAR_RADIUS,
    OBSTACLE_CIRCLE_EVERY_NTH, OBSTACLE_CIRCLE_RADIUS_RANGE, OBSTACLE_ORIENTATION_COUNT,
};
use crate::math::vector::Vec2;
use std::f32::consts::PI;

// Placing an obstacle. Two halves, deliberately kept apart: building a candidate is
// where the pseudo-randomness lives, and accepting one is where the rule that no
// dead end can ever form lives. Keeping them separate is what lets the acceptance
// rule be tested against hand-built obstacles rather than only against whatever the
// seed happened to produce.
//
// There is no `rand` dependency in this engine and there must not be one: the whole
// simulation has to replay identically from the same step counter. The stand-in is
// the same integer hash the dash selection uses.

const SPAWN_ROUND_MULTIPLIER: u64 = 1009;
const SPAWN_ATTEMPT_MULTIPLIER: u64 = 31;

/// Resolution of the size and position spread, in steps across the available range.
const SPREAD_STEPS: u64 = 1000;

// One multiplier and one offset per derived property, so shape, position, size and
// orientation do not move in lockstep as the round counter advances.
//
// The multipliers are large primes rather than the small ones the dash selection gets
// away with, and that matters more than it looks. With a small multiplier the product
// stays below `SPREAD_STEPS` for the first few seeds, so the remainder is simply the
// product itself: the first spawn rounds would all land in the same corner of the
// world, and every one of them would be rejected for sitting too close to an edge —
// no obstacle would appear at all for the first minute of play. A multiplier far
// larger than `SPREAD_STEPS` makes the remainder wrap many times over even for a seed
// of one, which is what spreads the early rounds across the whole world.
const HORIZONTAL_SPREAD_MULTIPLIER: u64 = 7919;
const VERTICAL_SPREAD_MULTIPLIER: u64 = 6997;
const SIZE_SPREAD_MULTIPLIER: u64 = 5381;
const ORIENTATION_SPREAD_MULTIPLIER: u64 = 3571;
const HORIZONTAL_OFFSET: u64 = 104_729;
const VERTICAL_OFFSET: u64 = 57_193;
const SIZE_OFFSET: u64 = 30_011;
const ORIENTATION_OFFSET: u64 = 14_407;

/// Builds one candidate obstacle for a spawn round.
///
/// Every property comes from the same seed but through a different multiplier, so
/// shape, position, size and orientation do not move in lockstep as the round
/// counter advances. The same round and attempt always produce the same obstacle,
/// which is what keeps the simulation reproducible.
pub fn build_spawn_candidate(
    spawn_round: u64,
    attempt: u64,
    world_width: f32,
    world_height: f32,
    lifetime_steps: u32,
) -> Obstacle {
    let seed = spawn_round * SPAWN_ROUND_MULTIPLIER + attempt * SPAWN_ATTEMPT_MULTIPLIER;

    let centre = Vec2::new(
        spread_across(
            seed,
            HORIZONTAL_SPREAD_MULTIPLIER,
            HORIZONTAL_OFFSET,
            world_width,
        ),
        spread_across(
            seed,
            VERTICAL_SPREAD_MULTIPLIER,
            VERTICAL_OFFSET,
            world_height,
        ),
    );
    let size_share = spread_share(seed, SIZE_SPREAD_MULTIPLIER, SIZE_OFFSET);

    if seed.is_multiple_of(OBSTACLE_CIRCLE_EVERY_NTH) {
        let radius = MINIMUM_OBSTACLE_CIRCLE_RADIUS + size_share * OBSTACLE_CIRCLE_RADIUS_RANGE;

        return Obstacle::circle(centre, radius.max(MINIMUM_OBSTACLE_RADIUS), lifetime_steps);
    }

    // A bar long enough to reach two edges could never satisfy the corridor rule, so
    // it is shortened to what the world has room for instead of being rejected over
    // and over. Small windows therefore get short bars rather than no bars at all.
    let longest_that_fits =
        world_width.min(world_height) - 2.0 * MINIMUM_CORRIDOR_WIDTH - 2.0 * OBSTACLE_BAR_RADIUS;
    let length = (MINIMUM_OBSTACLE_BAR_LENGTH + size_share * OBSTACLE_BAR_LENGTH_RANGE)
        .min(longest_that_fits.max(0.0));

    // One of a handful of fixed orientations across a half turn. A bar and the same
    // bar rotated by a full half turn are the same shape, so half a turn is the whole
    // range there is.
    let orientation_index =
        (seed * ORIENTATION_SPREAD_MULTIPLIER + ORIENTATION_OFFSET) % OBSTACLE_ORIENTATION_COUNT;
    let angle = orientation_index as f32 * (PI / OBSTACLE_ORIENTATION_COUNT as f32);
    let half_spine = Vec2::new(angle.cos(), angle.sin()).scale(length * 0.5);

    Obstacle::new(
        centre.sub(half_spine),
        centre.add(half_spine),
        OBSTACLE_BAR_RADIUS.max(MINIMUM_OBSTACLE_RADIUS),
        lifetime_steps,
    )
}

/// Turns a seed into a coordinate spread across a world dimension.
fn spread_across(seed: u64, multiplier: u64, offset: u64, extent: f32) -> f32 {
    if extent <= 0.0 {
        return 0.0;
    }

    let steps = (seed * multiplier + offset) % SPREAD_STEPS;

    steps as f32 / SPREAD_STEPS as f32 * extent
}

/// Turns a seed into a fraction between 0 and 1, used for sizes.
fn spread_share(seed: u64, multiplier: u64, offset: u64) -> f32 {
    let steps = (seed * multiplier + offset) % SPREAD_STEPS;

    steps as f32 / SPREAD_STEPS as f32
}
#[cfg(test)]
mod tests {
    use super::*;

    const WORLD_WIDTH: f32 = 1600.0;
    const WORLD_HEIGHT: f32 = 900.0;
    const LIFETIME: u32 = 1800;

    #[test]
    fn the_same_spawn_round_always_produces_the_same_obstacle() {
        // Determinism is the reason this engine has no random number generator. Two
        // runs of the same round must not diverge.
        let first = build_spawn_candidate(17, 3, WORLD_WIDTH, WORLD_HEIGHT, LIFETIME);
        let again = build_spawn_candidate(17, 3, WORLD_WIDTH, WORLD_HEIGHT, LIFETIME);

        assert_eq!(first.spine_start, again.spine_start);
        assert_eq!(first.spine_end, again.spine_end);
        assert_eq!(first.radius, again.radius);
    }

    #[test]
    fn different_rounds_produce_different_obstacles() {
        let first = build_spawn_candidate(1, 0, WORLD_WIDTH, WORLD_HEIGHT, LIFETIME);
        let later = build_spawn_candidate(2, 0, WORLD_WIDTH, WORLD_HEIGHT, LIFETIME);

        assert_ne!(first.spine_start, later.spine_start);
    }

    #[test]
    fn both_shapes_are_produced() {
        // A run that only ever built bars, or only circles, would satisfy every other
        // test in this file while missing half the feature.
        let mut circles = 0;
        let mut bars = 0;

        for round in 0..60 {
            let candidate = build_spawn_candidate(round, 0, WORLD_WIDTH, WORLD_HEIGHT, LIFETIME);
            if candidate.spine_start == candidate.spine_end {
                circles += 1;
            } else {
                bars += 1;
            }
        }

        assert!(circles > 0);
        assert!(bars > 0);
    }

    #[test]
    fn bars_come_in_more_than_one_orientation() {
        let mut seen_horizontal = false;
        let mut seen_other = false;

        for round in 0..60 {
            let candidate = build_spawn_candidate(round, 0, WORLD_WIDTH, WORLD_HEIGHT, LIFETIME);
            if candidate.spine_start == candidate.spine_end {
                continue;
            }

            if candidate.spine_start.y == candidate.spine_end.y {
                seen_horizontal = true;
            } else {
                seen_other = true;
            }
        }

        assert!(seen_horizontal);
        assert!(seen_other);
    }

    #[test]
    fn a_bar_is_shortened_to_what_a_small_world_has_room_for() {
        // In a small window the full-length bar could never satisfy the corridor rule
        // in either direction, and every spawn round would come up empty.
        let narrow_width = 2.0 * MINIMUM_CORRIDOR_WIDTH + 2.0 * OBSTACLE_BAR_RADIUS + 60.0;

        for round in 0..60 {
            let candidate = build_spawn_candidate(round, 0, narrow_width, narrow_width, LIFETIME);
            let spine_length = candidate.spine_start.distance_to(candidate.spine_end);

            assert!(spine_length <= 60.0 + 1e-3);
        }
    }

    #[test]
    fn a_degenerate_world_does_not_panic() {
        // resize() clamps to at least one pixel, but the spawn code should not rely on a
        // caller elsewhere for that. Whether such a candidate is *accepted* is the
        // placement rule's business and is asserted on there.
        let candidate = build_spawn_candidate(1, 0, 1.0, 1.0, LIFETIME);

        assert!(candidate.radius > 0.0);
        assert!(candidate.spine_start.x.is_finite());
        assert!(candidate.spine_start.y.is_finite());
    }
}
