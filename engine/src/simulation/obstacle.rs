use crate::constants::OBSTACLE_HIT_FLASH_STEPS;
use crate::math::segment::{closest_point_on_segment, distance_between_segments};
use crate::math::vector::Vec2;

/// A temporary obstacle in the world, shaped as a capsule.
///
/// The capsule is a centre line — the "spine" — swept by a circle of `radius`. A
/// circular obstacle is the capsule whose spine has zero length, so both requested
/// shapes share one type, one collision test and one drawing path. Splitting them
/// into an enum would mean two of each, and two things that can drift apart.
#[derive(Debug, Clone, Copy)]
pub struct Obstacle {
    pub spine_start: Vec2,
    pub spine_end: Vec2,
    pub radius: f32,
    /// Steps this obstacle was created with, kept so the render code can tell how
    /// far through its life it is without the frontend knowing the tuning.
    pub lifetime_steps: u32,
    pub remaining_steps: u32,
    /// Steps left of the red flash that tells the player they just hit this obstacle.
    /// Zero means there is nothing to highlight.
    pub hit_flash_steps: u32,
}

/// Where a point sits relative to an obstacle's surface.
pub struct SurfaceContact {
    /// Distance from the surface. Negative means the point is inside the obstacle.
    pub surface_distance: f32,
    /// Unit vector pointing from the surface out towards the point.
    pub outward_normal: Vec2,
    /// The point on the surface closest to the queried point.
    pub surface_point: Vec2,
}

impl Obstacle {
    /// Creates an obstacle with a full lifetime ahead of it.
    pub fn new(spine_start: Vec2, spine_end: Vec2, radius: f32, lifetime_steps: u32) -> Self {
        Self {
            spine_start,
            spine_end,
            radius,
            lifetime_steps,
            remaining_steps: lifetime_steps,
            hit_flash_steps: 0,
        }
    }

    /// Creates a circular obstacle, which is a capsule with a spine of zero length.
    pub fn circle(centre: Vec2, radius: f32, lifetime_steps: u32) -> Self {
        Self::new(centre, centre, radius, lifetime_steps)
    }

    /// Counts one simulation step off this obstacle's remaining life, and off the
    /// hit flash if one is running.
    pub fn age_one_step(&mut self) {
        self.remaining_steps = self.remaining_steps.saturating_sub(1);
        self.hit_flash_steps = self.hit_flash_steps.saturating_sub(1);
    }

    /// Starts the red flash that signals the player just ran into this obstacle.
    ///
    /// Restarting an already running flash on purpose: a player pressed against an
    /// obstacle collides every step, and the flash should stay lit for as long as that
    /// lasts rather than blinking out mid-contact.
    pub fn mark_player_hit(&mut self) {
        self.hit_flash_steps = OBSTACLE_HIT_FLASH_STEPS;
    }

    /// Whether this obstacle has run out of time and should be removed.
    pub fn has_expired(&self) -> bool {
        self.remaining_steps == 0
    }

    /// How much of the obstacle's life is left, from 1.0 when new down to 0.0.
    ///
    /// This is the single number the frontend draws its fade in and out from, in the
    /// same spirit as the dash render phase: the whole render state of an obstacle
    /// fits in one float, so no second buffer has to cross the boundary.
    pub fn life_fraction(&self) -> f32 {
        if self.lifetime_steps == 0 {
            return 0.0;
        }

        self.remaining_steps as f32 / self.lifetime_steps as f32
    }

    /// How brightly the hit flash should be drawn, from 1.0 right after the hit down
    /// to 0.0 once it has faded. Zero whenever the player has not hit this obstacle.
    ///
    /// One number again, for the same reason as `life_fraction`: the frontend gets the
    /// whole flash state without learning how many steps it lasts.
    pub fn hit_flash(&self) -> f32 {
        self.hit_flash_steps as f32 / OBSTACLE_HIT_FLASH_STEPS as f32
    }

