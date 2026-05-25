/// Maximum speed of a single boid (units per frame).
pub const MAX_SPEED: f32 = 4.0;

/// Maximum steering force applied per frame.
pub const MAX_FORCE: f32 = 0.1;

/// Radius within which a boid perceives its neighbours.
pub const PERCEPTION_RADIUS: f32 = 50.0;

/// Weight applied to the separation steering rule.
pub const SEPARATION_WEIGHT: f32 = 1.5;

/// Weight applied to the alignment steering rule.
pub const ALIGNMENT_WEIGHT: f32 = 1.0;

/// Weight applied to the cohesion steering rule.
pub const COHESION_WEIGHT: f32 = 1.0;
