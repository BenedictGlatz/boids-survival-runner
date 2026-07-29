use super::dash::{DashProperties, DashState};
use crate::constants::{
    DEFAULT_ALIGNMENT_WEIGHT, DEFAULT_COHESION_WEIGHT, DEFAULT_MAX_ACCELERATION, DEFAULT_MAX_SPEED,
    DEFAULT_PERCEPTION_RADIUS, DEFAULT_SEPARATION_WEIGHT, DEFAULT_TARGET_SEEK_WEIGHT,
};
use crate::math::vector::Vec2;

/// Tunable behaviour values for a single boid.
///
/// Keeping these values on the boid allows different boid variants to share the
/// same flock while still behaving differently.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct BoidProperties {
    pub max_speed: f32,
    pub max_acceleration: f32,
    pub perception_radius: f32,
    pub separation_weight: f32,
    pub alignment_weight: f32,
    pub cohesion_weight: f32,
    pub target_seek_weight: f32,
    /// Dash tuning, grouped in its own struct so all five values stay together.
    pub dash: DashProperties,
}

impl Default for BoidProperties {
    fn default() -> Self {
        Self {
            max_speed: DEFAULT_MAX_SPEED,
            max_acceleration: DEFAULT_MAX_ACCELERATION,
            perception_radius: DEFAULT_PERCEPTION_RADIUS,
            separation_weight: DEFAULT_SEPARATION_WEIGHT,
            alignment_weight: DEFAULT_ALIGNMENT_WEIGHT,
            cohesion_weight: DEFAULT_COHESION_WEIGHT,
            target_seek_weight: DEFAULT_TARGET_SEEK_WEIGHT,
            dash: DashProperties::default(),
        }
    }
}

/// A single simulated entity in the swarm.
#[derive(Debug, Clone, Copy)]
pub struct Boid {
    pub position: Vec2,
    pub velocity: Vec2,
    pub acceleration: Vec2,
    pub properties: BoidProperties,
    pub difficulty_tier: u32,
    /// Which part of the dash cycle this boid is in right now.
    pub dash_state: DashState,
    /// Simulation steps left in the current dash state. Every non-idle state is
    /// simply a countdown, so one counter is enough for all three of them.
    pub dash_state_steps_remaining: u32,
}

impl Boid {
    pub fn new(position: Vec2, velocity: Vec2) -> Self {
        Self::with_properties(position, velocity, BoidProperties::default())
    }

    pub fn with_properties(position: Vec2, velocity: Vec2, properties: BoidProperties) -> Self {
        Self::with_variant(position, velocity, properties, 0)
    }

    pub fn with_variant(
        position: Vec2,
        velocity: Vec2,
        properties: BoidProperties,
        difficulty_tier: u32,
    ) -> Self {
        Self {
            position,
            velocity,
            acceleration: Vec2::zero(),
            properties,
            difficulty_tier,
            dash_state: DashState::Idle,
            dash_state_steps_remaining: 0,
        }
    }

    pub fn close_neighbour_radius(&self) -> f32 {
        self.properties.perception_radius * 0.5
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_uses_default_boid_properties() {
        let boid = Boid::new(Vec2::zero(), Vec2::zero());

        assert_eq!(boid.properties, BoidProperties::default());
    }

    #[test]
    fn with_properties_keeps_custom_values() {
        let properties = BoidProperties {
            max_speed: 7.0,
            max_acceleration: 0.3,
            perception_radius: 90.0,
            separation_weight: 2.0,
            alignment_weight: 0.8,
            cohesion_weight: 1.2,
            target_seek_weight: 0.4,
            ..BoidProperties::default()
        };
        let boid = Boid::with_properties(Vec2::zero(), Vec2::zero(), properties);

        assert_eq!(boid.properties, properties);
        assert_eq!(boid.difficulty_tier, 0);
        assert_eq!(boid.close_neighbour_radius(), 45.0);
    }

    #[test]
    fn with_variant_keeps_difficulty_tier() {
        let boid = Boid::with_variant(Vec2::zero(), Vec2::zero(), BoidProperties::default(), 3);

        assert_eq!(boid.difficulty_tier, 3);
    }
}
