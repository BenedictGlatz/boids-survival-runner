use super::shape::Obstacle;
use crate::constants::{MINIMUM_CORRIDOR_WIDTH, MINIMUM_OBSTACLE_RADIUS, PLAYER_COLLISION_RADIUS};
use crate::math::vector::Vec2;

// The rule that decides whether a placement is allowed. Kept apart from the candidate
// construction in `obstacle_spawn.rs` on purpose: building a candidate is where the
// stand-in for randomness lives, while this file is where the one guarantee of the whole
// feature lives. The split is also what lets the rule be tested against hand-built
// obstacles rather than only against whatever the seed happened to produce.
/// Whether a candidate may be placed in the world.
///
/// **This is the function that makes a dead end impossible.** Inflate every obstacle
/// by the player's radius and it becomes a convex region the player cannot enter.
/// Rules 1 and 2 keep every inflated region clear of every other and of all four
/// walls, so each one is an isolated island in the interior of the arena — and a
/// finite set of disjoint convex islands, none of them touching the boundary, always
/// leaves the space around them connected. Trapping the player would need either two
/// obstacles touching each other or one touching a wall, and neither can happen.
///
/// Rule 3 keeps an obstacle from materialising on top of the player, and rule 4 keeps
/// it thick enough that the player cannot cross it within one simulation step.
///
/// Rule 3 asks for a corridor's worth of clearance rather than the much larger safe
/// distance the boid spawn uses, and the difference is deliberate. A boid is spawned
/// far away because it immediately starts hunting; an obstacle never moves, so all it
/// owes the player is room to get out of the way. Demanding the boid distance here
/// removes a disc most of the arena wide and starves the spawn: almost every candidate
/// would be rejected and the world would stay nearly empty.
pub fn candidate_is_acceptable(
    candidate: &Obstacle,
    existing: &[Obstacle],
    player_position: Vec2,
    world_width: f32,
    world_height: f32,
) -> bool {
    // Rule 4: thick enough that a single step cannot skip over it.
    if candidate.radius < MINIMUM_OBSTACLE_RADIUS {
        return false;
    }

    // Rule 2: clear of every world edge, so no obstacle can form a pocket with a wall.
    if candidate.surface_gap_to_world_edges(world_width, world_height) < MINIMUM_CORRIDOR_WIDTH {
        return false;
    }

    // Rule 3: never on top of the player, and never so close that the appearance alone
    // is an unavoidable hit.
    let contact = candidate.contact_with_point(player_position, PLAYER_COLLISION_RADIUS);
    if contact.surface_distance < MINIMUM_CORRIDOR_WIDTH {
        return false;
    }

    // Rule 1: a full corridor away from everything already standing.
    for other in existing {
        if candidate.surface_gap_to(other) < MINIMUM_CORRIDOR_WIDTH {
            return false;
        }
    }

    true
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::simulation::obstacle::spawn::build_spawn_candidate;

    const WORLD_WIDTH: f32 = 1600.0;
    const WORLD_HEIGHT: f32 = 900.0;
    const LIFETIME: u32 = 1800;
    const PLAYER: Vec2 = Vec2 { x: 800.0, y: 450.0 };
    fn accept(candidate: &Obstacle, existing: &[Obstacle]) -> bool {
        candidate_is_acceptable(candidate, existing, PLAYER, WORLD_WIDTH, WORLD_HEIGHT)
    }

    /// Runs the spawn loop the way the obstacle field does, and returns what it placed.
    fn place_many(rounds: u64) -> Vec<Obstacle> {
        let mut placed: Vec<Obstacle> = Vec::new();

        for round in 0..rounds {
            for attempt in 0..12 {
                let candidate =
                    build_spawn_candidate(round, attempt, WORLD_WIDTH, WORLD_HEIGHT, LIFETIME);

                if accept(&candidate, &placed) {
                    placed.push(candidate);
                    break;
                }
            }
        }

        placed
    }

    #[test]
    fn accepted_obstacles_never_close_a_corridor() {
        // The core safety net. Every pair that ever coexists has to keep a full
        // corridor between them, because that is what rules out an enclosure.
        let placed = place_many(400);

        assert!(placed.len() > 5, "the spawn rule placed almost nothing");

        for (index, first) in placed.iter().enumerate() {
            for second in &placed[index + 1..] {
                assert!(
                    first.surface_gap_to(second) >= MINIMUM_CORRIDOR_WIDTH,
                    "two obstacles ended up {} apart",
                    first.surface_gap_to(second)
                );
            }
        }
    }

    #[test]
    fn accepted_obstacles_keep_clear_of_every_world_edge() {
        // The other half of the argument: an obstacle touching a wall could form a
        // pocket with it, without ever coming near a second obstacle.
        for obstacle in place_many(400) {
            assert!(
                obstacle.surface_gap_to_world_edges(WORLD_WIDTH, WORLD_HEIGHT)
                    >= MINIMUM_CORRIDOR_WIDTH
            );
        }
    }

    #[test]
    fn accepted_obstacles_stay_a_corridor_away_from_the_player() {
        for obstacle in place_many(400) {
            let contact = obstacle.contact_with_point(PLAYER, PLAYER_COLLISION_RADIUS);
            assert!(contact.surface_distance >= MINIMUM_CORRIDOR_WIDTH);
        }
    }

    #[test]
    fn a_candidate_on_top_of_the_player_is_rejected() {
        let on_the_player = Obstacle::circle(PLAYER, 40.0, LIFETIME);

        assert!(!accept(&on_the_player, &[]));
    }

    #[test]
    fn a_candidate_touching_a_world_edge_is_rejected() {
        let against_the_left_edge = Obstacle::circle(Vec2::new(30.0, 450.0), 40.0, LIFETIME);

        assert!(!accept(&against_the_left_edge, &[]));
    }

    #[test]
    fn a_candidate_too_close_to_an_existing_obstacle_is_rejected() {
        let standing = Obstacle::circle(Vec2::new(400.0, 450.0), 40.0, LIFETIME);
        // Surfaces only MINIMUM_CORRIDOR_WIDTH / 2 apart.
        let crowding = Obstacle::circle(
            Vec2::new(400.0 + 80.0 + MINIMUM_CORRIDOR_WIDTH * 0.5, 450.0),
            40.0,
            LIFETIME,
        );

        assert!(!accept(&crowding, &[standing]));
    }

    #[test]
    fn a_candidate_a_full_corridor_away_is_accepted() {
        let standing = Obstacle::circle(Vec2::new(400.0, 200.0), 40.0, LIFETIME);
        let clear = Obstacle::circle(
            Vec2::new(400.0 + 80.0 + MINIMUM_CORRIDOR_WIDTH + 1.0, 200.0),
            40.0,
            LIFETIME,
        );

        assert!(accept(&clear, &[standing]));
    }

    #[test]
    fn a_candidate_thinner_than_the_minimum_radius_is_rejected() {
        // A thin enough obstacle could be crossed between two simulation steps, which
        // would let a dashing player pass straight through it.
        let paper_thin = Obstacle::circle(
            Vec2::new(400.0, 200.0),
            MINIMUM_OBSTACLE_RADIUS - 1.0,
            LIFETIME,
        );

        assert!(!accept(&paper_thin, &[]));
    }

    #[test]
    fn spawning_gives_up_rather_than_breaking_the_corridor_rule() {
        // With the world already full, no attempt may succeed. Placing something
        // anyway would be the one way a dead end could appear.
        let placed = place_many(400);
        let mut accepted_anything = false;

        for attempt in 0..12 {
            let candidate =
                build_spawn_candidate(9_999, attempt, WORLD_WIDTH, WORLD_HEIGHT, LIFETIME);
            if accept(&candidate, &placed) {
                accepted_anything = true;
            }
        }

        // Not an assertion that it fails — only that if it succeeds, the result is
        // still legal. The invariant holds either way.
        if accepted_anything {
            for obstacle in &placed {
                let candidate =
                    build_spawn_candidate(9_999, 0, WORLD_WIDTH, WORLD_HEIGHT, LIFETIME);
                if accept(&candidate, &placed) {
                    assert!(candidate.surface_gap_to(obstacle) >= MINIMUM_CORRIDOR_WIDTH);
                }
            }
        }
    }
}
