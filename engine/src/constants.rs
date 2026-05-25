/// Default maximum speed for newly spawned boids (units per frame).
pub const DEFAULT_MAX_SPEED: f32 = 3.7;

/// Default maximum acceleration applied per frame.
pub const DEFAULT_MAX_ACCELERATION: f32 = 0.09;

/// Default radius within which a boid perceives its neighbours.
pub const DEFAULT_PERCEPTION_RADIUS: f32 = 85.0;

/// Default weight applied to the separation steering rule.
pub const DEFAULT_SEPARATION_WEIGHT: f32 = 3.2;

/// Default weight applied to the alignment steering rule.
pub const DEFAULT_ALIGNMENT_WEIGHT: f32 = 0.45;

/// Default weight applied to the cohesion steering rule.
pub const DEFAULT_COHESION_WEIGHT: f32 = 0.18;

/// Default weight applied to steering toward the player.
pub const DEFAULT_TARGET_SEEK_WEIGHT: f32 = 0.22;

/// Number of boids spawned when a new browser game starts.
pub const INITIAL_BOID_COUNT: u32 = 36;

/// Additional boids introduced for each new wave.
pub const WAVE_BOID_INCREMENT: u32 = 12;

/// Maximum difficulty tier used for boid variants and colours.
pub const MAX_BOID_DIFFICULTY_TIER: u32 = 4;

/// Radius used to keep boids from visually stacking on top of each other.
pub const BOID_COLLISION_RADIUS: f32 = 10.0;

/// Number of pairwise passes used to relax overlapping boids each frame.
pub const BOID_OVERLAP_RELAXATION_STEPS: usize = 4;

/// Radius used for player collision checks.
pub const PLAYER_COLLISION_RADIUS: f32 = 14.0;