    /// Where `point` sits relative to this obstacle's surface.
    ///
    /// `point_radius` inflates the obstacle by the size of whatever is being tested,
    /// so a player or boid can be treated as a single position rather than a disc.
    pub fn contact_with_point(&self, point: Vec2, point_radius: f32) -> SurfaceContact {
        let spine_point = closest_point_on_segment(point, self.spine_start, self.spine_end);
        let away_from_spine = point.sub(spine_point);
        let distance_to_spine = away_from_spine.length();
        let effective_radius = self.radius + point_radius;

        // Sitting exactly on the spine leaves no direction to push towards, so a
        // fixed one is used. The same trick keeps the boid overlap relaxation from
        // dividing by zero when two boids share a position.
        let outward_normal = if distance_to_spine == 0.0 {
            Vec2::new(1.0, 0.0)
        } else {
            away_from_spine.scale(1.0 / distance_to_spine)
        };

        SurfaceContact {
            surface_distance: distance_to_spine - effective_radius,
            outward_normal,
            surface_point: spine_point.add(outward_normal.scale(effective_radius)),
        }
    }

    /// The gap between this obstacle's surface and another's.
    ///
    /// Negative means the two overlap. This is the measurement the corridor rule is
    /// stated in, and the reason it works for both shapes without a special case.
    pub fn surface_gap_to(&self, other: &Obstacle) -> f32 {
        let spine_distance = distance_between_segments(
            self.spine_start,
            self.spine_end,
            other.spine_start,
            other.spine_end,
        );

        spine_distance - self.radius - other.radius
    }

