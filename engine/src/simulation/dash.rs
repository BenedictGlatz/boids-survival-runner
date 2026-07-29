use super::boid::Boid;
use crate::math::vector::Vec2;

// Re-exported so everything about the dash can be reached through this one module.
pub use super::dash_properties::{dash_properties_for_difficulty_tier, DashProperties};

/// Which part of the dash cycle a boid is currently in.
///
/// The four values always follow each other in the same order:
/// `Idle` -> `Charging` -> `Dashing` -> `Cooling` -> `Idle`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum DashState {
    /// Flocking normally and free to be picked for the next dash.
    Idle,
    /// Visibly pulsing before the dash. Still flocks and steers normally.
    Charging,
    /// Flying along the frozen dash line at a raised speed.
    Dashing,
    /// Flocking normally again, but not allowed to dash yet.
    Cooling,
}

/// True while the boid is flying along its dash line.
pub fn is_dashing(boid: &Boid) -> bool {
    boid.dash_state == DashState::Dashing
}

/// Puts an idle boid into its charge-up.
///
/// Boids that cannot dash or are already busy with one are ignored, so callers do
/// not have to repeat those checks.
pub fn begin_dash_charge(boid: &mut Boid) {
    if !boid.properties.dash.can_dash || boid.dash_state != DashState::Idle {
        return;
    }

    boid.dash_state = DashState::Charging;
    boid.dash_state_steps_remaining = boid.properties.dash.charge_steps;
}

/// Advances the dash cycle by exactly one simulation step.
///
/// `player_position` is read only in the single step where the dash launches.
/// From then on the velocity is left alone, and that is what makes a dash a
/// straight line the player can read and dodge.
pub fn advance_dash_state(boid: &mut Boid, player_position: Vec2) {
    if boid.dash_state == DashState::Idle {
        return;
    }

    // Every non-idle state is just a countdown. Counting down first and then
    // looking at the result keeps all three transitions in one place.
    boid.dash_state_steps_remaining = boid.dash_state_steps_remaining.saturating_sub(1);

    if boid.dash_state_steps_remaining > 0 {
        return;
    }

    match boid.dash_state {
        DashState::Charging => launch_dash(boid, player_position),
        DashState::Dashing => {
            boid.dash_state = DashState::Cooling;
            boid.dash_state_steps_remaining = boid.properties.dash.cooldown_steps;
        }
        DashState::Cooling => boid.dash_state = DashState::Idle,
        DashState::Idle => {}
    }
}

/// Starts the dash itself: aim at where the player stands right now and write
/// that direction into the velocity once.
///
/// The velocity is deliberately *not* rewritten in the following steps. Only
/// separation still steers during a dash, and its force is tiny next to the dash
/// speed, so the boid keeps flying almost exactly straight while still being able
/// to curve gently around a boid in its way.
fn launch_dash(boid: &mut Boid, player_position: Vec2) {
    boid.dash_state = DashState::Dashing;
    boid.dash_state_steps_remaining = boid.properties.dash.dash_steps;

    let direction = launch_direction(boid, player_position);
    boid.velocity = direction.scale(dash_speed(boid));
}

/// Aim once at where the player is standing at launch time.
fn launch_direction(boid: &Boid, player_position: Vec2) -> Vec2 {
    let toward_player = player_position.sub(boid.position).normalize();
    if toward_player.length_squared() > 0.0 {
        return toward_player;
    }

    // The player is standing exactly on the boid, so "toward the player" has no
    // direction at all. Keep flying the way the boid already points instead of
    // freezing a zero-length direction, which would make the dash stand still.
    let heading = boid.velocity.normalize();
    if heading.length_squared() > 0.0 {
        heading
    } else {
        // Last resort, in the same spirit as the overlap fallback direction.
        Vec2::new(1.0, 0.0)
    }
}

