use super::boid::Boid;
use super::obstacle::Obstacle;
use super::obstacle_collision::resolve_movement_against_obstacles;
use crate::constants::{BOID_COLLISION_RADIUS, BOID_OBSTACLE_BOUNCE};
use crate::math::vector::Vec2;

// What an obstacle does to a boid that *moved* into it: the same thing it does to the
// player. The step is cut short at the surface and the velocity bounces off it.
//
// This is the third of the three obstacle-versus-boid files, and the seam between them is
// which question each answers:
//
//  - `obstacle_collision.rs` — the geometry of a move against a surface. Shared with the
//    player, and the only place the swept test lives.
//  - this file — the boid's own collision: it turns that geometry into a new position and
//    a bounced velocity.
//  - `obstacle_pushout.rs` — the safety net for a boid that never moved into anything but
//    was *displaced* into it, by an obstacle appearing on top of it or by the overlap
//    relaxation nudging it in.
//
// Steering (`rules::avoid_obstacles`) is still what makes a boid go *round* an obstacle,
// and this bounce is deliberately not a substitute for it: a boid that relied on being
// stopped would grind along the surface. What the bounce adds is the guarantee steering
// cannot give, and the reason it exists at all — a **dashing** boid does not steer around
// anything. Its dash line is frozen at launch and obstacle avoidance is switched off for
// it, so until this check existed a dash went straight through a solid bar.

/// Cuts a boid's step short at the obstacle it ran into and bounces its velocity off it.
///
/// Call once per boid per step, right after `integrate` and before the world wrap:
/// `previous_position` is where the boid stood before that integration, and the whole
/// move between the two is tested rather than only its end. That is what stops a dashing
/// boid — 10 units per step and more — from crossing a thin bar between two steps.
///
/// Before the wrap on purpose. A boid that leaves the world is put back in on the far
/// side, and a move tested across that jump would be a segment right through the middle
/// of the arena, colliding with everything on the way.
///
/// The bounce keeps `BOID_OBSTACLE_BOUNCE` of the speed that went into the surface and
/// keeps all of the speed that ran along it, which is what makes a boid slide off a bar
/// it hits at an angle instead of sticking to it. A dash is not cancelled by the impact:
/// the boid keeps its raised speed cap for the rest of its dash steps and rebounds
/// visibly, which reads as the lunge having been repelled rather than swallowed.
pub fn bounce_boid_off_obstacles(obstacles: &[Obstacle], boid: &mut Boid, previous_position: Vec2) {
    let resolution = resolve_movement_against_obstacles(
        obstacles,
        previous_position,
        boid.position,
        BOID_COLLISION_RADIUS,
    );

    if !resolution.blocked {
        return;
    }

    boid.position = resolution.position;
    boid.velocity = bounced_velocity(boid.velocity, resolution.surface_normal);
}

