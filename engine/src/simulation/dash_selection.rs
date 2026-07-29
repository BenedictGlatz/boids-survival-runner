use super::boid::Boid;
use super::dash::DashState;
use crate::constants::{
    BOIDS_PER_EXTRA_DASH_SLOT, DASH_SELECTION_INTERVAL_STEPS, MAXIMUM_DASH_SELECTION_DISTANCE,
    MAX_CONCURRENT_DASHING_BOIDS, MINIMUM_DASH_SELECTION_DISTANCE,
};
use crate::math::vector::Vec2;

// Multipliers that turn the selection round into a spread-out boid index. This is
// the same integer-hash trick (and the same numbers) as `find_spawn_position`,
// which fakes randomness deterministically so the whole simulation stays
// reproducible and the engine needs no random number generator.
const SELECTION_ROUND_MULTIPLIER: u64 = 37;
const SELECTION_ATTEMPT_MULTIPLIER: u64 = 17;
const SELECTION_SPREAD_MULTIPLIER: u64 = 97;
const SELECTION_OFFSET: u64 = 31;

/// How many candidate boids one round looks at before giving up for this round.
const SELECTION_ATTEMPTS: u64 = 8;

/// Offers at most one new dash to the flock and returns the chosen boid index.
///
/// This is called once per simulation step, but almost every call returns `None`:
/// a dash slot only opens every `DASH_SELECTION_INTERVAL_STEPS` steps, and only
/// while the flock is below its limit of boids charging or dashing. Those two
/// rules together are what keeps the dashing group small.
pub fn select_dash_candidate(
    boids: &[Boid],
    step_counter: u32,
    player_position: Vec2,
) -> Option<usize> {
    if boids.is_empty() || !step_counter.is_multiple_of(DASH_SELECTION_INTERVAL_STEPS) {
        return None;
    }

    if count_busy_dashers(boids) >= allowed_concurrent_dashers(boids.len()) {
        return None;
    }

    let selection_round = (step_counter / DASH_SELECTION_INTERVAL_STEPS) as u64;

    // The first guess is often a boid that is still on cooldown or badly placed,
    // so try a handful of different candidates before giving this round up.
    for attempt in 0..SELECTION_ATTEMPTS {
        // The arithmetic runs in u64 on purpose: these multiplications would
        // overflow a 32 bit counter after a few days of uninterrupted play.
        let seed =
            selection_round * SELECTION_ROUND_MULTIPLIER + attempt * SELECTION_ATTEMPT_MULTIPLIER;
        let candidate_index =
            ((seed * SELECTION_SPREAD_MULTIPLIER + SELECTION_OFFSET) % boids.len() as u64) as usize;

        if is_eligible_to_dash(&boids[candidate_index], player_position) {
            return Some(candidate_index);
        }
    }

    None
}

/// A boid may be offered a dash when its variant is allowed to dash at all, it is
/// not already busy with one, and it is far enough away for the player to react
/// but close enough for the dash to actually arrive.
fn is_eligible_to_dash(boid: &Boid, player_position: Vec2) -> bool {
    if !boid.properties.dash.can_dash || boid.dash_state != DashState::Idle {
        return false;
    }

    let distance_to_player = boid.position.distance_to(player_position);
    let too_close_to_dodge = distance_to_player < MINIMUM_DASH_SELECTION_DISTANCE;
    let too_far_to_arrive = distance_to_player > MAXIMUM_DASH_SELECTION_DISTANCE;

    !too_close_to_dodge && !too_far_to_arrive
}

/// Counts the boids that are charging or already dashing. A boid on cooldown is
/// flocking normally again, so it does not occupy a dash slot.
pub fn count_busy_dashers(boids: &[Boid]) -> usize {
    let mut busy_count = 0;

    for boid in boids {
        if boid.dash_state == DashState::Charging || boid.dash_state == DashState::Dashing {
            busy_count += 1;
        }
    }

    busy_count
}

