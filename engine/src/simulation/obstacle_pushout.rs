use super::boid::Boid;
use super::dash::is_dashing;
use super::obstacle::Obstacle;
use super::obstacle_arming::is_armed;

// The safety net that frees a boid caught inside an obstacle. Split off from
// `obstacle_collision.rs` for length alone, along the seam that file's header already
// described: what obstacles do to the *player* is a movement test with a resolution,
// and what they do to the *boids* is this one correction.
//
// Like the player test it takes a plain slice rather than the field, so the flock never
// has to know that obstacles come and go — it only ever sees the ones standing.

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
            // Nothing to be pushed out of while an obstacle is still materialising. A
            // boid caught inside one when its window closes is freed on that step, which
            // is the case this function existed for in the first place.
            if !is_armed(obstacle) {
                continue;
            }

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
    use crate::math::vector::Vec2;
    use crate::simulation::dash::{begin_dash_charge, DashState};
    use crate::simulation::obstacle_arming::begin_arming;

    const LIFETIME: u32 = 1800;
    const ARMING: u32 = 90;

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

    #[test]
    fn a_boid_inside_an_obstacle_that_is_still_materialising_is_left_alone() {
        // A boid must not be flung out of something that is not there yet — it is freed
        // on the step the window closes instead.
        let mut appearing = Obstacle::circle(Vec2::new(300.0, 300.0), 40.0, LIFETIME);
        begin_arming(&mut appearing, ARMING);
        let inside = Vec2::new(310.0, 300.0);
        let mut boids = vec![Boid::new(inside, Vec2::new(1.0, 0.0))];

        push_boids_out_of_obstacles(&[appearing], &mut boids);

        assert_eq!(boids[0].position, inside);
    }
}