/// Speed cap for this boid on this step: raised while dashing, normal otherwise.
///
/// Passing this into `integrate` instead of raising `max_speed` matters: all four
/// steering rules scale their desired velocity by `max_speed`, so raising the
/// property would silently multiply separation, alignment, cohesion and seeking
/// as well.
pub fn step_speed_limit(boid: &Boid) -> f32 {
    if is_dashing(boid) {
        dash_speed(boid)
    } else {
        boid.properties.max_speed
    }
}

fn dash_speed(boid: &Boid) -> f32 {
    boid.properties.max_speed * boid.properties.dash.speed_multiplier
}

/// One number per boid, holding everything the renderer needs for the pulse:
///
/// * `0.0` — nothing to draw (idle, or cooling down after a dash)
/// * `0.0 < phase < 1.0` — charging; the value is how far through the charge-up
///   the boid is, so the frontend can grow the size and the brightness and raise
///   the pulse frequency as it approaches `1.0`
/// * `-1.0 <= phase < 0.0` — dashing; `-phase` is the share of the dash still
///   left, `-1.0` on the launch step
///
/// Neither range can produce `0.0`, so the sign alone identifies the state and a
/// single flat buffer across the WebAssembly boundary is enough.
pub fn dash_render_phase(boid: &Boid) -> f32 {
    match boid.dash_state {
        DashState::Charging => {
            let total_steps = boid.properties.dash.charge_steps.max(1) as f32;
            let steps_left = boid.dash_state_steps_remaining as f32;
            (total_steps - steps_left) / total_steps
        }
        DashState::Dashing => {
            let total_steps = boid.properties.dash.dash_steps.max(1) as f32;
            let steps_left = boid.dash_state_steps_remaining as f32;
            -(steps_left / total_steps)
        }
        DashState::Idle | DashState::Cooling => 0.0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::constants::DASH_UNLOCK_DIFFICULTY_TIER;
    use crate::simulation::boid::BoidProperties;

    /// A boid of the lowest tier that is allowed to dash, standing at the origin.
    fn dash_capable_boid() -> Boid {
        let properties = BoidProperties {
            dash: dash_properties_for_difficulty_tier(DASH_UNLOCK_DIFFICULTY_TIER),
            ..BoidProperties::default()
        };

        Boid::with_variant(
            Vec2::zero(),
            Vec2::zero(),
            properties,
            DASH_UNLOCK_DIFFICULTY_TIER,
        )
    }

    /// Runs the state machine forward with a fixed player position.
    fn advance_steps(boid: &mut Boid, steps: u32, player_position: Vec2) {
        for _ in 0..steps {
            advance_dash_state(boid, player_position);
        }
    }

    /// Runs the charge-up to its end, so the boid launches into its dash.
    fn advance_to_launch(boid: &mut Boid, player_position: Vec2) {
        let charge_steps = boid.properties.dash.charge_steps;
        advance_steps(boid, charge_steps, player_position);
    }

    #[test]
    fn begin_dash_charge_is_ignored_for_a_boid_that_cannot_dash() {
        let mut boid = Boid::new(Vec2::zero(), Vec2::zero());

        begin_dash_charge(&mut boid);

        assert_eq!(boid.dash_state, DashState::Idle);
    }

    #[test]
    fn a_charging_boid_keeps_its_normal_speed_limit() {
        let mut boid = dash_capable_boid();

        begin_dash_charge(&mut boid);
        advance_dash_state(&mut boid, Vec2::new(300.0, 0.0));

        assert_eq!(boid.dash_state, DashState::Charging);
        assert_eq!(step_speed_limit(&boid), boid.properties.max_speed);
    }

    #[test]
    fn a_dashing_boid_gets_a_raised_speed_limit() {
        let mut boid = dash_capable_boid();

        begin_dash_charge(&mut boid);
        advance_to_launch(&mut boid, Vec2::new(300.0, 0.0));

        assert_eq!(boid.dash_state, DashState::Dashing);
        assert!(step_speed_limit(&boid) > boid.properties.max_speed);
    }

    #[test]
    fn the_charge_up_ends_with_a_launch_toward_the_player() {
        let mut boid = dash_capable_boid();

        begin_dash_charge(&mut boid);
        advance_to_launch(&mut boid, Vec2::new(300.0, 0.0));

        // The player sits straight to the right, so the whole dash speed has to
        // end up on the x axis.
        assert!(boid.velocity.x > 0.0);
        assert_eq!(boid.velocity.y, 0.0);
    }

    #[test]
    fn the_dash_direction_stays_frozen_while_the_player_moves() {
        let mut boid = dash_capable_boid();

        begin_dash_charge(&mut boid);
        advance_to_launch(&mut boid, Vec2::new(300.0, 0.0));
        let launch_velocity = boid.velocity;

        // The player runs off at a right angle; the dash must not follow.
        advance_dash_state(&mut boid, Vec2::new(0.0, 300.0));

        assert_eq!(boid.velocity, launch_velocity);
    }

    #[test]
    fn a_boid_on_cooldown_cannot_start_a_second_dash() {
        let mut boid = dash_capable_boid();
        let full_dash = boid.properties.dash.charge_steps + boid.properties.dash.dash_steps;

        begin_dash_charge(&mut boid);
        advance_steps(&mut boid, full_dash, Vec2::new(300.0, 0.0));
        assert_eq!(boid.dash_state, DashState::Cooling);

        begin_dash_charge(&mut boid);

        assert_eq!(boid.dash_state, DashState::Cooling);
    }

    #[test]
    fn the_cooldown_ends_back_in_the_idle_state() {
        let mut boid = dash_capable_boid();
        let full_cycle = boid.properties.dash.charge_steps
            + boid.properties.dash.dash_steps
            + boid.properties.dash.cooldown_steps;

        begin_dash_charge(&mut boid);
        advance_steps(&mut boid, full_cycle, Vec2::new(300.0, 0.0));
        assert_eq!(boid.dash_state, DashState::Idle);

        begin_dash_charge(&mut boid);

        assert_eq!(boid.dash_state, DashState::Charging);
    }

    #[test]
    fn the_dash_phase_is_zero_for_a_boid_that_is_not_dashing() {
        let mut boid = dash_capable_boid();
        assert_eq!(dash_render_phase(&boid), 0.0);

        let full_dash = boid.properties.dash.charge_steps + boid.properties.dash.dash_steps;
        begin_dash_charge(&mut boid);
        advance_steps(&mut boid, full_dash, Vec2::new(300.0, 0.0));

        assert_eq!(boid.dash_state, DashState::Cooling);
        assert_eq!(dash_render_phase(&boid), 0.0);
    }

    #[test]
    fn the_dash_phase_rises_from_just_above_zero_to_just_below_one_while_charging() {
        let mut boid = dash_capable_boid();
        begin_dash_charge(&mut boid);

        // The last charge step already flips the boid into the dash, so the loop
        // stops one step short of it.
        let mut previous_phase = 0.0;
        for _ in 0..(boid.properties.dash.charge_steps - 1) {
            advance_dash_state(&mut boid, Vec2::new(300.0, 0.0));
            let phase = dash_render_phase(&boid);

            assert!(phase > 0.0);
            assert!(phase < 1.0);
            assert!(phase > previous_phase);
            previous_phase = phase;
        }
    }

    #[test]
    fn the_dash_phase_is_negative_while_dashing() {
        let mut boid = dash_capable_boid();
        begin_dash_charge(&mut boid);
        advance_to_launch(&mut boid, Vec2::new(300.0, 0.0));

        // The launch step reports a full dash still ahead.
        assert_eq!(dash_render_phase(&boid), -1.0);

        for _ in 0..(boid.properties.dash.dash_steps - 1) {
            advance_dash_state(&mut boid, Vec2::new(300.0, 0.0));
            let phase = dash_render_phase(&boid);

            assert!(phase >= -1.0);
            assert!(phase < 0.0);
        }
    }
}
