use super::obstacle::Obstacle;
use super::obstacle_density::obstacle_density_for_wave;
use super::obstacle_rules::candidate_is_acceptable;
use super::obstacle_spawn::build_spawn_candidate;
use crate::constants::{
    DEFAULT_OBSTACLE_LIFETIME_STEPS, MINIMUM_CORRIDOR_WIDTH, OBSTACLE_SPAWN_ATTEMPTS,
};
use crate::math::vector::Vec2;

/// Which obstacles exist right now, and for how much longer.
///
/// Only that: what an obstacle *does* to the player and the boids lives in
/// `obstacle_collision.rs`, which takes a plain slice. The split is the reason the flock
/// never has to know that obstacles come and go — it only ever sees the ones standing.
///
/// The field belongs to the engine rather than to the flock, because obstacles have a
/// lifetime and the flock has no concept of anything that appears and expires.
pub struct ObstacleField {
    pub obstacles: Vec<Obstacle>,
}

impl ObstacleField {
    pub fn new() -> Self {
        Self {
            obstacles: Vec::new(),
        }
    }

    pub fn len(&self) -> usize {
        self.obstacles.len()
    }

    /// Advances the field by one simulation step: ages what is there, removes what
    /// has run out, and offers at most one new obstacle.
    pub fn update(
        &mut self,
        step_counter: u32,
        wave: u32,
        player_position: Vec2,
        world_width: f32,
        world_height: f32,
    ) {
        for obstacle in &mut self.obstacles {
            obstacle.age_one_step();
        }
        self.obstacles.retain(|obstacle| !obstacle.has_expired());

        let density = obstacle_density_for_wave(wave);

        if self.obstacles.len() >= density.max_concurrent {
            return;
        }

        // Only every so many steps, so the density is set by the wave rather than by
        // how much room happens to be free.
        if !step_counter.is_multiple_of(density.spawn_interval_steps) {
            return;
        }

        let spawn_round = (step_counter / density.spawn_interval_steps) as u64;

        for attempt in 0..OBSTACLE_SPAWN_ATTEMPTS {
            let candidate = build_spawn_candidate(
                spawn_round,
                attempt,
                world_width,
                world_height,
                DEFAULT_OBSTACLE_LIFETIME_STEPS,
            );

            if candidate_is_acceptable(
                &candidate,
                &self.obstacles,
                player_position,
                world_width,
                world_height,
            ) {
                self.obstacles.push(candidate);
                return;
            }
        }

        // Nothing fitted this round. That is the intended outcome rather than a
        // failure: the corridor rule is absolute and the density is only a target.
    }

