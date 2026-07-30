use super::boid::Boid;
use super::dash::is_dashing;
use super::obstacle::Obstacle;
use crate::math::segment::{closest_point_on_segment, distance_between_segments};
use crate::math::vector::Vec2;

// What obstacles do to the things that move: they stop the player and they turn boids
// out of their inside. Kept apart from `obstacle_field.rs`, which is only about which
// obstacles exist and for how long.
//
// Both functions take a plain slice rather than the field, so the flock never has to
// know that obstacles come and go — it only ever sees the ones standing right now.

/// What became of a player move that was tested against the obstacles.
pub struct PlayerResolution {
    /// Where the player actually ends up, which is the attempted position unless an
    /// obstacle was in the way.
    pub position: Vec2,
    /// Whether an obstacle was hit and a life should be spent.
    pub blocked: bool,
    /// The surface normal at the point of contact, so the caller can strip the
    /// component of its velocity that runs into the obstacle and keep the rest. Zero
    /// when nothing was hit.
    pub surface_normal: Vec2,
}

/// Tests a player move against the obstacles and slides it along anything it hits.
///
/// The move is treated as the segment from `previous` to `attempted`, not as the end
/// point alone. That is what keeps a dashing player from crossing a thin obstacle
/// between two simulation steps: a point test would find open space on both sides and
/// never notice the obstacle in between.
pub fn resolve_player_movement(
    obstacles: &[Obstacle],
    previous: Vec2,
    attempted: Vec2,
    player_radius: f32,
) -> PlayerResolution {
    let mut position = attempted;
    let mut blocked = false;
    let mut surface_normal = Vec2::zero();

    for obstacle in obstacles {
        // The swept path against the obstacle's centre line. Anything closer than both
        // radii combined means the player went through the obstacle.
        let swept_distance =
            distance_between_segments(previous, position, obstacle.spine_start, obstacle.spine_end);

        if swept_distance >= obstacle.radius + player_radius {
            continue;
        }

        blocked = true;
        let contact = obstacle.contact_with_point(position, player_radius);

        if contact.surface_distance < 0.0 {
            // The ordinary case: the move ended inside the obstacle. Pushing straight
            // out along the normal is what makes this a slide rather than a stop — only
            // the part of the move that ran into the surface is taken away, and the
            // sideways progress along it survives.
            position = contact.surface_point;
            surface_normal = contact.outward_normal;
            continue;
        }

        // The move ended in open space but the path crossed the obstacle on the way:
        // the player tunnelled through. Pushing out along the normal here would finish
        // the job and put them out the far side, so the side they *came from* decides.
        let entry = obstacle.contact_with_point(previous, player_radius);
        let spine_point =
            closest_point_on_segment(position, obstacle.spine_start, obstacle.spine_end);
        position = spine_point.add(entry.outward_normal.scale(obstacle.radius + player_radius));
        surface_normal = entry.outward_normal;
    }

    PlayerResolution {
        position,
        blocked,
        surface_normal,
    }
}

/// Moves any boid that ended up inside an obstacle back onto its surface.
///
/// Steering alone cannot cover the case where an obstacle appears on top of a boid, and
/// the overlap relaxation between boids can push one into an obstacle, so this has to
/// run after it. A dashing boid is left alone, exactly as it is left alone by that
/// relaxation: its dash is a straight line by design and is over within a fixed number
/// of steps, so it cannot get stuck.
pub fn push_boids_out_of_obstacles(obstacles: &[Obstacle], boids: &mut [Boid]) {
    for boid in boids.iter_mut() {
        if is_dashing(boid) {
            continue;
        }

        for obstacle in obstacles {
            let contact = obstacle.contact_with_point(boid.position, 0.0);

            if contact.surface_distance < 0.0 {
                boid.position = contact.surface_point;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::constants::PLAYER_COLLISION_RADIUS;
    use crate::simulation::dash::{begin_dash_charge, DashState};

    const LIFETIME: u32 = 1800;

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
    fn a_player_moving_into_an_obstacle_is_pushed_onto_its_surface() {
        let centre = Vec2::new(300.0, 300.0);
        let into = Vec2::new(290.0, 300.0);

        let resolution = resolve(
            Obstacle::circle(centre, 40.0, LIFETIME),
            Vec2::new(200.0, 300.0),
            into,
        );

        assert!(resolution.blocked);
        // Exactly one inflated radius out from the centre, on the side it came from.
        let distance = resolution.position.distance_to(centre);
        assert!((distance - (40.0 + PLAYER_COLLISION_RADIUS)).abs() < 1e-3);
        assert!(resolution.position.x < into.x);
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

    #[test]
    fn a_boid_inside_an_obstacle_is_pushed_out() {
        let centre = Vec2::new(300.0, 300.0);
        let obstacles = [Obstacle::circle(centre, 40.0, LIFETIME)];
        let mut boids = vec![Boid::new(Vec2::new(310.0, 300.0), Vec2::new(1.0, 0.0))];

        push_boids_out_of_obstacles(&obstacles, &mut boids);

        assert!((boids[0].position.distance_to(centre) - 40.0).abs() < 1e-3);
    }

    #[test]
    fn a_boid_outside_an_obstacle_is_left_where_it_is() {
        let obstacles = [Obstacle::circle(Vec2::new(300.0, 300.0), 40.0, LIFETIME)];
        let outside = Vec2::new(500.0, 300.0);
        let mut boids = vec![Boid::new(outside, Vec2::new(1.0, 0.0))];

        push_boids_out_of_obstacles(&obstacles, &mut boids);

        assert_eq!(boids[0].position, outside);
    }

    #[test]
    fn a_dashing_boid_is_not_pushed_out() {
        // A dash is a committed straight line with a fixed length, so it cannot get
        // stuck and does not need rescuing. The same exemption already applies to the
        // boid-versus-boid overlap relaxation.
        let obstacles = [Obstacle::circle(Vec2::new(300.0, 300.0), 40.0, LIFETIME)];
        let inside = Vec2::new(310.0, 300.0);
        let mut boid = Boid::new(inside, Vec2::new(1.0, 0.0));
        begin_dash_charge(&mut boid);
        boid.dash_state = DashState::Dashing;
        let mut boids = vec![boid];

        push_boids_out_of_obstacles(&obstacles, &mut boids);

        assert_eq!(boids[0].position, inside);
    }
}
