use crate::math::vector::Vec2;

/// A single simulated entity in the swarm.
#[derive(Debug, Clone, Copy)]
pub struct Boid {
    pub position: Vec2,
    pub velocity: Vec2,
    pub acceleration: Vec2,
}

impl Boid {
    pub fn new(position: Vec2, velocity: Vec2) -> Self {
        Self {
            position,
            velocity,
            acceleration: Vec2::zero(),
        }
    }
}