    /// Drops every obstacle that no longer fits the world after a resize.
    ///
    /// A window that gets smaller can leave an obstacle outside the world or pressed
    /// against a new edge, and an obstacle against a wall is exactly what could form a
    /// pocket. Removing it is cheap and keeps the no-dead-end guarantee unconditional.
    pub fn drop_obstacles_outside(&mut self, world_width: f32, world_height: f32) {
        self.obstacles.retain(|obstacle| {
            obstacle.surface_gap_to_world_edges(world_width, world_height) >= MINIMUM_CORRIDOR_WIDTH
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::constants::{DEFAULT_OBSTACLE_SPAWN_INTERVAL_STEPS, MAXIMUM_CONCURRENT_OBSTACLES};

    const WORLD_WIDTH: f32 = 1600.0;
    const WORLD_HEIGHT: f32 = 900.0;
    const PLAYER: Vec2 = Vec2 { x: 800.0, y: 450.0 };

    fn run_steps(field: &mut ObstacleField, wave: u32, steps: u32) {
        for step in 1..=steps {
            field.update(step, wave, PLAYER, WORLD_WIDTH, WORLD_HEIGHT);
        }
    }

    fn field_with_one(obstacle: Obstacle) -> ObstacleField {
        ObstacleField {
            obstacles: vec![obstacle],
        }
    }

    #[test]
    fn a_new_field_is_empty() {
        assert_eq!(ObstacleField::new().len(), 0);
    }

    #[test]
    fn obstacles_appear_once_the_first_spawn_interval_has_passed() {
        let mut field = ObstacleField::new();

        run_steps(&mut field, 1, DEFAULT_OBSTACLE_SPAWN_INTERVAL_STEPS - 1);
        assert_eq!(field.len(), 0);

        run_steps(&mut field, 1, DEFAULT_OBSTACLE_SPAWN_INTERVAL_STEPS);
        assert!(field.len() > 0);
    }

    #[test]
    fn expired_obstacles_are_removed() {
        let mut field = field_with_one(Obstacle::circle(Vec2::new(300.0, 200.0), 30.0, 5));

        run_steps(&mut field, 1, 5);

        assert_eq!(field.len(), 0);
    }

    #[test]
    fn the_field_never_exceeds_the_wave_maximum() {
        for wave in [1_u32, 3, 6, 12] {
            let mut field = ObstacleField::new();
            let allowed = obstacle_density_for_wave(wave).max_concurrent;

            run_steps(&mut field, wave, 6_000);

            assert!(
                field.len() <= allowed,
                "wave {wave} held {} obstacles, {allowed} allowed",
                field.len()
            );
            assert!(field.len() <= MAXIMUM_CONCURRENT_OBSTACLES);
        }
    }

    #[test]
    fn the_field_actually_fills_up_towards_the_wave_maximum() {
        // The counterpart to the upper-bound test above, and the one that catches a
        // spawn rule which technically works but almost never finds a spot. Without it
        // a badly spread seed passes every other test in this file while the game shows
        // no obstacles at all: an empty world satisfies every bound and every corridor.
        //
        // Most of the allowance rather than all of it, because the corridor rule is
        // absolute and the density only a target. In a window this size the later waves
        // genuinely run out of room before they run out of allowance, and demanding the
        // exact figure would be asserting that they do not.
        for wave in [1_u32, 3, 6, 12] {
            let mut field = ObstacleField::new();
            let allowed = obstacle_density_for_wave(wave).max_concurrent;

            run_steps(&mut field, wave, 4_000);

            assert!(
                field.len() >= 2 && field.len() * 2 >= allowed,
                "wave {wave} only reached {} of {allowed} obstacles",
                field.len()
            );
        }
    }

    #[test]
    fn later_waves_hold_more_obstacles_than_the_first() {
        // The density increase as the player actually experiences it, rather than as
        // the ramp promises: the world has to end up more crowded, not merely allowed
        // to be.
        let mut early = ObstacleField::new();
        let mut late = ObstacleField::new();

        run_steps(&mut early, 1, 4_000);
        run_steps(&mut late, 9, 4_000);

        assert!(
            late.len() > early.len(),
            "wave 1 held {}, wave 9 held {}",
            early.len(),
            late.len()
        );
    }

    #[test]
    fn the_first_obstacle_appears_within_the_first_two_spawn_rounds() {
        // A player should meet an obstacle early in the first wave, not after several
        // minutes of rejected candidates.
        let mut field = ObstacleField::new();

        run_steps(&mut field, 1, DEFAULT_OBSTACLE_SPAWN_INTERVAL_STEPS * 2);

        assert!(field.len() > 0);
    }

    #[test]
    fn obstacles_are_spread_across_the_world_rather_than_bunched_in_one_corner() {
        // A spread that clusters would still satisfy the corridor rule — the obstacles
        // would simply all be rejected but for a few, and the ones that survived would
        // sit in the same place every round.
        let mut field = ObstacleField::new();
        let mut left = 0;
        let mut right = 0;
        let mut top = 0;
        let mut bottom = 0;

        // Sampled over many rounds, because only a handful exist at any one time.
        for step in 1..=40_000 {
            field.update(step, 9, PLAYER, WORLD_WIDTH, WORLD_HEIGHT);

            for obstacle in &field.obstacles {
                if obstacle.spine_start.x < WORLD_WIDTH / 2.0 {
                    left += 1;
                } else {
                    right += 1;
                }
                if obstacle.spine_start.y < WORLD_HEIGHT / 2.0 {
                    top += 1;
                } else {
                    bottom += 1;
                }
            }
        }

        assert!(left > 0 && right > 0, "left {left}, right {right}");
        assert!(top > 0 && bottom > 0, "top {top}, bottom {bottom}");
    }

    #[test]
    fn everything_the_field_holds_keeps_a_full_corridor() {
        // The invariant checked on the field rather than on the spawn rule alone, so
        // ageing and removal cannot sneak an illegal pair past it.
        let mut field = ObstacleField::new();

        run_steps(&mut field, 9, 20_000);

        for (index, first) in field.obstacles.iter().enumerate() {
            for second in &field.obstacles[index + 1..] {
                assert!(first.surface_gap_to(second) >= MINIMUM_CORRIDOR_WIDTH);
            }
            assert!(
                first.surface_gap_to_world_edges(WORLD_WIDTH, WORLD_HEIGHT)
                    >= MINIMUM_CORRIDOR_WIDTH
            );
        }
    }

    #[test]
    fn shrinking_the_world_drops_obstacles_that_break_the_invariant() {
        // An obstacle left pressed against a new edge could form a pocket with it,
        // which is the one shape the corridor rule exists to prevent.
        let mut field = field_with_one(Obstacle::circle(Vec2::new(1400.0, 800.0), 40.0, 1800));

        field.drop_obstacles_outside(600.0, 400.0);

        assert_eq!(field.len(), 0);
    }

    #[test]
    fn shrinking_the_world_keeps_obstacles_that_still_fit() {
        let mut field = field_with_one(Obstacle::circle(Vec2::new(300.0, 200.0), 30.0, 1800));

        field.drop_obstacles_outside(600.0, 400.0);

        assert_eq!(field.len(), 1);
    }
}
