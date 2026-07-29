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

// ---------------------------------------------------------------------------
// Boid dash
//
// Every duration here is counted in simulation steps, never in milliseconds:
// the engine advances one fixed step per tick() and never scales by delta time.
// At 60 steps per second, 60 steps are one second.
// ---------------------------------------------------------------------------

/// Lowest difficulty tier that is allowed to dash at the player. Tier is one
/// below the wave number, so tier 2 means the dash appears in wave 3 and the
/// first two waves stay a plain swarm the player can learn against.
pub const DASH_UNLOCK_DIFFICULTY_TIER: u32 = 2;

/// Default length of the visible charge-up before a dash (~0.9 seconds). This is
/// the warning the player gets, so it is deliberately the longest phase.
pub const DEFAULT_DASH_CHARGE_STEPS: u32 = 54;

/// Charge-up steps removed for each difficulty tier, so later waves strike faster.
pub const DASH_CHARGE_STEPS_PER_TIER_REDUCTION: u32 = 5;

/// Shortest charge-up ever used. Below this the pulse would flash past before the
/// player could read which boid is about to lunge.
pub const MINIMUM_DASH_CHARGE_STEPS: u32 = 24;

/// Default length of the dash itself (~0.3 seconds).
pub const DEFAULT_DASH_STEPS: u32 = 18;

/// Extra dash steps granted per difficulty tier.
pub const DASH_STEPS_PER_TIER_BONUS: u32 = 1;

/// Default factor applied to a boid's maximum speed while it is dashing.
pub const DEFAULT_DASH_SPEED_MULTIPLIER: f32 = 2.6;

/// Extra dash speed factor per difficulty tier.
pub const DASH_SPEED_MULTIPLIER_PER_TIER_BONUS: f32 = 0.2;

/// Default steps a boid must wait after a dash before it may dash again (5 s).
pub const DEFAULT_DASH_COOLDOWN_STEPS: u32 = 300;

/// Cooldown steps removed per difficulty tier.
pub const DASH_COOLDOWN_STEPS_PER_TIER_REDUCTION: u32 = 30;

/// How often the flock offers a single new dash slot, in simulation steps.
/// Together with the concurrency limit below this is what keeps the dashing
/// group small instead of turning the whole swarm into a wall of lunges.
pub const DASH_SELECTION_INTERVAL_STEPS: u32 = 40;

/// Boids allowed to charge or dash at the same time in a small flock.
pub const MAX_CONCURRENT_DASHING_BOIDS: usize = 3;

/// One extra dash slot is unlocked for every this many boids in the flock, so a
/// dash still happens now and then once the swarm has grown large.
pub const BOIDS_PER_EXTRA_DASH_SLOT: usize = 60;

/// A boid closer to the player than this leaves no room to dodge, so it is not
/// offered a dash.
pub const MINIMUM_DASH_SELECTION_DISTANCE: f32 = 160.0;

/// A boid further from the player than this would run out of dash before
/// arriving, so it is not offered one either.
pub const MAXIMUM_DASH_SELECTION_DISTANCE: f32 = 340.0;
