use super::shape::Obstacle;

// The materialising window of a new obstacle: the stretch of steps in which it is
// already drawn but cannot yet be collided with.
//
// Why it exists at all: an obstacle is placed at a distance from the player, but
// nothing stops the player from flying towards that spot in the same instant. An
// obstacle that was solid from its first step could therefore take a life away for a
// move the player had already committed to and could no longer see coming. The spawn
// animation was always meant to be the warning; this window is what makes the warning
// binding instead of decorative.
//
// The state itself sits on `Obstacle` and the rules live here, the same split the boid
// dash uses: `Boid` holds `dash_state` while `dash.rs` owns the machine. Everything
// that an obstacle *does* — blocking the player, turning boids away, pushing a boid
// back out — asks `is_armed` first. What it does not affect is placement: a
// materialising obstacle still takes up its room in the corridor rule, or a second one
// could be dropped on top of it while it appears.

/// Starts the materialising window of an obstacle that is about to join the world.
///
/// Zero steps leaves it solid straight away, which is what the hand-built obstacles in
/// the tests rely on.
pub fn begin_arming(obstacle: &mut Obstacle, arming_steps: u32) {
    obstacle.arming_steps = arming_steps;
    obstacle.remaining_arming_steps = arming_steps;
}

/// Whether this obstacle has finished materialising and is solid.
pub fn is_armed(obstacle: &Obstacle) -> bool {
    obstacle.remaining_arming_steps == 0
}

/// The single number the frontend draws an obstacle's whole life cycle from.
///
/// Negative while it materialises and positive once it is solid, so the sign carries
/// the state and no second value has to cross the boundary — the same trick
/// `dash_render_phase` uses for the boids:
///
/// - `-1.0` the step it appears, counting up towards `0` as the window closes. The
///   frontend fades it in over exactly this range, so what the player sees appearing is
///   what cannot hurt them yet.
/// - the remaining life fraction afterwards, from just under `1.0` down towards `0`,
///   which is what the closing fade is drawn from.
///
/// The two ranges cannot collide: an obstacle still materialising has at least one
/// arming step left, and one still standing has at least one step of life left, so
/// exactly `0.0` never occurs.
pub fn obstacle_render_phase(obstacle: &Obstacle) -> f32 {
    if obstacle.arming_steps > 0 && obstacle.remaining_arming_steps > 0 {
        return -(obstacle.remaining_arming_steps as f32 / obstacle.arming_steps as f32);
    }

    obstacle.life_fraction()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::math::vector::Vec2;

    const LIFETIME: u32 = 1200;
    const ARMING: u32 = 90;

    fn appearing_obstacle() -> Obstacle {
        let mut obstacle = Obstacle::circle(Vec2::new(300.0, 300.0), 40.0, LIFETIME);
        begin_arming(&mut obstacle, ARMING);

        obstacle
    }

    #[test]
    fn a_hand_built_obstacle_is_solid_from_the_start() {
        // Nothing gets a warning window by accident: it is put on at the one place an
        // obstacle joins the world, so every other obstacle behaves as it always did.
        let obstacle = Obstacle::circle(Vec2::new(300.0, 300.0), 40.0, LIFETIME);

        assert!(is_armed(&obstacle));
    }

    #[test]
    fn an_obstacle_that_just_appeared_is_not_solid_yet() {
        assert!(!is_armed(&appearing_obstacle()));
    }

    #[test]
    fn an_obstacle_becomes_solid_after_exactly_its_arming_window() {
        // The window is the player's reaction time, so it must be neither a step short
        // nor a step long.
        let mut obstacle = appearing_obstacle();

        for _ in 0..ARMING - 1 {
            obstacle.age_one_step();
            assert!(!is_armed(&obstacle));
        }
        obstacle.age_one_step();

        assert!(is_armed(&obstacle));
    }

    #[test]
    fn an_empty_arming_window_leaves_the_obstacle_solid() {
        let mut obstacle = Obstacle::circle(Vec2::new(300.0, 300.0), 40.0, LIFETIME);

        begin_arming(&mut obstacle, 0);

        assert!(is_armed(&obstacle));
    }

    #[test]
    fn the_render_phase_starts_at_minus_one_and_climbs_towards_zero() {
        // What the frontend fades in from. Starting at exactly -1 is what makes the
        // obstacle invisible on the frame it appears rather than popping in half solid.
        let mut obstacle = appearing_obstacle();

        assert_eq!(obstacle_render_phase(&obstacle), -1.0);

        for _ in 0..ARMING / 2 {
            obstacle.age_one_step();
        }

        assert!((obstacle_render_phase(&obstacle) + 0.5).abs() < 1e-5);
    }

    #[test]
    fn the_render_phase_stays_negative_for_the_whole_window() {
        // The sign is the only thing telling the two phases apart, so a single step
        // reported with the wrong one would draw a materialising obstacle as solid.
        let mut obstacle = appearing_obstacle();

        for _ in 0..ARMING - 1 {
            assert!(obstacle_render_phase(&obstacle) < 0.0);
            obstacle.age_one_step();
        }

        assert!(obstacle_render_phase(&obstacle) < 0.0);
    }

    #[test]
    fn the_render_phase_becomes_the_remaining_life_once_the_obstacle_is_solid() {
        let mut obstacle = appearing_obstacle();

        for _ in 0..ARMING {
            obstacle.age_one_step();
        }

        assert!(obstacle_render_phase(&obstacle) > 0.0);
        assert_eq!(obstacle_render_phase(&obstacle), obstacle.life_fraction());
    }
}
