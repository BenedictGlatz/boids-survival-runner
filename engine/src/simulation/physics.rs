use super::boid::Boid;
use crate::math::vector::Vec2;

/// Applies accumulated acceleration, clamps velocity, and advances the boid position by one step.
pub fn integrate(boid: &mut Boid) {
    boid.velocity = boid
        .velocity
        .add(boid.acceleration)
        .limit(boid.properties.max_speed);
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
    fn integrate_uses_the_current_boids_max_speed() {
        let mut boid = Boid::with_properties(
            Vec2::zero(),
            Vec2::new(3.0, 0.0),
            BoidProperties {
                max_speed: 4.0,
                ..BoidProperties::default()
            },
        );
        boid.acceleration = Vec2::new(5.0, 0.0);

        integrate(&mut boid);

        assert_eq!(boid.velocity, Vec2::new(4.0, 0.0));
        assert_eq!(boid.position, Vec2::new(4.0, 0.0));
        assert_eq!(boid.acceleration, Vec2::zero());
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
