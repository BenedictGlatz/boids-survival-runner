use super::obstacle::Obstacle;
use super::obstacle_arming::is_armed;
use crate::constants::PLAYER_OBSTACLE_KNOCKBACK_DISTANCE;
use crate::math::segment::{closest_point_on_segment, distance_between_segments};
use crate::math::vector::Vec2;

// What an obstacle does to the player: it stops the move that ran into it. Kept apart
// from `obstacle_field.rs`, which is only about which obstacles exist and for how long,
// and from `obstacle_pushout.rs`, which is the same question for the boids.
//
// This takes a plain slice rather than the field, so the caller never has to know that
// obstacles come and go — it only ever sees the ones standing right now.

/// What became of a player move that was tested against the obstacles.
pub struct PlayerResolution {
    /// Where the player actually ends up, which is the attempted position unless an
    /// obstacle was in the way.
    pub position: Vec2,
    /// Whether an obstacle was hit and a life should be spent.
    pub blocked: bool,
    /// The surface normal at the point of contact, pointing back at the side the
    /// player came from, so the caller can bounce its velocity off it. Zero when
    /// nothing was hit.
    pub surface_normal: Vec2,
    /// Which obstacle was hit, as an index into the slice that was passed in, so the
    /// caller can light it up. `None` when nothing was hit.
    ///
    /// An index rather than a mutable borrow of the obstacle: this function stays a
    /// read-only test of the geometry, and marking the hit is the caller's business.
    pub hit_obstacle: Option<usize>,
}