    /// The smallest gap between this obstacle's surface and any of the four world
    /// edges. Negative means it pokes out of the world.
    pub fn surface_gap_to_world_edges(&self, world_width: f32, world_height: f32) -> f32 {
        let leftmost = self.spine_start.x.min(self.spine_end.x) - self.radius;
        let rightmost = self.spine_start.x.max(self.spine_end.x) + self.radius;
        let topmost = self.spine_start.y.min(self.spine_end.y) - self.radius;
        let bottommost = self.spine_start.y.max(self.spine_end.y) + self.radius;

        let gaps = [
            leftmost,
            world_width - rightmost,
            topmost,
            world_height - bottommost,
        ];

        let mut smallest = gaps[0];
        for gap in gaps {
            if gap < smallest {
                smallest = gap;
            }
        }

        smallest
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const LIFETIME: u32 = 100;

    fn bar() -> Obstacle {
        Obstacle::new(
            Vec2::new(100.0, 100.0),
            Vec2::new(200.0, 100.0),
            10.0,
            LIFETIME,
        )
    }

    #[test]
    fn a_point_outside_reports_its_distance_to_the_surface() {
        let obstacle = bar();

        // 40 above the spine, minus the radius of 10.
        let contact = obstacle.contact_with_point(Vec2::new(150.0, 60.0), 0.0);

        assert_eq!(contact.surface_distance, 30.0);
        assert_eq!(contact.outward_normal, Vec2::new(0.0, -1.0));
    }

    #[test]
    fn a_point_inside_reports_a_negative_surface_distance() {
        // The sign is what the boid push-out and the player block both branch on, so
        // an inside point has to be distinguishable from one exactly on the surface.
        let obstacle = bar();

        let contact = obstacle.contact_with_point(Vec2::new(150.0, 104.0), 0.0);

        assert!(contact.surface_distance < 0.0);
    }

    #[test]
    fn the_outward_normal_points_away_from_the_spine() {
        let obstacle = bar();

        let above = obstacle.contact_with_point(Vec2::new(150.0, 40.0), 0.0);
        let below = obstacle.contact_with_point(Vec2::new(150.0, 160.0), 0.0);

        assert_eq!(above.outward_normal, Vec2::new(0.0, -1.0));
        assert_eq!(below.outward_normal, Vec2::new(0.0, 1.0));
    }

    #[test]
    fn a_point_exactly_on_the_spine_still_gets_a_usable_normal() {
        // There is no correct direction here, only a defined one. Returning a zero
        // vector would leave the push-out unable to move the boid anywhere.
        let obstacle = bar();

        let contact = obstacle.contact_with_point(Vec2::new(150.0, 100.0), 0.0);

        assert!((contact.outward_normal.length() - 1.0).abs() < 1e-5);
    }

    #[test]
    fn the_surface_point_lies_one_radius_out_along_the_normal() {
        let obstacle = bar();

        let contact = obstacle.contact_with_point(Vec2::new(150.0, 40.0), 0.0);

        assert_eq!(contact.surface_point, Vec2::new(150.0, 90.0));
    }

    #[test]
    fn the_point_radius_inflates_the_obstacle() {
        // This is how a player of some size is tested as a single position.
        let obstacle = bar();
        let point = Vec2::new(150.0, 60.0);

        let bare = obstacle.contact_with_point(point, 0.0);
        let inflated = obstacle.contact_with_point(point, 14.0);

        assert_eq!(bare.surface_distance - inflated.surface_distance, 14.0);
    }

    #[test]
    fn a_circle_obstacle_behaves_like_a_zero_length_capsule() {
        let circle = Obstacle::circle(Vec2::new(100.0, 100.0), 25.0, LIFETIME);

        let contact = circle.contact_with_point(Vec2::new(160.0, 100.0), 0.0);

        assert_eq!(contact.surface_distance, 35.0);
        assert_eq!(contact.outward_normal, Vec2::new(1.0, 0.0));
    }

    #[test]
    fn the_surface_gap_between_two_obstacles_subtracts_both_radii() {
        let first = Obstacle::circle(Vec2::new(100.0, 100.0), 20.0, LIFETIME);
        let second = Obstacle::circle(Vec2::new(200.0, 100.0), 30.0, LIFETIME);

        assert_eq!(first.surface_gap_to(&second), 50.0);
        // Symmetric, or the corridor rule would depend on which one was placed first.
        assert_eq!(second.surface_gap_to(&first), 50.0);
    }

    #[test]
    fn overlapping_obstacles_report_a_negative_gap() {
        let first = Obstacle::circle(Vec2::new(100.0, 100.0), 40.0, LIFETIME);
        let second = Obstacle::circle(Vec2::new(150.0, 100.0), 40.0, LIFETIME);

        assert!(first.surface_gap_to(&second) < 0.0);
    }

    #[test]
    fn the_gap_to_the_world_edges_is_the_smallest_of_the_four() {
        let obstacle = Obstacle::circle(Vec2::new(100.0, 300.0), 20.0, LIFETIME);

        // 80 to the left edge, 300 - 20 = 280 to the top, and further to the others.
        assert_eq!(obstacle.surface_gap_to_world_edges(1000.0, 800.0), 80.0);
    }

    #[test]
    fn an_obstacle_poking_out_of_the_world_reports_a_negative_edge_gap() {
        let obstacle = Obstacle::circle(Vec2::new(10.0, 300.0), 40.0, LIFETIME);

        assert!(obstacle.surface_gap_to_world_edges(1000.0, 800.0) < 0.0);
    }

    #[test]
    fn a_bar_measures_its_edge_gap_from_whichever_end_is_closer() {
        let obstacle = Obstacle::new(
            Vec2::new(500.0, 400.0),
            Vec2::new(900.0, 400.0),
            10.0,
            LIFETIME,
        );

        // The right end sits at 910, so the right edge is the tight one.
        assert_eq!(obstacle.surface_gap_to_world_edges(1000.0, 800.0), 90.0);
    }

    #[test]
    fn an_obstacle_expires_after_exactly_its_lifetime_steps() {
        let mut obstacle = bar();

        for _ in 0..LIFETIME - 1 {
            obstacle.age_one_step();
            assert!(!obstacle.has_expired());
        }
        obstacle.age_one_step();

        assert!(obstacle.has_expired());
    }

    #[test]
    fn a_fresh_obstacle_has_no_hit_flash() {
        assert_eq!(bar().hit_flash(), 0.0);
    }

    #[test]
    fn a_hit_lights_the_flash_and_it_fades_out_on_its_own() {
        let mut obstacle = bar();

        obstacle.mark_player_hit();
        assert_eq!(obstacle.hit_flash(), 1.0);

        for _ in 0..OBSTACLE_HIT_FLASH_STEPS {
            obstacle.age_one_step();
        }

        assert_eq!(obstacle.hit_flash(), 0.0);
    }

    #[test]
    fn a_second_hit_restarts_the_flash() {
        // A player pressed against an obstacle collides every step, and the flash has
        // to stay lit for as long as that lasts instead of blinking out mid-contact.
        let mut obstacle = bar();

        obstacle.mark_player_hit();
        obstacle.age_one_step();
        assert!(obstacle.hit_flash() < 1.0);

        obstacle.mark_player_hit();

        assert_eq!(obstacle.hit_flash(), 1.0);
    }

    #[test]
    fn the_life_fraction_runs_from_one_down_to_zero() {
        let mut obstacle = bar();

        assert_eq!(obstacle.life_fraction(), 1.0);

        for _ in 0..LIFETIME / 2 {
            obstacle.age_one_step();
        }

        assert!((obstacle.life_fraction() - 0.5).abs() < 1e-5);
    }
}
