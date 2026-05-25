use crate::math::vector::Vec2;
use crate::constants::{MAX_SPEED, MAX_FORCE};
use super::boid::Boid;

/// Applies accumulated acceleration, clamps velocity, and advances the boid position by one step.
pub fn integrate(boid: &mut Boid) {
    boid.velocity = boid.velocity.add(boid.acceleration).limit(MAX_SPEED);
    boid.position = boid.position.add(boid.velocity);
    boid.acceleration = Vec2::zero();
}

/// Returns `true` when the two positions are close enough to be considered a collision.
pub fn aabb_overlap(a: Vec2, b: Vec2, radius: f32) -> bool {
    a.distance_to(b) < radius * 2.0
}

/// Clamps a steering force to `MAX_FORCE`.
pub fn clamp_force(force: Vec2) -> Vec2 {
    force.limit(MAX_FORCE)
}
