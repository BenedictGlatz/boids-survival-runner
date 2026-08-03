//! What a boid of a given wave is made of, and where the very first flock is put.
//!
//! Split out of `wasm_bridge/mod.rs` when the wave spawn gates pushed that file past the
//! project's length limit, along the seam that was already there: `mod.rs` owns the
//! `#[wasm_bindgen]` surface and the per-frame buffers, and this file owns the one question
//! neither the flock nor the spawn gates answer — given a wave number, what kind of boid is
//! that.
//!
//! The difficulty ramp lives here rather than in `simulation/`, and deliberately so: it is a
//! *game design* curve rather than a simulation rule. `BoidProperties` is what the
//! simulation understands, and nothing in it knows that waves exist.

use crate::constants::{
    DEFAULT_ALIGNMENT_WEIGHT, DEFAULT_COHESION_WEIGHT, DEFAULT_MAX_ACCELERATION, DEFAULT_MAX_SPEED,
    DEFAULT_OBSTACLE_AVOID_WEIGHT, DEFAULT_PERCEPTION_RADIUS, DEFAULT_SEPARATION_WEIGHT,
    DEFAULT_TARGET_SEEK_WEIGHT, MAX_BOID_DIFFICULTY_TIER,
};
use crate::math::vector::Vec2;
use crate::simulation::boid::{Boid, BoidProperties};
use crate::simulation::dash::dash_properties_for_difficulty_tier;
use crate::simulation::world_edge::safe_spawn_distance;

const GOLDEN_ANGLE: f32 = 2.399_963_1;

/// Placements tried before the first flock settles for a point on a ring around the player.
const FREE_SPAWN_ATTEMPTS: u32 = 32;

/// Builds the very first flock, which is placed freely rather than announced at a gate.
///
/// Only wave 1 goes through here — see the comment in `GameEngine::new()` for why that wave
/// needs no warning. Every later wave is announced at a gate and built by `build_boid` once
/// its warning has run out.
pub fn create_boid_for_wave(
    index: u32,
    wave: u32,
    world_width: f32,
    world_height: f32,
    player_position: Vec2,
) -> Boid {
    let position = find_spawn_position(index, wave, world_width, world_height, player_position);
    let angle = (index as f32 + wave as f32 * 11.0) * GOLDEN_ANGLE;
    let velocity = Vec2::new(angle.cos(), angle.sin()).scale(DEFAULT_MAX_SPEED * 0.5);

    build_boid(position, velocity, difficulty_tier_for_wave(wave))
}

/// Turns the three values a spawn is described by into a boid.
///
/// Shared by the free placement of the first flock and by the gates every later wave arrives
/// through, so the two cannot drift apart on what a tier means. Tier 0 gets the plain
/// constructor rather than the defaults spelled out again, which is what keeps
/// `constants.rs` the single source of the baseline.
pub fn build_boid(position: Vec2, velocity: Vec2, difficulty_tier: u32) -> Boid {
    if difficulty_tier == 0 {
        return Boid::new(position, velocity);
    }

    Boid::with_variant(
        position,
        velocity,
        properties_for_difficulty_tier(difficulty_tier),
        difficulty_tier,
    )
}

/// The tier a wave's boids are built at. Tier is one below the wave number, so wave 1 is the
/// baseline, and it stops climbing at `MAX_BOID_DIFFICULTY_TIER`.
pub fn difficulty_tier_for_wave(wave: u32) -> u32 {
    wave.saturating_sub(1).min(MAX_BOID_DIFFICULTY_TIER)
}

fn properties_for_difficulty_tier(difficulty_tier: u32) -> BoidProperties {
    let tier = difficulty_tier as f32;

    BoidProperties {
        max_speed: DEFAULT_MAX_SPEED + tier * 0.45,
        max_acceleration: DEFAULT_MAX_ACCELERATION + tier * 0.02,
        perception_radius: DEFAULT_PERCEPTION_RADIUS + tier * 8.0,
        separation_weight: DEFAULT_SEPARATION_WEIGHT + tier * 0.2,
        alignment_weight: DEFAULT_ALIGNMENT_WEIGHT,
        cohesion_weight: DEFAULT_COHESION_WEIGHT,
        target_seek_weight: DEFAULT_TARGET_SEEK_WEIGHT + tier * 0.045,
        // Flat across all tiers on purpose. Avoiding an obstacle is competence, not
        // difficulty — a later boid that were worse at it would look broken rather
        // than harder. The difficulty ramp for obstacles sits in their density.
        obstacle_avoid_weight: DEFAULT_OBSTACLE_AVOID_WEIGHT,
        dash: dash_properties_for_difficulty_tier(difficulty_tier),
    }
}

