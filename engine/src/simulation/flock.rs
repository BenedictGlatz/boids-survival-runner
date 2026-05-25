use super::boid::Boid;
use super::physics::{aabb_overlap, clamp_force, integrate};
use super::rules::{alignment, cohesion, seek_target, separation};
use crate::constants::{
    BOID_COLLISION_RADIUS, BOID_OVERLAP_RELAXATION_STEPS, PLAYER_COLLISION_RADIUS,
};
use crate::math::vector::Vec2;

/// Manages the collection of all active boids.
pub struct Flock {
    pub boids: Vec<Boid>,
}

impl Flock {
    pub fn new() -> Self {
        Self { boids: Vec::new() }
    }

    pub fn add(&mut self, boid: Boid) {
        self.boids.push(boid);
    }

    pub fn len(&self) -> usize {
        self.boids.len()
    }

    pub fn update(&mut self, player_position: Vec2, world_width: f32, world_height: f32) -> u32 {
        let snapshot = self.boids.clone();

        for boid in &mut self.boids {
            // Read all steering rules from the same snapshot so every boid reacts to
            // the previous frame, not to neighbours that were already updated.
            let separation_force =
                separation(boid, &snapshot).scale(boid.properties.separation_weight);
            let alignment_force =
                alignment(boid, &snapshot).scale(boid.properties.alignment_weight);
            let cohesion_force = cohesion(boid, &snapshot).scale(boid.properties.cohesion_weight);
            let target_force =
                seek_target(boid, player_position).scale(boid.properties.target_seek_weight);

            let steering = separation_force
                .add(alignment_force)
                .add(cohesion_force)
                .add(target_force);

            boid.acceleration = clamp_force(boid, steering);
            integrate(boid);
            wrap_position(&mut boid.position, world_width, world_height);
        }

        resolve_boid_overlaps(&mut self.boids, world_width, world_height);

        count_player_hits(&self.boids, player_position)
    }
}

fn count_player_hits(boids: &[Boid], player_position: Vec2) -> u32 {
    let mut hit_count = 0;

    for boid in boids {
        if aabb_overlap(boid.position, player_position, PLAYER_COLLISION_RADIUS) {
            hit_count += 1;
        }
    }

    hit_count
}

fn resolve_boid_overlaps(boids: &mut [Boid], world_width: f32, world_height: f32) {
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
                let correction = direction.scale((minimum_distance - distance) * 0.5);

                first_boid.position = first_boid.position.add(correction);
                second_boid.position = second_boid.position.sub(correction);
                wrap_position(&mut first_boid.position, world_width, world_height);
                wrap_position(&mut second_boid.position, world_width, world_height);
            }
        }
    }
}

fn fallback_overlap_direction(first_index: usize, second_index: usize) -> Vec2 {
    match (first_index + second_index) % 4 {
        0 => Vec2::new(1.0, 0.0),
        1 => Vec2::new(0.0, 1.0),
        2 => Vec2::new(-1.0, 0.0),
        _ => Vec2::new(0.0, -1.0),
    }
}

fn wrap_position(position: &mut Vec2, world_width: f32, world_height: f32) {
    if world_width <= 0.0 || world_height <= 0.0 {
        return;
    }

    if position.x < 0.0 {
        position.x += world_width;
    } else if position.x > world_width {
        position.x -= world_width;
    }

    if position.y < 0.0 {
        position.y += world_height;
    } else if position.y > world_height {
        position.y -= world_height;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::simulation::boid::BoidProperties;

    #[test]
    fn update_reports_player_collisions() {
        let mut flock = Flock::new();
        flock.add(Boid::with_properties(
            Vec2::new(50.0, 50.0),
            Vec2::zero(),
            BoidProperties {
                max_acceleration: 0.0,
                target_seek_weight: 0.0,
                ..BoidProperties::default()
            },
        ));

        let hit_count = flock.update(Vec2::new(55.0, 50.0), 100.0, 100.0);

        assert_eq!(hit_count, 1);
    }

    #[test]
    fn update_wraps_boids_at_world_edges() {
        let mut flock = Flock::new();
        flock.add(Boid::with_properties(
            Vec2::new(99.0, 40.0),
            Vec2::new(4.0, 0.0),
            BoidProperties {
                max_speed: 4.0,
                max_acceleration: 0.0,
                target_seek_weight: 0.0,
                ..BoidProperties::default()
            },
        ));

        flock.update(Vec2::new(50.0, 50.0), 100.0, 100.0);

        assert_eq!(flock.boids[0].position, Vec2::new(3.0, 40.0));
    }

    #[test]
    fn update_steers_boids_toward_the_player() {
        let mut flock = Flock::new();
        flock.add(Boid::with_properties(
            Vec2::new(10.0, 50.0),
            Vec2::zero(),
            BoidProperties {
                max_speed: 4.0,
                max_acceleration: 1.0,
                perception_radius: 0.0,
                separation_weight: 0.0,
                alignment_weight: 0.0,
                cohesion_weight: 0.0,
                target_seek_weight: 1.0,
            },
        ));

        flock.update(Vec2::new(90.0, 50.0), 100.0, 100.0);

        assert!(flock.boids[0].velocity.x > 0.0);
        assert!(flock.boids[0].position.x > 10.0);
    }

    #[test]
    fn update_separates_overlapping_boids() {
        let mut flock = Flock::new();
        let stationary_properties = BoidProperties {
            max_speed: 0.0,
            max_acceleration: 0.0,
            perception_radius: 0.0,
            separation_weight: 0.0,
            alignment_weight: 0.0,
            cohesion_weight: 0.0,
            target_seek_weight: 0.0,
        };

        flock.add(Boid::with_properties(
            Vec2::new(50.0, 50.0),
            Vec2::zero(),
            stationary_properties,
        ));
        flock.add(Boid::with_properties(
            Vec2::new(50.0, 50.0),
            Vec2::zero(),
            stationary_properties,
        ));

        flock.update(Vec2::new(90.0, 90.0), 100.0, 100.0);

        let distance = flock.boids[0].position.distance_to(flock.boids[1].position);
        assert!(distance >= BOID_COLLISION_RADIUS * 2.0);
    }
}
