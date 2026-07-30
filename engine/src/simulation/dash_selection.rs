use super::boid::Boid;
use super::dash::DashState;
use crate::constants::{
    BOIDS_PER_EXTRA_DASH_SLOT, DASH_GROUP_RADIUS, DASH_SELECTION_INTERVAL_STEPS,
    MAXIMUM_DASH_SELECTION_DISTANCE, MAX_CONCURRENT_DASHING_BOIDS, MAX_DASH_GROUP_SIZE,
    MINIMUM_DASH_SELECTION_DISTANCE,
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

/// Offers one new dash to the flock and returns the indices of every boid that
/// should start charging for it — usually none, sometimes one, and where the flock
/// allows it a small group that lunges together.
///
/// This is called once per simulation step, but almost every call returns an empty
/// list: a dash slot only opens every `DASH_SELECTION_INTERVAL_STEPS` steps, and
/// only while the flock is below its limit of boids charging or dashing. Those two
/// rules together are what keeps the dashing part of the flock small.
///
/// The returned `Vec` holds at most `MAX_DASH_GROUP_SIZE` entries and is only ever
/// built on a selection round, so the per-step cost of the empty case is one
/// `Vec::new()`, which does not allocate.
pub fn select_dash_group(boids: &[Boid], step_counter: u32, player_position: Vec2) -> Vec<usize> {
    if boids.is_empty() || !step_counter.is_multiple_of(DASH_SELECTION_INTERVAL_STEPS) {
        return Vec::new();
    }

    let busy_count = count_busy_dashers(boids);
    let allowed_count = allowed_concurrent_dashers(boids.len());
    if busy_count >= allowed_count {
        return Vec::new();
    }

    // Never hand out more dashes than the flock still has room for, so a group can
    // shrink to a single boid — or to two — rather than overrunning the limit.
    let free_slots = (allowed_count - busy_count).min(MAX_DASH_GROUP_SIZE);

    let leader_index = match select_group_leader(boids, step_counter, player_position) {
        Some(index) => index,
        None => return Vec::new(),
    };

    collect_group_around(boids, leader_index, player_position, free_slots)
}

/// Picks the boid the group forms around, which is also the boid that dashes alone
/// when no suitable companions are nearby.
fn select_group_leader(boids: &[Boid], step_counter: u32, player_position: Vec2) -> Option<usize> {
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

/// Gathers the leader's closest companions of the *same* difficulty tier into one
/// dashing group, up to `maximum_group_size` boids including the leader itself.
///
/// The tier has to match for two reasons. It is what the player sees — a group of
/// four yellow boids reads as one coordinated push, a mixed bag reads as noise —
/// and boids of one tier share their charge-up length, so the whole group leaves
/// its warning pulse and launches on exactly the same simulation step.
///
/// Nothing here is random: candidates are walked in index order, so the same flock
/// in the same step always produces the same group.
fn collect_group_around(
    boids: &[Boid],
    leader_index: usize,
    player_position: Vec2,
    maximum_group_size: usize,
) -> Vec<usize> {
    let leader = &boids[leader_index];
    let mut group = Vec::with_capacity(maximum_group_size);
    group.push(leader_index);

    for (index, candidate) in boids.iter().enumerate() {
        if group.len() >= maximum_group_size {
            break;
        }

        if index == leader_index || candidate.difficulty_tier != leader.difficulty_tier {
            continue;
        }

        // Every group member has to pass the same eligibility test as the leader,
        // so joining a group can never drag a boid on cooldown, or one standing
        // right on top of the player, into a dash.
        let flies_with_the_leader =
            candidate.position.distance_to(leader.position) <= DASH_GROUP_RADIUS;
        if flies_with_the_leader && is_eligible_to_dash(candidate, player_position) {
            group.push(index);
        }
    }

    group
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

    /// Builds a flock of dash-capable boids spread evenly around the player at the
    /// eligible distance, so every boid may dash but none is close enough to any
    /// other to join its group.
    fn scattered_dash_capable_flock(count: usize) -> Vec<Boid> {
        let mut boids = dash_capable_flock(count, eligible_distance());
        let radius = eligible_distance();

        for (index, boid) in boids.iter_mut().enumerate() {
            // A full circle divided between the boids. With four boids at a radius
            // of 250 the gap between neighbours is over 350 units, far beyond
            // DASH_GROUP_RADIUS, while every boid keeps the same eligible distance.
            let angle = index as f32 / count as f32 * std::f32::consts::TAU;
            boid.position = Vec2::new(
                PLAYER.x + radius * angle.cos(),
                PLAYER.y + radius * angle.sin(),
            );
        }

        boids
    }

    /// One selection round with the flock left in its starting state.
    fn select_on_a_selection_round(boids: &[Boid]) -> Vec<usize> {
        select_dash_group(boids, DASH_SELECTION_INTERVAL_STEPS, PLAYER)
    }

    #[test]
    fn no_boid_is_selected_on_a_step_between_selection_rounds() {
        let boids = dash_capable_flock(12, eligible_distance());

        // Every step of one full interval except the one that opens a slot.
        for step in 1..DASH_SELECTION_INTERVAL_STEPS {
            assert!(select_dash_group(&boids, step, PLAYER).is_empty());
        }
    }

    #[test]
    fn an_eligible_boid_is_selected_on_a_selection_round() {
        let boids = dash_capable_flock(12, eligible_distance());

        assert!(!select_on_a_selection_round(&boids).is_empty());
    }

    #[test]
    fn no_boid_is_selected_when_none_of_them_may_dash() {
        // Default properties mean `can_dash` is false, as in the first two waves.
        let mut boids = dash_capable_flock(12, eligible_distance());
        for boid in &mut boids {
            boid.properties = BoidProperties::default();
        }

        assert!(select_on_a_selection_round(&boids).is_empty());
    }

    #[test]
    fn a_boid_standing_next_to_the_player_is_not_selected() {
        let boids = dash_capable_flock(12, MINIMUM_DASH_SELECTION_DISTANCE - 10.0);

        assert!(select_on_a_selection_round(&boids).is_empty());
    }

    #[test]
    fn a_boid_far_away_from_the_player_is_not_selected() {
        let boids = dash_capable_flock(12, MAXIMUM_DASH_SELECTION_DISTANCE + 10.0);

        assert!(select_on_a_selection_round(&boids).is_empty());
    }

    #[test]
    fn no_boid_is_selected_while_the_dash_slots_are_full() {
        let mut boids = dash_capable_flock(12, eligible_distance());
        for index in 0..allowed_concurrent_dashers(boids.len()) {
            boids[index].dash_state = DashState::Charging;
        }

        assert!(select_on_a_selection_round(&boids).is_empty());
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

    #[test]
    fn neighbouring_boids_of_the_same_tier_are_selected_as_one_group() {
        // The helper packs all twelve boids within a few units of each other, so
        // whichever one is picked first has plenty of company.
        let boids = dash_capable_flock(12, eligible_distance());

        let group = select_on_a_selection_round(&boids);

        assert!(group.len() > 1);
        assert_eq!(group.len(), MAX_DASH_GROUP_SIZE);
    }

    #[test]
    fn a_group_holds_each_of_its_boids_exactly_once() {
        // Two boids charging the same dash twice would double the pulse and, worse,
        // silently use up two dash slots for one lunge.
        let boids = dash_capable_flock(12, eligible_distance());

        let mut group = select_on_a_selection_round(&boids);
        let selected_count = group.len();
        group.sort_unstable();
        group.dedup();

        assert_eq!(group.len(), selected_count);
    }

    #[test]
    fn a_boid_without_a_close_neighbour_is_selected_on_its_own() {
        let boids = scattered_dash_capable_flock(4);

        let group = select_on_a_selection_round(&boids);

        assert_eq!(group.len(), 1);
    }

    #[test]
    fn only_boids_of_the_leaders_tier_join_its_group() {
        // Every second boid belongs to the next tier up, which may dash just as well
        // — so if the tier were ignored, the group would happily mix the two.
        let mut boids = dash_capable_flock(12, eligible_distance());
        let other_tier = DASH_UNLOCK_DIFFICULTY_TIER + 1;
        for index in (1..boids.len()).step_by(2) {
            boids[index].difficulty_tier = other_tier;
            boids[index].properties.dash = dash_properties_for_difficulty_tier(other_tier);
        }

        let group = collect_group_around(&boids, 0, PLAYER, MAX_DASH_GROUP_SIZE);

        assert_eq!(group.len(), MAX_DASH_GROUP_SIZE);
        for index in group {
            assert_eq!(boids[index].difficulty_tier, DASH_UNLOCK_DIFFICULTY_TIER);
        }
    }

    #[test]
    fn a_group_never_grows_past_the_number_of_free_dash_slots() {
        let boids = dash_capable_flock(12, eligible_distance());

        // Two free slots out of a cluster that could easily fill four.
        let group = collect_group_around(&boids, 0, PLAYER, 2);

        assert_eq!(group.len(), 2);
    }

    #[test]
    fn a_boid_that_is_not_idle_does_not_join_a_group() {
        let mut boids = dash_capable_flock(12, eligible_distance());
        // Everything except the leader is busy or cooling down, so the group cannot
        // grow even though all of them fly right next to the leader.
        for boid in boids.iter_mut().skip(1) {
            boid.dash_state = DashState::Cooling;
        }

        let group = collect_group_around(&boids, 0, PLAYER, MAX_DASH_GROUP_SIZE);

        assert_eq!(group, vec![0]);
    }
}