/// A point far enough from the player for the first flock, anywhere in the world.
///
/// Only the first flock uses this. It is the rule the wave spawn gates replaced, and the
/// reason they did: the distance is measured at the instant of spawning, which is no use to
/// a player already moving towards the spot. For wave 1 that cannot happen — the flock is
/// there before the countdown ends and the player has not moved yet.
fn find_spawn_position(
    index: u32,
    wave: u32,
    world_width: f32,
    world_height: f32,
    player_position: Vec2,
) -> Vec2 {
    let safe_distance = safe_spawn_distance(world_width, world_height);

    for attempt in 0..FREE_SPAWN_ATTEMPTS {
        let seed = index as f32 + wave as f32 * 37.0 + attempt as f32 * 17.0;
        let x = (seed * 97.0 + 31.0) % world_width;
        let y = (seed * 53.0 + 47.0) % world_height;
        let candidate = Vec2::new(x, y);

        if candidate.distance_to(player_position) >= safe_distance {
            return candidate;
        }
    }

    let angle = (index as f32 + wave as f32 * 19.0) * GOLDEN_ANGLE;
    Vec2::new(
        wrap_coordinate(player_position.x + angle.cos() * safe_distance, world_width),
        wrap_coordinate(
            player_position.y + angle.sin() * safe_distance,
            world_height,
        ),
    )
}

fn wrap_coordinate(value: f32, maximum: f32) -> f32 {
    if maximum <= 0.0 {
        return 0.0;
    }

    value.rem_euclid(maximum)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A boid of that wave as the wave really produces it, so the tier tests below run
    /// through the same path the gates do rather than through the first flock's placement.
    fn boid_for_wave(wave: u32) -> Boid {
        build_boid(
            Vec2::new(10.0, 400.0),
            Vec2::new(1.0, 0.0),
            difficulty_tier_for_wave(wave),
        )
    }

    #[test]
    fn starting_boids_spawn_away_from_the_player() {
        // The first flock only. Every later wave arrives through the gates in
        // `wave_spawn_placement.rs`, which keeps the same distance by a different rule.
        let world_width = 1000.0;
        let world_height = 800.0;
        let player_position = Vec2::new(500.0, 400.0);
        let safe_distance = safe_spawn_distance(world_width, world_height);

        for index in 0..20 {
            let boid = create_boid_for_wave(index, 1, world_width, world_height, player_position);
            assert!(boid.position.distance_to(player_position) >= safe_distance);
        }
    }

    #[test]
    fn later_wave_boids_are_faster_and_tagged_with_higher_tiers() {
        let first_wave_boid = boid_for_wave(1);
        let later_wave_boid = boid_for_wave(5);

        assert!(later_wave_boid.difficulty_tier > first_wave_boid.difficulty_tier);
        assert!(later_wave_boid.properties.max_speed > first_wave_boid.properties.max_speed);
        assert!(
            later_wave_boid.properties.max_acceleration
                > first_wave_boid.properties.max_acceleration
        );
    }

    #[test]
    fn the_difficulty_ramp_stops_climbing_at_its_ceiling() {
        // Without the clamp a long run would keep making boids faster indefinitely, and
        // `entityPalette.js` has no colour past the last tier to draw them in.
        assert_eq!(
            difficulty_tier_for_wave(40),
            difficulty_tier_for_wave(MAX_BOID_DIFFICULTY_TIER + 1)
        );
    }

    #[test]
    fn boids_from_the_first_two_waves_cannot_dash() {
        for wave in 1..=2 {
            assert!(!boid_for_wave(wave).properties.dash.can_dash);
        }
    }

    #[test]
    fn boids_from_the_third_wave_onward_can_dash() {
        assert!(boid_for_wave(3).properties.dash.can_dash);
    }

    #[test]
    fn the_first_flock_and_a_later_wave_agree_on_what_a_tier_means() {
        // The two placements build their boids through the same helper, and this is the
        // assertion that keeps it that way: a second copy of the tier branch is exactly
        // the kind of drift that would let a gate spawn a wave-five boid with wave-one
        // properties.
        let placed_freely = create_boid_for_wave(0, 5, 1000.0, 800.0, Vec2::new(500.0, 400.0));
        let arrived_at_a_gate = boid_for_wave(5);

        assert_eq!(
            placed_freely.difficulty_tier,
            arrived_at_a_gate.difficulty_tier
        );
        assert_eq!(
            placed_freely.properties.max_speed,
            arrived_at_a_gate.properties.max_speed
        );
    }
}