/// Tests a player move against the obstacles and pushes it back out of anything it hit.
///
/// The move is treated as the segment from `previous` to `attempted`, not as the end
/// point alone. That is what keeps a dashing player from crossing a thin obstacle
/// between two simulation steps: a point test would find open space on both sides and
/// never notice the obstacle in between.
///
/// A blocked player is placed `PLAYER_OBSTACLE_KNOCKBACK_DISTANCE` clear of the
/// obstacle's inflated surface, on the side they came from. Both halves of that matter:
///
/// - **The side they came from**, because the end of the move is no guide. A dash can
///   finish deep inside the obstacle or all the way through it, and pushing out along
///   the nearest normal would then shove the player out the far side.
/// - **Clear of the surface rather than on it**, because a player standing exactly on
///   the surface is at the distance the next test reads as a touch again — even for a
///   move leading straight away from the obstacle, whose swept path still starts on the
///   surface. That correction put the player back every step and is what made it
///   possible to get stuck in an obstacle.
pub fn resolve_player_movement(
    obstacles: &[Obstacle],
    previous: Vec2,
    attempted: Vec2,
    player_radius: f32,
) -> PlayerResolution {
    let mut position = attempted;
    let mut blocked = false;
    let mut surface_normal = Vec2::zero();
    let mut hit_obstacle = None;

    for (index, obstacle) in obstacles.iter().enumerate() {
        // An obstacle that is still materialising is drawn but not there yet: flying
        // through it during its warning window is allowed and costs nothing.
        if !is_armed(obstacle) {
            continue;
        }

        // The swept path against the obstacle's centre line. Anything closer than both
        // radii combined means the player touched or entered the obstacle somewhere
        // along the way, whether or not the move ended inside it.
        let swept_distance =
            distance_between_segments(previous, position, obstacle.spine_start, obstacle.spine_end);

        if swept_distance >= obstacle.radius + player_radius {
            continue;
        }

        blocked = true;
        hit_obstacle = Some(index);

        // The direction the player is pushed back in, decided by where they were before
        // the move rather than by where it ended.
        let entry = obstacle.contact_with_point(previous, player_radius);
        let spine_point =
            closest_point_on_segment(position, obstacle.spine_start, obstacle.spine_end);
        let standoff = obstacle.radius + player_radius + PLAYER_OBSTACLE_KNOCKBACK_DISTANCE;

        position = spine_point.add(entry.outward_normal.scale(standoff));
        surface_normal = entry.outward_normal;
    }

    PlayerResolution {
        position,
        blocked,
        surface_normal,
        hit_obstacle,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::constants::{PLAYER_COLLISION_RADIUS, PLAYER_OBSTACLE_KNOCKBACK_DISTANCE};
    use crate::simulation::obstacle_arming::begin_arming;

    const LIFETIME: u32 = 1800;
    const ARMING: u32 = 90;

    fn resolve(obstacle: Obstacle, from: Vec2, to: Vec2) -> PlayerResolution {
        resolve_player_movement(&[obstacle], from, to, PLAYER_COLLISION_RADIUS)
    }

    #[test]
    fn a_move_that_stays_clear_is_left_alone() {
        let obstacle = Obstacle::circle(Vec2::new(300.0, 300.0), 40.0, LIFETIME);
        let to = Vec2::new(810.0, 800.0);

        let resolution = resolve(obstacle, Vec2::new(800.0, 800.0), to);

        assert_eq!(resolution.position, to);
        assert!(!resolution.blocked);
    }

    #[test]
    fn a_world_without_obstacles_never_blocks() {
        let to = Vec2::new(120.0, 140.0);

        let resolution =
            resolve_player_movement(&[], Vec2::new(100.0, 140.0), to, PLAYER_COLLISION_RADIUS);

        assert_eq!(resolution.position, to);
        assert!(!resolution.blocked);
        assert_eq!(resolution.surface_normal, Vec2::zero());
    }

    #[test]
    fn an_obstacle_that_is_still_materialising_does_not_block_the_player() {
        // The unfair death this window exists to prevent: an obstacle appearing right in
        // front of a player who is already moving must not cost a life. During its spawn
        // animation the player passes straight through and keeps the position asked for.
        let centre = Vec2::new(300.0, 300.0);
        let mut appearing = Obstacle::circle(centre, 40.0, LIFETIME);
        begin_arming(&mut appearing, ARMING);
        let through = Vec2::new(300.0, 300.0);

        let resolution = resolve(appearing, Vec2::new(200.0, 300.0), through);

        assert!(!resolution.blocked);
        assert_eq!(resolution.position, through);
        assert_eq!(resolution.hit_obstacle, None);
    }

    #[test]
    fn the_same_obstacle_blocks_the_player_once_it_has_materialised() {
        // The other half of the pair: the window has to end, or an obstacle would stay a
        // decoration for the rest of its life.
        let centre = Vec2::new(300.0, 300.0);
        let mut obstacle = Obstacle::circle(centre, 40.0, LIFETIME);
        begin_arming(&mut obstacle, ARMING);

        for _ in 0..ARMING {
            obstacle.age_one_step();
        }
        let resolution = resolve(obstacle, Vec2::new(200.0, 300.0), Vec2::new(290.0, 300.0));

        assert!(resolution.blocked);
    }

    #[test]
    fn a_player_moving_into_an_obstacle_is_pushed_clear_of_it() {
        let centre = Vec2::new(300.0, 300.0);
        let into = Vec2::new(290.0, 300.0);

        let resolution = resolve(
            Obstacle::circle(centre, 40.0, LIFETIME),
            Vec2::new(200.0, 300.0),
            into,
        );

        assert!(resolution.blocked);
        // One inflated radius plus the knockback out from the centre, on the side it
        // came from. The knockback is what keeps the player off the surface itself.
        let distance = resolution.position.distance_to(centre);
        let standoff = 40.0 + PLAYER_COLLISION_RADIUS + PLAYER_OBSTACLE_KNOCKBACK_DISTANCE;
        assert!((distance - standoff).abs() < 1e-3);
        assert!(resolution.position.x < into.x);
    }

    #[test]
    fn the_obstacle_that_was_hit_is_reported_by_index() {
        // What the engine lights up in red, so it has to be the one that was hit and
        // not merely some obstacle in the world.
        let obstacles = [
            Obstacle::circle(Vec2::new(900.0, 900.0), 40.0, LIFETIME),
            Obstacle::circle(Vec2::new(300.0, 300.0), 40.0, LIFETIME),
        ];

        let resolution = resolve_player_movement(
            &obstacles,
            Vec2::new(200.0, 300.0),
            Vec2::new(290.0, 300.0),
            PLAYER_COLLISION_RADIUS,
        );

        assert_eq!(resolution.hit_obstacle, Some(1));
    }

    #[test]
    fn a_move_that_hits_nothing_reports_no_obstacle() {
        let obstacles = [Obstacle::circle(Vec2::new(300.0, 300.0), 40.0, LIFETIME)];

        let resolution = resolve_player_movement(
            &obstacles,
            Vec2::new(800.0, 800.0),
            Vec2::new(810.0, 800.0),
            PLAYER_COLLISION_RADIUS,
        );

        assert_eq!(resolution.hit_obstacle, None);
    }

    #[test]
    fn a_blocked_player_can_move_away_again_on_the_very_next_step() {
        // The stuck bug, as a test. Placing the player exactly on the surface left them
        // at the distance the next test reads as a touch, so even a move pointing
        // straight away was corrected back — every step, for as long as they tried.
        let centre = Vec2::new(300.0, 300.0);
        let obstacle = Obstacle::circle(centre, 40.0, LIFETIME);

        let blocked = resolve(obstacle, Vec2::new(200.0, 300.0), Vec2::new(290.0, 300.0));
        let away = Vec2::new(blocked.position.x - 4.0, blocked.position.y);
        let leaving = resolve(obstacle, blocked.position, away);

        assert!(!leaving.blocked, "leaving an obstacle must not be blocked");
        assert_eq!(leaving.position, away);
    }

    #[test]
    fn steering_into_an_obstacle_for_many_steps_never_ends_up_inside_it() {
        // The second half of the same bug: holding a direction into an obstacle used to
        // glue the player to it. Each step has to end outside, no matter how many pass.
        let centre = Vec2::new(300.0, 300.0);
        let obstacle = Obstacle::circle(centre, 40.0, LIFETIME);
        let mut position = Vec2::new(200.0, 300.0);

        for _ in 0..200 {
            // A step of ordinary walking speed, straight at the centre.
            let attempted = Vec2::new(position.x + 6.0, position.y);
            position = resolve(obstacle, position, attempted).position;

            assert!(
                position.distance_to(centre) > 40.0 + PLAYER_COLLISION_RADIUS,
                "player ended inside the obstacle at {position:?}"
            );
        }
    }

    #[test]
    fn a_dash_straight_into_an_obstacle_leaves_the_player_outside_and_short_of_it() {
        // A dash covers far more ground in one step than the obstacle is wide, so the
        // move both enters and leaves it. The player has to end up back on the near
        // side rather than inside or through.
        let centre = Vec2::new(300.0, 300.0);
        let obstacle = Obstacle::circle(centre, 30.0, LIFETIME);

        let resolution = resolve(obstacle, Vec2::new(220.0, 300.0), Vec2::new(380.0, 300.0));

        assert!(resolution.blocked);
        assert!(resolution.position.x < centre.x);
        assert!(resolution.position.distance_to(centre) > 30.0 + PLAYER_COLLISION_RADIUS);
    }

    #[test]
    fn the_reported_normal_points_back_at_the_player() {
        let resolution = resolve(
            Obstacle::circle(Vec2::new(300.0, 300.0), 40.0, LIFETIME),
            Vec2::new(200.0, 300.0),
            Vec2::new(290.0, 300.0),
        );

        // Coming from the left, so the surface normal has to point left.
        assert!(resolution.surface_normal.x < 0.0);
        assert!((resolution.surface_normal.length() - 1.0).abs() < 1e-5);
    }

    #[test]
    fn a_grazing_move_keeps_its_tangential_direction() {
        // The difference between sliding and stopping. Brushing along a bar has to leave
        // the player's progress along it almost untouched.
        let bar = Obstacle::new(
            Vec2::new(200.0, 300.0),
            Vec2::new(600.0, 300.0),
            20.0,
            LIFETIME,
        );
        let along = Vec2::new(320.0, 328.0);

        let resolution = resolve(bar, Vec2::new(300.0, 330.0), along);

        assert!(resolution.blocked);
        // Pushed off the bar in y, but the travel along x survives.
        assert!((resolution.position.x - along.x).abs() < 1e-3);
        assert!(resolution.position.y > along.y);
    }

    #[test]
    fn a_dash_length_move_cannot_tunnel_through_an_obstacle() {
        // A dash covers about 18 pixels in one step. Testing only the end point would
        // find open space on both sides of a thin bar and let the player straight
        // through it, which is why the swept segment is tested instead.
        let bar = Obstacle::new(
            Vec2::new(300.0, 100.0),
            Vec2::new(300.0, 500.0),
            13.0,
            LIFETIME,
        );

        let resolution = resolve(bar, Vec2::new(270.0, 300.0), Vec2::new(330.0, 300.0));

        assert!(resolution.blocked);
        // Stopped on the near side rather than emerging on the far side.
        assert!(resolution.position.x < 300.0);
    }
}
