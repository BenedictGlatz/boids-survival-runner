use crate::constants::{
    DEFAULT_MAX_CONCURRENT_OBSTACLES, DEFAULT_OBSTACLE_SPAWN_INTERVAL_STEPS,
    MAXIMUM_CONCURRENT_OBSTACLES, MAX_CONCURRENT_OBSTACLES_PER_TIER_BONUS,
    MAX_OBSTACLE_DENSITY_TIER, MINIMUM_OBSTACLE_SPAWN_INTERVAL_STEPS,
    OBSTACLE_SPAWN_INTERVAL_STEPS_PER_TIER_REDUCTION,
};

/// How crowded the world gets with obstacles at a given point in the game.
#[derive(Debug, Clone, Copy)]
pub struct ObstacleDensity {
    /// Steps between two attempts to place a new obstacle.
    pub spawn_interval_steps: u32,
    /// Most obstacles allowed in the world at once.
    pub max_concurrent: usize,
}

/// The obstacle density for a wave.
///
/// Both numbers move in the same direction — more often and more at a time — which
/// is the density increase the game is meant to build up over a run.
pub fn obstacle_density_for_wave(wave: u32) -> ObstacleDensity {
    let tier = obstacle_density_tier_for_wave(wave);

    // saturating_sub, so a tier ramp longer than the default interval cannot wrap
    // around to a huge number instead of hitting the minimum.
    let reduction = tier * OBSTACLE_SPAWN_INTERVAL_STEPS_PER_TIER_REDUCTION;
    let spawn_interval_steps = DEFAULT_OBSTACLE_SPAWN_INTERVAL_STEPS
        .saturating_sub(reduction)
        .max(MINIMUM_OBSTACLE_SPAWN_INTERVAL_STEPS);

    let bonus = tier as usize * MAX_CONCURRENT_OBSTACLES_PER_TIER_BONUS;
    let max_concurrent =
        (DEFAULT_MAX_CONCURRENT_OBSTACLES + bonus).min(MAXIMUM_CONCURRENT_OBSTACLES);

    ObstacleDensity {
        spawn_interval_steps,
        max_concurrent,
    }
}

/// The density tier a wave sits in.
///
/// The first wave is tier 0, and the ramp is capped separately from the boid tiers:
/// the boid variants stop improving at `MAX_BOID_DIFFICULTY_TIER`, while the
/// obstacles keep getting denser for roughly twice as long.
fn obstacle_density_tier_for_wave(wave: u32) -> u32 {
    wave.saturating_sub(1).min(MAX_OBSTACLE_DENSITY_TIER)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_first_wave_uses_the_defaults() {
        let density = obstacle_density_for_wave(1);

        assert_eq!(
            density.spawn_interval_steps,
            DEFAULT_OBSTACLE_SPAWN_INTERVAL_STEPS
        );
        assert_eq!(density.max_concurrent, DEFAULT_MAX_CONCURRENT_OBSTACLES);
    }

    #[test]
    fn wave_zero_is_treated_as_the_first_wave() {
        // The engine counts waves from one, but nothing stops a caller passing zero.
        // saturating_sub is what keeps that from underflowing into the highest tier.
        assert_eq!(
            obstacle_density_for_wave(0).spawn_interval_steps,
            obstacle_density_for_wave(1).spawn_interval_steps
        );
    }

    #[test]
    fn later_waves_spawn_obstacles_more_often() {
        let early = obstacle_density_for_wave(1);
        let middle = obstacle_density_for_wave(4);
        let late = obstacle_density_for_wave(7);

        assert!(middle.spawn_interval_steps < early.spawn_interval_steps);
        assert!(late.spawn_interval_steps < middle.spawn_interval_steps);
    }

    #[test]
    fn later_waves_allow_more_obstacles_at_once() {
        let early = obstacle_density_for_wave(1);
        let middle = obstacle_density_for_wave(4);
        let late = obstacle_density_for_wave(7);

        assert!(middle.max_concurrent > early.max_concurrent);
        assert!(late.max_concurrent > middle.max_concurrent);
    }

    #[test]
    fn the_spawn_interval_never_drops_below_the_minimum() {
        // Without the floor a long enough run would ask for an interval of zero
        // steps, which would try to place an obstacle on every single step.
        for wave in 1..200 {
            assert!(
                obstacle_density_for_wave(wave).spawn_interval_steps
                    >= MINIMUM_OBSTACLE_SPAWN_INTERVAL_STEPS
            );
        }
    }

    #[test]
    fn the_concurrent_count_never_passes_the_maximum() {
        for wave in 1..200 {
            assert!(obstacle_density_for_wave(wave).max_concurrent <= MAXIMUM_CONCURRENT_OBSTACLES);
        }
    }

    #[test]
    fn the_ramp_reaches_both_limits_and_then_holds_still() {
        let at_the_cap = obstacle_density_for_wave(MAX_OBSTACLE_DENSITY_TIER + 1);
        let far_beyond = obstacle_density_for_wave(500);

        assert_eq!(
            at_the_cap.spawn_interval_steps,
            MINIMUM_OBSTACLE_SPAWN_INTERVAL_STEPS
        );
        assert_eq!(at_the_cap.max_concurrent, MAXIMUM_CONCURRENT_OBSTACLES);
        assert_eq!(
            far_beyond.spawn_interval_steps,
            at_the_cap.spawn_interval_steps
        );
        assert_eq!(far_beyond.max_concurrent, at_the_cap.max_concurrent);
    }

    #[test]
    fn the_density_ramp_outlasts_the_boid_tier_ramp() {
        // The point of a separate cap. If these two were the same, obstacle density
        // would stop growing in wave five along with everything else.
        use crate::constants::MAX_BOID_DIFFICULTY_TIER;

        let where_boids_stop = obstacle_density_for_wave(MAX_BOID_DIFFICULTY_TIER + 1);
        let later = obstacle_density_for_wave(MAX_BOID_DIFFICULTY_TIER + 3);

        assert!(later.spawn_interval_steps < where_boids_stop.spawn_interval_steps);
    }
}