/// The velocity a boid leaves a surface with, given the outward normal at the contact.
///
/// Kept as its own function because it is the one piece of arithmetic here, and because
/// it has to stay a no-op for a boid already moving away: the normal points back at the
/// side the boid came from, so a velocity that already points outwards must not be
/// touched. Reflecting it anyway would drive the boid back into the obstacle on the very
/// next step, which is the shape of the bug the player's knockback distance exists for.
fn bounced_velocity(velocity: Vec2, surface_normal: Vec2) -> Vec2 {
    let into_the_surface = velocity.dot(surface_normal);

    if into_the_surface >= 0.0 {
        return velocity;
    }

    // Take the whole component heading into the surface away, then give a share of it
    // back the other way. The component along the surface is never touched.
    let removed_and_reversed = into_the_surface * (1.0 + BOID_OBSTACLE_BOUNCE);

    velocity.sub(surface_normal.scale(removed_and_reversed))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::simulation::dash::{is_dashing, DashState};
    use crate::simulation::flock::Flock;
    use crate::simulation::obstacle_arming::begin_arming;

    const LIFETIME: u32 = 1800;
    const ARMING: u32 = 90;

    /// A boid mid-dash, flying along `velocity`.
    fn dashing_boid(position: Vec2, velocity: Vec2) -> Boid {
        let mut boid = Boid::new(position, velocity);
        boid.dash_state = DashState::Dashing;
        boid.dash_state_steps_remaining = 18;

        boid
    }

    /// Applies one step of `velocity` and resolves it, the way the flock loop does.
    fn step(obstacles: &[Obstacle], boid: &mut Boid) {
        let previous_position = boid.position;
        boid.position = boid.position.add(boid.velocity);
        bounce_boid_off_obstacles(obstacles, boid, previous_position);
    }

    #[test]
    fn a_dash_straight_through_a_thin_bar_is_stopped_on_the_near_side() {
        // The bug this file was written for: a dash covers far more ground in one step
        // than a bar is thick, so testing only the end point found open space on both
        // sides and let the boid through.
        let bar = Obstacle::new(
            Vec2::new(300.0, 100.0),
            Vec2::new(300.0, 500.0),
            13.0,
            LIFETIME,
        );
        let mut boid = dashing_boid(Vec2::new(270.0, 300.0), Vec2::new(60.0, 0.0));

        step(&[bar], &mut boid);

        assert!(
            boid.position.x < 300.0,
            "the dashing boid came out at {} on the far side",
            boid.position.x
        );
    }

    #[test]
    fn the_bounced_velocity_points_away_from_the_obstacle() {
        let obstacle = Obstacle::circle(Vec2::new(300.0, 300.0), 40.0, LIFETIME);
        let mut boid = dashing_boid(Vec2::new(240.0, 300.0), Vec2::new(30.0, 0.0));

        step(&[obstacle], &mut boid);

        // Came in from the left, so it has to leave to the left — and at a fraction of
        // the speed it arrived with rather than mirrored at full force.
        assert!(boid.velocity.x < 0.0);
        assert!((boid.velocity.x - -30.0 * BOID_OBSTACLE_BOUNCE).abs() < 1e-3);
    }

    #[test]
    fn a_dash_that_hits_an_obstacle_keeps_dashing() {
        // The dash is repelled, not cancelled: the boid spends its remaining dash steps
        // flying away from what it hit, which is what a bounce looks like.
        let obstacle = Obstacle::circle(Vec2::new(300.0, 300.0), 40.0, LIFETIME);
        let mut boid = dashing_boid(Vec2::new(240.0, 300.0), Vec2::new(30.0, 0.0));

        step(&[obstacle], &mut boid);

        assert!(is_dashing(&boid));
    }

    #[test]
    fn a_boid_that_hits_nothing_keeps_its_position_and_velocity() {
        let obstacle = Obstacle::circle(Vec2::new(300.0, 300.0), 40.0, LIFETIME);
        let mut boid = Boid::new(Vec2::new(800.0, 800.0), Vec2::new(3.0, 0.0));

        step(&[obstacle], &mut boid);

        assert_eq!(boid.position, Vec2::new(803.0, 800.0));
        assert_eq!(boid.velocity, Vec2::new(3.0, 0.0));
    }

    #[test]
    fn a_boid_ends_up_outside_the_obstacle_it_hit() {
        let centre = Vec2::new(300.0, 300.0);
        let obstacle = Obstacle::circle(centre, 40.0, LIFETIME);
        let mut boid = dashing_boid(Vec2::new(240.0, 300.0), Vec2::new(70.0, 0.0));

        step(&[obstacle], &mut boid);

        let contact = obstacle.contact_with_point(boid.position, BOID_COLLISION_RADIUS);
        assert!(contact.surface_distance > 0.0);
    }

    #[test]
    fn an_obstacle_that_is_still_materialising_lets_a_boid_through() {
        // The same fair-play window the player gets. A boid that has already committed to
        // a dash must not be stopped by something that is not there yet, or the arrival
        // of an obstacle would silently change the flock's paths mid-flight.
        let mut appearing = Obstacle::circle(Vec2::new(300.0, 300.0), 40.0, LIFETIME);
        begin_arming(&mut appearing, ARMING);
        let mut boid = dashing_boid(Vec2::new(240.0, 300.0), Vec2::new(70.0, 0.0));

        step(&[appearing], &mut boid);

        assert_eq!(boid.position, Vec2::new(310.0, 300.0));
        assert_eq!(boid.velocity, Vec2::new(70.0, 0.0));
    }

    #[test]
    fn a_boid_dashing_along_a_bar_keeps_its_speed_along_it() {
        // Sliding rather than stopping. A lunge that grazes a bar has to carry on past
        // it; losing the whole velocity on contact would make every bar a wall.
        let bar = Obstacle::new(
            Vec2::new(200.0, 300.0),
            Vec2::new(600.0, 300.0),
            20.0,
            LIFETIME,
        );
        // Flying mostly along the bar and only slightly into it, so it is a graze
        // rather than a head-on hit.
        let mut boid = dashing_boid(Vec2::new(300.0, 272.0), Vec2::new(30.0, 4.0));

        step(&[bar], &mut boid);

        assert!((boid.velocity.x - 30.0).abs() < 1e-3);
        assert!(boid.velocity.y < 0.0);
    }

    #[test]
    fn dashing_into_an_obstacle_for_many_steps_never_ends_up_inside_it() {
        // The counterpart of the player's stuck test. Whatever the bounce leaves behind
        // has to be a position the next step can leave from.
        let centre = Vec2::new(300.0, 300.0);
        let obstacle = Obstacle::circle(centre, 40.0, LIFETIME);
        let mut boid = dashing_boid(Vec2::new(200.0, 300.0), Vec2::new(30.0, 0.0));

        for _ in 0..200 {
            // Re-aimed at the obstacle every step, so the bounce never gets to save the
            // boid by simply sending it away for good.
            boid.velocity = centre.sub(boid.position).normalize().scale(30.0);
            step(&[obstacle], &mut boid);

            let contact = obstacle.contact_with_point(boid.position, BOID_COLLISION_RADIUS);
            assert!(
                contact.surface_distance > 0.0,
                "the boid ended up inside the obstacle at {:?}",
                boid.position
            );
        }
    }

    #[test]
    fn a_dashing_boid_in_a_real_flock_step_never_crosses_an_obstacle() {
        // The wiring, not the arithmetic: the flock loop has to hand over the position
        // from *before* its integration, and this is the only test that would notice if
        // it passed the position after it instead — the sweep would then be zero length
        // and every one of the tests above would still pass. It lives here rather than in
        // `flock.rs` because that file is already at its length limit.
        let bar = Obstacle::new(
            Vec2::new(500.0, 300.0),
            Vec2::new(500.0, 700.0),
            13.0,
            LIFETIME,
        );
        let mut flock = Flock::new();

        // A dash fast enough to clear the whole bar in a single step, which is exactly
        // the case a test of the end position alone cannot catch.
        let mut boid = dashing_boid(Vec2::new(400.0, 500.0), Vec2::new(78.0, 0.0));
        boid.properties.max_speed = 30.0;
        boid.dash_state_steps_remaining = 60;
        flock.add(boid);

        // The player sits on the far side, so nothing about the boid's own steering wants
        // it to stay where it is.
        let player = Vec2::new(700.0, 500.0);

        // Deliberately fewer steps than it takes the rebounding boid to reach the left
        // world edge: past that it wraps to the right-hand side, legitimately, and would
        // look exactly like the crossing this asserts against.
        for _ in 0..12 {
            flock.update(player, &[bar], 1000.0, 1000.0);
            let position = flock.boids[0].position;

            // The near side, and not merely "not inside": a boid that tunnels through
            // ends up outside as well, on the wrong side. Only the crossing itself tells
            // the two apart, which is why this is the assertion and the surface distance
            // is only the second half of it.
            assert!(
                position.x < 500.0,
                "the boid crossed the bar and reached {position:?}"
            );

            let contact = bar.contact_with_point(position, BOID_COLLISION_RADIUS);
            assert!(
                contact.surface_distance > 0.0,
                "the boid ended up {} inside the bar",
                -contact.surface_distance
            );
        }
    }

    #[test]
    fn boids_steer_around_an_obstacle_instead_of_pressing_into_it() {
        // The other half of the statement this file makes, and the reason it sits next to
        // the bounce: **steering** is what gets a boid round an obstacle, and the bounce is
        // only what happens when it fails to. A boid chasing a player on the far side of a
        // bar has to find its way past, and it has to do so without ever touching the
        // surface — a boid that relied on being stopped would visibly grind along it.
        let bar = Obstacle::new(
            Vec2::new(500.0, 200.0),
            Vec2::new(500.0, 600.0),
            15.0,
            LIFETIME,
        );
        let obstacles = [bar];
        let mut flock = Flock::new();
        flock.add(Boid::new(Vec2::new(300.0, 400.0), Vec2::new(3.0, 0.0)));

        let player = Vec2::new(700.0, 400.0);
        let mut nearest_approach = f32::MAX;

        for _ in 0..240 {
            flock.update(player, &obstacles, 1000.0, 1000.0);

            let contact = bar.contact_with_point(flock.boids[0].position, 0.0);
            nearest_approach = nearest_approach.min(contact.surface_distance);

            // Never inside, at any point along the way.
            assert!(
                contact.surface_distance >= -1e-3,
                "a boid ended up {} inside the obstacle",
                -contact.surface_distance
            );
        }

        // It got close enough for the rule to matter, so the test is not passing
        // simply because the boid never went near the bar.
        assert!(nearest_approach < 60.0);
        // And it made it around: past the bar, or at least clear of the line it sat on.
        let travelled_past = flock.boids[0].position.y < 200.0 || flock.boids[0].position.y > 600.0;
        assert!(
            flock.boids[0].position.x > 515.0 || travelled_past,
            "the boid never got past the obstacle"
        );
    }

    #[test]
    fn a_boid_leaving_a_surface_it_stands_on_keeps_its_velocity() {
        // The normal points back the way the boid came, so a velocity already heading
        // outwards must be left alone. Reflecting it would push the boid back in.
        let outwards = Vec2::new(-3.0, 0.0);

        assert_eq!(bounced_velocity(outwards, Vec2::new(-1.0, 0.0)), outwards);
    }
}
