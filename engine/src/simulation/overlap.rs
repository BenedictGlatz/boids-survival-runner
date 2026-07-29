use super::boid::Boid;
use super::dash::is_dashing;
use crate::constants::{BOID_COLLISION_RADIUS, BOID_OVERLAP_RELAXATION_STEPS};
use crate::math::vector::Vec2;

/// Pushes boids apart until none of them visually stack on top of each other.
///
/// This is a purely positional correction and ignores velocity, run as several
/// pairwise passes over the whole flock. It is O(n²) per pass.
pub fn resolve_boid_overlaps(boids: &mut [Boid], world_width: f32, world_height: f32) {
    let minimum_distance = BOID_COLLISION_RADIUS * 2.0;

    for _ in 0..BOID_OVERLAP_RELAXATION_STEPS {
        for first_index in 0..boids.len() {
            for second_index in (first_index + 1)..boids.len() {
                let (left_side, right_side) = boids.split_at_mut(second_index);
                let first_boid = &mut left_side[first_index];
                let second_boid = &mut right_side[0];

                let difference = first_boid.position.sub(second_boid.position);
                let distance = difference.length();

                if distance >= minimum_distance {
                    continue;
                }

                let direction = if distance == 0.0 {
                    fallback_overlap_direction(first_index, second_index)
                } else {
                    difference.scale(1.0 / distance)
                };
                let overlap = minimum_distance - distance;

                // A dashing boid keeps its line: the other boid is pushed out of the
                // way by the whole correction instead of both moving half. Without
                // this a dasher would be nudged sideways on almost every step while
                // crossing the swarm, and its charge would look like it got stuck in
                // traffic. Two dashers meeting share the correction like any pair.
                if is_dashing(first_boid) && !is_dashing(second_boid) {
                    second_boid.position = second_boid.position.sub(direction.scale(overlap));
                } else if is_dashing(second_boid) && !is_dashing(first_boid) {
                    first_boid.position = first_boid.position.add(direction.scale(overlap));
                } else {
                    let correction = direction.scale(overlap * 0.5);
                    first_boid.position = first_boid.position.add(correction);
                    second_boid.position = second_boid.position.sub(correction);
                }

                wrap_position(&mut first_boid.position, world_width, world_height);
                wrap_position(&mut second_boid.position, world_width, world_height);
            }
        }
    }
}

/// Direction used when two boids sit at exactly the same spot, where the
/// difference between them carries no direction at all. Derived from the two
/// indices so the choice stays deterministic instead of needing randomness.
fn fallback_overlap_direction(first_index: usize, second_index: usize) -> Vec2 {
    match (first_index + second_index) % 4 {
        0 => Vec2::new(1.0, 0.0),
        1 => Vec2::new(0.0, 1.0),
        2 => Vec2::new(-1.0, 0.0),
        _ => Vec2::new(0.0, -1.0),
    }
}

/// Moves a position back inside the world, so the world behaves like a torus.
pub fn wrap_position(position: &mut Vec2, world_width: f32, world_height: f32) {
    if world_width <= 0.0 || world_height <= 0.0 {
        return;
    }

    // rem_euclid always lands inside the world, even if one dash step or a stack of
    // overlap corrections moved the boid further than a whole world width. A single
    // add/subtract would leak the boid off-screen in that case.
    position.x = position.x.rem_euclid(world_width);
    position.y = position.y.rem_euclid(world_height);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wrap_position_handles_a_jump_of_more_than_one_world_width() {
        // A single add or subtract would leave this position outside the world.
        let mut position = Vec2::new(250.0, -140.0);

        wrap_position(&mut position, 100.0, 100.0);

        assert_eq!(position, Vec2::new(50.0, 60.0));
    }

    #[test]
    fn wrap_position_leaves_a_zero_sized_world_alone() {
        let mut position = Vec2::new(5.0, 7.0);

        wrap_position(&mut position, 0.0, 0.0);

        assert_eq!(position, Vec2::new(5.0, 7.0));
    }

    #[test]
    fn fallback_overlap_direction_is_always_a_unit_vector() {
        for first_index in 0..4 {
            for second_index in 0..4 {
                let direction = fallback_overlap_direction(first_index, second_index);

                assert_eq!(direction.length(), 1.0);
            }
        }
    }
}