/// Big flocks get a few more slots, so a dash still happens now and then when
/// there are hundreds of boids on screen. The number stays deliberately small.
pub fn allowed_concurrent_dashers(boid_count: usize) -> usize {
    MAX_CONCURRENT_DASHING_BOIDS + boid_count / BOIDS_PER_EXTRA_DASH_SLOT
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::constants::DASH_UNLOCK_DIFFICULTY_TIER;
    use crate::simulation::boid::BoidProperties;
    use crate::simulation::dash::dash_properties_for_difficulty_tier;

    /// The player stands in the middle of the test world.
    const PLAYER: Vec2 = Vec2 { x: 500.0, y: 500.0 };

    /// Builds a flock of boids that may dash, all placed at the given distance to
    /// the right of the player and spread out vertically so they are distinct.
    fn dash_capable_flock(count: usize, distance_to_player: f32) -> Vec<Boid> {
        let properties = BoidProperties {
            dash: dash_properties_for_difficulty_tier(DASH_UNLOCK_DIFFICULTY_TIER),
            ..BoidProperties::default()
        };
        let mut boids = Vec::new();

        for index in 0..count {
            boids.push(Boid::with_variant(
                Vec2::new(PLAYER.x + distance_to_player, PLAYER.y + index as f32),
                Vec2::zero(),
                properties,
                DASH_UNLOCK_DIFFICULTY_TIER,
            ));
        }

        boids
    }

    /// A distance that sits comfortably inside the eligible band.
    fn eligible_distance() -> f32 {
        (MINIMUM_DASH_SELECTION_DISTANCE + MAXIMUM_DASH_SELECTION_DISTANCE) * 0.5
    }

    #[test]
    fn no_boid_is_selected_on_a_step_between_selection_rounds() {
        let boids = dash_capable_flock(12, eligible_distance());

        // Every step of one full interval except the one that opens a slot.
        for step in 1..DASH_SELECTION_INTERVAL_STEPS {
            assert_eq!(select_dash_candidate(&boids, step, PLAYER), None);
        }
    }

    #[test]
    fn an_eligible_boid_is_selected_on_a_selection_round() {
        let boids = dash_capable_flock(12, eligible_distance());

        let selected = select_dash_candidate(&boids, DASH_SELECTION_INTERVAL_STEPS, PLAYER);

        assert!(selected.is_some());
    }

    #[test]
    fn no_boid_is_selected_when_none_of_them_may_dash() {
        // Default properties mean `can_dash` is false, as in the first two waves.
        let mut boids = dash_capable_flock(12, eligible_distance());
        for boid in &mut boids {
            boid.properties = BoidProperties::default();
        }

        let selected = select_dash_candidate(&boids, DASH_SELECTION_INTERVAL_STEPS, PLAYER);

        assert_eq!(selected, None);
    }

    #[test]
    fn a_boid_standing_next_to_the_player_is_not_selected() {
        let boids = dash_capable_flock(12, MINIMUM_DASH_SELECTION_DISTANCE - 10.0);

        let selected = select_dash_candidate(&boids, DASH_SELECTION_INTERVAL_STEPS, PLAYER);

        assert_eq!(selected, None);
    }

    #[test]
    fn a_boid_far_away_from_the_player_is_not_selected() {
        let boids = dash_capable_flock(12, MAXIMUM_DASH_SELECTION_DISTANCE + 10.0);

        let selected = select_dash_candidate(&boids, DASH_SELECTION_INTERVAL_STEPS, PLAYER);

        assert_eq!(selected, None);
    }

    #[test]
    fn no_boid_is_selected_while_the_dash_slots_are_full() {
        let mut boids = dash_capable_flock(12, eligible_distance());
        for index in 0..allowed_concurrent_dashers(boids.len()) {
            boids[index].dash_state = DashState::Charging;
        }

        let selected = select_dash_candidate(&boids, DASH_SELECTION_INTERVAL_STEPS, PLAYER);

        assert_eq!(selected, None);
    }

    #[test]
    fn a_cooling_boid_does_not_occupy_a_dash_slot() {
        let mut boids = dash_capable_flock(12, eligible_distance());
        boids[0].dash_state = DashState::Cooling;

        assert_eq!(count_busy_dashers(&boids), 0);
    }

    #[test]
    fn larger_flocks_are_allowed_more_dashers_than_small_ones() {
        let small = allowed_concurrent_dashers(12);
        let large = allowed_concurrent_dashers(12 + BOIDS_PER_EXTRA_DASH_SLOT * 2);

        assert_eq!(small, MAX_CONCURRENT_DASHING_BOIDS);
        assert_eq!(large, MAX_CONCURRENT_DASHING_BOIDS + 2);
    }
}
