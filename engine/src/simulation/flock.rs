use super::boid::Boid;
use super::dash::{advance_dash_state, begin_dash_charge, is_dashing, step_speed_limit};
use super::dash_selection::select_dash_group;
use super::obstacle::Obstacle;
use super::obstacle_bounce::bounce_boid_off_obstacles;
use super::obstacle_pushout::push_boids_out_of_obstacles;
use super::overlap::{resolve_boid_overlaps, wrap_position};
use super::physics::{aabb_overlap, clamp_force, integrate};
use super::steering::{dash_steering, flocking_steering};
use crate::constants::BOID_HIT_RADIUS;
use crate::math::vector::Vec2;

/// Manages the collection of all active boids.
pub struct Flock {
    pub boids: Vec<Boid>,
    /// Simulation steps run so far. The dash selection uses it as the seed for its
    /// deterministic stand-in for randomness, so the flock has to remember it.
    pub step_counter: u32,
}

impl Flock {
    pub fn new() -> Self {
        Self {
            boids: Vec::new(),
            step_counter: 0,
        }
    }

    pub fn add(&mut self, boid: Boid) {
        self.boids.push(boid);
    }

    pub fn len(&self) -> usize {
        self.boids.len()
    }

    // updates the position of all boids based on a snapshot of the previous frame
    pub fn update(
        &mut self,
        player_position: Vec2,
        obstacles: &[Obstacle],
        world_width: f32,
        world_height: f32,
    ) -> u32 {
        // wrapping_add so a very long session cannot overflow the counter.
        self.step_counter = self.step_counter.wrapping_add(1);

        // Hand out at most one new dash before anything moves, so the chosen boids
        // already pulse in this very step. The selection may return a small group of
        // neighbouring boids of the same tier, which then charge and launch together.
        for index in select_dash_group(&self.boids, self.step_counter, player_position) {
            begin_dash_charge(&mut self.boids[index]);
        }

        let snapshot = self.boids.clone();

        for boid in &mut self.boids {
            // Move the dash state machine on first: it decides whether this boid
            // flocks normally this step or flies along its dash line. The launch
            // step also writes the dash velocity here, once.
            advance_dash_state(boid, player_position);

            let steering = if is_dashing(boid) {
                dash_steering(boid, &snapshot)
            } else {
                flocking_steering(boid, &snapshot, player_position, obstacles)
            };

            boid.acceleration = clamp_force(boid, steering);
            // Only a dashing boid gets a raised cap. On the first step after a dash
            // the cap drops back and the leftover dash speed is clamped away at once.
            let position_before_the_step = boid.position;
            integrate(boid, step_speed_limit(boid));
            // The whole step is tested against the obstacles, not just where it ended:
            // an obstacle is a wall for a boid exactly as it is for the player. This has
            // to happen before the wrap, or a boid crossing the world edge would be
            // tested along a segment straight through the middle of the arena.
            bounce_boid_off_obstacles(obstacles, boid, position_before_the_step);
            wrap_position(&mut boid.position, world_width, world_height);
        }

        resolve_boid_overlaps(&mut self.boids, world_width, world_height);

        // Last, and deliberately after the overlap relaxation: that relaxation moves
        // boids to unstack them and can push one into an obstacle, so anything the
        // steering could not keep out has to be corrected here rather than before it.
        push_boids_out_of_obstacles(obstacles, &mut self.boids);

        count_player_hits(&self.boids, player_position)
    }
}

