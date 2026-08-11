//! Where a dash would go, and how far it would carry.
//!
//! This module exists so that the warning line the frontend draws during a charge-up and
//! the velocity `launch_dash` actually writes cannot disagree: both read the direction from
//! `launch_direction` right here. Were the frontend to recompute "towards the player"
//! itself, the line would keep pointing where the dash used to go the next time the aim
//! rule changes — and a warning that lies is worse than no warning.
//!
//! The aim is deliberately **not** stored on the boid. The engine picks the direction in
//! the single step the dash launches (see `dash.rs`), so during the charge-up there is no
//! decision yet to remember: `dash_aim_end` answers "where would this dash end if it
//! launched right now", which is a fresh answer every step and the honest one. Freezing the
//! aim at the start of the charge-up instead would turn the line into a promise and let a
//! player walk out of every dash, which is a different game.

use crate::math::vector::Vec2;
use crate::simulation::boid::Boid;

/// Aim once at where the player is standing at launch time.
///
/// `pub(crate)` rather than private because `dash.rs` launches with it and this module
/// draws the warning with it. One function, two callers, no room for drift.
pub(crate) fn launch_direction(boid: &Boid, player_position: Vec2) -> Vec2 {
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

/// Speed this boid travels at while dashing.
pub(crate) fn dash_speed(boid: &Boid) -> f32 {
    boid.properties.max_speed * boid.properties.dash.speed_multiplier
}

/// How far a dash carries this boid.
///
/// Every step of a dash runs at the raised speed cap and the velocity is written exactly
/// once, so the distance is a plain product rather than an integral: `dash_steps` steps at
/// `dash_speed` each. Separation still nudges a dasher, which bends the path by about half
/// a degree per step — the length is therefore the length of the *path*, and the straight
/// line the frontend draws from it is a hair longer than the boid's actual reach.
pub fn dash_distance(boid: &Boid) -> f32 {
    dash_speed(boid) * boid.properties.dash.dash_steps as f32
}

/// Where this boid's dash would end if it launched in this very step.
///
/// The frontend draws its warning line from `boid.position` to exactly this point, so the
/// line is as long as the dash carries and points where the dash would go.
pub fn dash_aim_end(boid: &Boid, player_position: Vec2) -> Vec2 {
    let direction = launch_direction(boid, player_position);

    boid.position.add(direction.scale(dash_distance(boid)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::constants::DASH_UNLOCK_DIFFICULTY_TIER;
    use crate::simulation::boid::BoidProperties;
    use crate::simulation::dash::{
        advance_dash_state, begin_dash_charge, dash_properties_for_difficulty_tier, DashState,
    };

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

    #[test]
    fn the_dash_distance_is_every_dash_step_at_the_raised_speed() {
        let boid = dash_capable_boid();
        let expected = boid.properties.max_speed
            * boid.properties.dash.speed_multiplier
            * boid.properties.dash.dash_steps as f32;

        assert!((dash_distance(&boid) - expected).abs() < 0.001);
    }

    #[test]
    fn the_aim_ends_exactly_one_dash_distance_away() {
        let boid = dash_capable_boid();
        let end = dash_aim_end(&boid, Vec2::new(300.0, 400.0));

        let travelled = end.sub(boid.position).length();
        assert!((travelled - dash_distance(&boid)).abs() < 0.01);
    }

    #[test]
    fn the_aim_points_at_the_player() {
        let boid = dash_capable_boid();

        // The player sits straight above the boid, so the whole distance has to end up
        // on the y axis.
        let end = dash_aim_end(&boid, Vec2::new(0.0, 500.0));

        assert!(end.y > 0.0);
        assert!(end.x.abs() < 0.001);
    }

    #[test]
    fn the_aim_follows_the_player_while_the_boid_is_still_charging() {
        let mut boid = dash_capable_boid();
        begin_dash_charge(&mut boid);

        let first = dash_aim_end(&boid, Vec2::new(500.0, 0.0));
        advance_dash_state(&mut boid, Vec2::new(500.0, 0.0));
        let second = dash_aim_end(&boid, Vec2::new(0.0, 500.0));

        // Nothing about the aim is remembered, so a player who moved during the
        // charge-up is aimed at where they are now.
        assert!(first.x > 0.0);
        assert!(second.y > 0.0);
    }

    #[test]
    fn the_aim_falls_back_to_the_heading_when_the_player_stands_on_the_boid() {
        let mut boid = dash_capable_boid();
        boid.velocity = Vec2::new(0.0, -2.0);

        let end = dash_aim_end(&boid, boid.position);

        // Straight up, the way the boid was already pointing, and a full dash long.
        assert!(end.y < 0.0);
        assert!(end.x.abs() < 0.001);
        assert!((end.sub(boid.position).length() - dash_distance(&boid)).abs() < 0.01);
    }

    #[test]
    fn a_motionless_boid_under_the_player_still_aims_somewhere() {
        let boid = dash_capable_boid();

        // Neither a direction to the player nor a heading to fall back on. The line
        // still has to be a line rather than a point.
        let end = dash_aim_end(&boid, boid.position);

        assert!((end.sub(boid.position).length() - dash_distance(&boid)).abs() < 0.01);
    }

    #[test]
    fn the_warning_line_points_where_the_dash_really_goes() {
        // The one test that makes the line trustworthy: the aim drawn in the last step of
        // the charge-up and the velocity the launch writes in the next one have to agree.
        let mut boid = dash_capable_boid();
        let player_position = Vec2::new(400.0, 300.0);
        begin_dash_charge(&mut boid);

        for _ in 0..(boid.properties.dash.charge_steps - 1) {
            advance_dash_state(&mut boid, player_position);
        }
        assert_eq!(boid.dash_state, DashState::Charging);

        let aimed_at = dash_aim_end(&boid, player_position);
        let aimed_direction = aimed_at.sub(boid.position).normalize();

        advance_dash_state(&mut boid, player_position);
        assert_eq!(boid.dash_state, DashState::Dashing);
        let launched_direction = boid.velocity.normalize();

        assert!((aimed_direction.x - launched_direction.x).abs() < 0.001);
        assert!((aimed_direction.y - launched_direction.y).abs() < 0.001);
    }
}
