use super::boid::Boid;
use crate::math::vector::Vec2;

/// Applies accumulated acceleration (from boid rules), clamps velocity, and advances the boid position by one step.
///
/// `speed_limit` is a *speed* cap, not a delta time — the simulation runs on a
/// fixed step and never scales by time. It is passed in because a dashing boid is
/// allowed to move faster than its normal `max_speed` for a few steps.
pub fn integrate(boid: &mut Boid, speed_limit: f32) {
    boid.velocity = boid.velocity.add(boid.acceleration).limit(speed_limit);
    boid.position = boid.position.add(boid.velocity);
    boid.acceleration = Vec2::zero();
}

/// Returns `true` when the two positions are close enough to be considered a collision.
pub fn aabb_overlap(a: Vec2, b: Vec2, radius: f32) -> bool {
    a.distance_to(b) < radius * 2.0
}

/// Clamps a steering force to the current boid's maximum acceleration.
pub fn clamp_force(boid: &Boid, force: Vec2) -> Vec2 {
    force.limit(boid.properties.max_acceleration)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::simulation::boid::BoidProperties;

    #[test]
    fn integrate_clamps_velocity_to_the_speed_limit_it_was_given() {
        let mut boid = Boid::with_properties(
            Vec2::zero(),
            Vec2::new(3.0, 0.0),
            BoidProperties {
                max_speed: 4.0,
                ..BoidProperties::default()
            },
        );
        boid.acceleration = Vec2::new(5.0, 0.0);
        let speed_limit = boid.properties.max_speed;

        integrate(&mut boid, speed_limit);

        assert_eq!(boid.velocity, Vec2::new(4.0, 0.0));
        assert_eq!(boid.position, Vec2::new(4.0, 0.0));
        assert_eq!(boid.acceleration, Vec2::zero());
    }

    #[test]
    fn integrate_allows_a_raised_speed_limit_for_a_dashing_boid() {
        let mut boid = Boid::with_properties(
            Vec2::zero(),
            Vec2::new(12.0, 0.0),
            BoidProperties {
                max_speed: 4.0,
                ..BoidProperties::default()
            },
        );

        // A dash hands in a limit above max_speed, so the boid keeps the speed
        // that its normal cap would have clipped away.
        integrate(&mut boid, 12.0);

        assert_eq!(boid.velocity, Vec2::new(12.0, 0.0));
        assert_eq!(boid.position, Vec2::new(12.0, 0.0));
    }

    #[test]
    fn clamp_force_uses_the_current_boids_max_acceleration() {
        let boid = Boid::with_properties(
            Vec2::zero(),
            Vec2::zero(),
            BoidProperties {
                max_acceleration: 0.5,
                ..BoidProperties::default()
            },
        );
        let force = Vec2::new(2.0, 0.0);

        assert_eq!(clamp_force(&boid, force), Vec2::new(0.5, 0.0));
    }
}