fn count_player_hits(boids: &[Boid], player_position: Vec2) -> u32 {
    let mut hit_count = 0;

    for boid in boids {
        if aabb_overlap(boid.position, player_position, BOID_HIT_RADIUS) {
            hit_count += 1;
        }
    }

    hit_count
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::constants::{
        BOID_COLLISION_RADIUS, DASH_UNLOCK_DIFFICULTY_TIER, MAX_BOID_DIFFICULTY_TIER,
    };
    use crate::simulation::boid::BoidProperties;
    use crate::simulation::dash::{dash_properties_for_difficulty_tier, DashState};
    use crate::simulation::dash_selection::{allowed_concurrent_dashers, count_busy_dashers};

    /// No obstacles at all, for the tests that are only about flocking.
    fn no_obstacles() -> Vec<Obstacle> {
        Vec::new()
    }

    /// Builds a boid of the given tier that is allowed to dash.
    fn dash_capable_boid(position: Vec2, tier: u32) -> Boid {
        let properties = BoidProperties {
            dash: dash_properties_for_difficulty_tier(tier),
            ..BoidProperties::default()
        };

        Boid::with_variant(position, Vec2::zero(), properties, tier)
    }

    /// Puts a boid straight into the middle of a dash along the given direction,
    /// skipping the charge-up so a test can look at the dash itself.
    fn launch_dash_along(boid: &mut Boid, direction: Vec2) {
        boid.dash_state = DashState::Dashing;
        boid.dash_state_steps_remaining = boid.properties.dash.dash_steps;
        boid.velocity = direction
            .normalize()
            .scale(boid.properties.max_speed * boid.properties.dash.speed_multiplier);
    }

    #[test]
    fn update_reports_player_collisions() {
        let mut flock = Flock::new();
        flock.add(Boid::with_properties(
            Vec2::new(50.0, 50.0),
            Vec2::zero(),
            BoidProperties {
                max_acceleration: 0.0,
                target_seek_weight: 0.0,
                ..BoidProperties::default()
            },
        ));

        let hit_count = flock.update(Vec2::new(55.0, 50.0), &no_obstacles(), 100.0, 100.0);

        assert_eq!(hit_count, 1);
    }

    #[test]
    fn update_wraps_boids_at_world_edges() {
        let mut flock = Flock::new();
        flock.add(Boid::with_properties(
            Vec2::new(99.0, 40.0),
            Vec2::new(4.0, 0.0),
            BoidProperties {
                max_speed: 4.0,
                max_acceleration: 0.0,
                target_seek_weight: 0.0,
                ..BoidProperties::default()
            },
        ));

        flock.update(Vec2::new(50.0, 50.0), &no_obstacles(), 100.0, 100.0);

        assert_eq!(flock.boids[0].position, Vec2::new(3.0, 40.0));
    }

    #[test]
    fn update_steers_boids_toward_the_player() {
        let mut flock = Flock::new();
        flock.add(Boid::with_properties(
            Vec2::new(10.0, 50.0),
            Vec2::zero(),
            BoidProperties {
                max_speed: 4.0,
                max_acceleration: 1.0,
                perception_radius: 0.0,
                separation_weight: 0.0,
                alignment_weight: 0.0,
                cohesion_weight: 0.0,
                target_seek_weight: 1.0,
                ..BoidProperties::default()
            },
        ));

        flock.update(Vec2::new(90.0, 50.0), &no_obstacles(), 100.0, 100.0);

        assert!(flock.boids[0].velocity.x > 0.0);
        assert!(flock.boids[0].position.x > 10.0);
    }

    #[test]
    fn update_separates_overlapping_boids() {
        let mut flock = Flock::new();
        let stationary_properties = BoidProperties {
            max_speed: 0.0,
            max_acceleration: 0.0,
            perception_radius: 0.0,
            separation_weight: 0.0,
            alignment_weight: 0.0,
            cohesion_weight: 0.0,
            target_seek_weight: 0.0,
            ..BoidProperties::default()
        };

        flock.add(Boid::with_properties(
            Vec2::new(50.0, 50.0),
            Vec2::zero(),
            stationary_properties,
        ));
        flock.add(Boid::with_properties(
            Vec2::new(50.0, 50.0),
            Vec2::zero(),
            stationary_properties,
        ));

        flock.update(Vec2::new(90.0, 90.0), &no_obstacles(), 100.0, 100.0);

        let distance = flock.boids[0].position.distance_to(flock.boids[1].position);
        assert!(distance >= BOID_COLLISION_RADIUS * 2.0);
    }

    #[test]
    fn a_dashing_boid_ignores_cohesion_and_alignment() {
        let mut flock = Flock::new();

        let mut dasher = dash_capable_boid(Vec2::new(100.0, 100.0), DASH_UNLOCK_DIFFICULTY_TIER);
        launch_dash_along(&mut dasher, Vec2::new(1.0, 0.0));
        flock.add(dasher);

        // The neighbour sits 60 units away: inside the default perception radius (70)
        // but outside the close neighbour radius (25.2), so separation contributes
        // nothing and only cohesion and alignment could pull the dasher downwards.
        flock.add(dash_capable_boid(
            Vec2::new(100.0, 160.0),
            DASH_UNLOCK_DIFFICULTY_TIER,
        ));

        // The player sits far below as well, so seeking would also pull downwards.
        flock.update(Vec2::new(100.0, 900.0), &no_obstacles(), 1000.0, 1000.0);

        assert_eq!(flock.boids[0].velocity.y, 0.0);
        assert!(flock.boids[0].velocity.x > flock.boids[0].properties.max_speed);
    }

    #[test]
    fn a_dash_step_still_lands_inside_the_world() {
        let mut flock = Flock::new();
        let mut dasher = dash_capable_boid(Vec2::new(295.0, 150.0), MAX_BOID_DIFFICULTY_TIER);
        launch_dash_along(&mut dasher, Vec2::new(1.0, 0.0));
        flock.add(dasher);

        flock.update(Vec2::new(150.0, 150.0), &no_obstacles(), 300.0, 300.0);

        let position = flock.boids[0].position;
        assert!(position.x >= 0.0 && position.x <= 300.0);
        assert!(position.y >= 0.0 && position.y <= 300.0);
    }

    #[test]
    fn overlap_relaxation_does_not_push_a_dashing_boid_off_its_line() {
        let mut flock = Flock::new();

        let mut dasher = dash_capable_boid(Vec2::new(500.0, 500.0), DASH_UNLOCK_DIFFICULTY_TIER);
        // Separation is switched off for this boid on purpose: it stays active
        // during a real dash, and its steering would move the boid sideways as
        // well. Without it, the only thing left that can move the dasher off its
        // line is the overlap relaxation, which is what this test is about.
        dasher.properties.separation_weight = 0.0;
        launch_dash_along(&mut dasher, Vec2::new(1.0, 0.0));
        // With separation off and the cap raised for the dash, the dasher covers
        // exactly its dash velocity this step. Placing the bystander relative to where
        // it lands keeps the pair overlapping whatever `BOID_COLLISION_RADIUS` is
        // tuned to, instead of relying on the dash being shorter than that radius.
        let landing_x = dasher.position.x + dasher.velocity.x;
        flock.add(dasher);

        // A second boid sitting a little above the dasher: it overlaps, so the
        // relaxation has to resolve the pair, and the dasher must not be the one
        // that gives way.
        let mut bystander = dash_capable_boid(Vec2::new(landing_x, 505.0), 0);
        bystander.properties.max_speed = 0.0;
        bystander.properties.max_acceleration = 0.0;
        flock.add(bystander);

        flock.update(Vec2::new(500.0, 900.0), &no_obstacles(), 1000.0, 1000.0);

        // The dash runs along x, so any y movement of the dasher came from the
        // relaxation pass.
        assert_eq!(flock.boids[0].position.y, 500.0);
        assert!(flock.boids[1].position.y > 505.0);
    }

    #[test]
    fn the_flock_never_has_more_boids_dashing_than_it_allows() {
        let mut flock = Flock::new();
        for index in 0..24 {
            flock.add(dash_capable_boid(
                Vec2::new(200.0 + index as f32 * 12.0, 200.0),
                MAX_BOID_DIFFICULTY_TIER,
            ));
        }

        let limit = allowed_concurrent_dashers(flock.len());
        for _ in 0..1200 {
            flock.update(Vec2::new(500.0, 500.0), &no_obstacles(), 1000.0, 1000.0);
            assert!(count_busy_dashers(&flock.boids) <= limit);
        }
    }

    #[test]
    fn some_boid_eventually_dashes_in_a_high_tier_flock() {
        let mut flock = Flock::new();
        for index in 0..24 {
            flock.add(dash_capable_boid(
                Vec2::new(200.0 + index as f32 * 12.0, 200.0),
                MAX_BOID_DIFFICULTY_TIER,
            ));
        }

        // Guards against the whole feature silently never firing.
        let mut saw_a_dash = false;
        for _ in 0..1200 {
            flock.update(Vec2::new(500.0, 500.0), &no_obstacles(), 1000.0, 1000.0);

            for boid in &flock.boids {
                if boid.dash_state == DashState::Dashing {
                    saw_a_dash = true;
                }
            }
        }

        assert!(saw_a_dash);
    }

    #[test]
    fn boids_of_one_tier_flying_together_dash_as_a_group() {
        // The counterpart to the test above: a single lunge is not enough, a tight
        // cluster of one tier has to produce a push of several boids at once.
        let mut flock = Flock::new();
        for index in 0..24 {
            flock.add(dash_capable_boid(
                Vec2::new(200.0 + index as f32 * 12.0, 200.0),
                MAX_BOID_DIFFICULTY_TIER,
            ));
        }

        let mut most_boids_dashing_at_once = 0;
        for _ in 0..1200 {
            flock.update(Vec2::new(500.0, 500.0), &no_obstacles(), 1000.0, 1000.0);

            let mut dashing_now = 0;
            for boid in &flock.boids {
                if boid.dash_state == DashState::Dashing {
                    dashing_now += 1;
                }
            }

            if dashing_now > most_boids_dashing_at_once {
                most_boids_dashing_at_once = dashing_now;
            }
        }

        assert!(most_boids_dashing_at_once > 1);
    }

    // The two integration tests about obstacles used to sit here as well and now live
    // beside the modules they actually exercise — the way round a bar in
    // `obstacle_bounce.rs`, next to what happens when a boid fails to find it, and the
    // rescue from an obstacle that appeared on top of a boid in `obstacle_pushout.rs`.
    // That is also what brought this file back under the 400-line limit.
}
