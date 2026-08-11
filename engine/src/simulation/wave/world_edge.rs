//! The world border as a single number, plus the distance a spawn has to keep from the
//! player.
//!
//! Split out of `wave_spawn_placement.rs` along a real seam rather than for length alone:
//! this module answers *where the border is*, and that one is about *which part of it a
//! given wave uses*. The border has nothing to do with waves — the split is what lets it
//! be tested by walking the whole perimeter, without a wave number anywhere in the test.
//!
//! Why one number instead of an edge plus a position along it: a gate then slides along
//! the border by plain addition and rounds the corners on its own, which is exactly what
//! the player-avoidance nudge in `wave_spawn_placement.rs` needs.

use crate::constants::WAVE_SPAWN_EDGE_INSET;
use crate::math::vector::Vec2;

/// How far a newly spawned boid has to stay from the player.
///
/// Lives here because it is the one number both placement rules share — the free
/// placement the very first flock uses, and the gates every later wave arrives through.
pub fn safe_spawn_distance(world_width: f32, world_height: f32) -> f32 {
    let minimum_dimension = world_width.min(world_height);
    let desired_distance = (minimum_dimension * 0.34).max(180.0);
    let maximum_reasonable_distance = (minimum_dimension * 0.48).max(80.0);

    desired_distance.min(maximum_reasonable_distance)
}

/// The length of one trip around the world edge.
pub fn world_perimeter(world_width: f32, world_height: f32) -> f32 {
    2.0 * (world_width + world_height)
}

/// The point that many units clockwise from the top-left corner, pulled
/// `WAVE_SPAWN_EDGE_INSET` inside the world.
///
/// Distances outside one trip wrap, which callers rely on: the nudge in
/// `gate_perimeter_offset` keeps adding to an offset and never brings it back into range.
pub fn perimeter_position(distance_along_edge: f32, world_width: f32, world_height: f32) -> Vec2 {
    let perimeter = world_perimeter(world_width, world_height);

    if perimeter <= 0.0 {
        return Vec2::zero();
    }

    let mut walked = distance_along_edge.rem_euclid(perimeter);

    // Clockwise from the top-left corner: across the top, down the right side, back
    // along the bottom, and up the left side.
    if walked < world_width {
        return pull_inside(Vec2::new(walked, 0.0), world_width, world_height);
    }
    walked -= world_width;

    if walked < world_height {
        return pull_inside(Vec2::new(world_width, walked), world_width, world_height);
    }
    walked -= world_height;

    if walked < world_width {
        return pull_inside(
            Vec2::new(world_width - walked, world_height),
            world_width,
            world_height,
        );
    }
    walked -= world_width;

    pull_inside(
        Vec2::new(0.0, world_height - walked),
        world_width,
        world_height,
    )
}

/// Moves a point on the border the inset distance into the world.
///
/// Clamping both coordinates rather than pushing along the surface normal keeps the
/// corners simple: a point near a corner is pulled in diagonally, which is where a boid
/// entering there wants to be anyway.
fn pull_inside(point: Vec2, world_width: f32, world_height: f32) -> Vec2 {
    Vec2::new(
        clamp_inside(point.x, world_width),
        clamp_inside(point.y, world_height),
    )
}

fn clamp_inside(value: f32, extent: f32) -> f32 {
    // A world thinner than two insets has no inside left, so the inset shrinks to half
    // the extent and every point on that axis lands on the centre line.
    let inset = WAVE_SPAWN_EDGE_INSET.min(extent * 0.5);

    value.max(inset).min(extent - inset)
}

#[cfg(test)]
mod tests {
    use super::*;

    const WORLD_WIDTH: f32 = 1920.0;
    const WORLD_HEIGHT: f32 = 1080.0;

    /// Walks the whole border in even steps, which is what every test here asserts over.
    fn walk_the_border(steps: u32) -> Vec<Vec2> {
        let perimeter = world_perimeter(WORLD_WIDTH, WORLD_HEIGHT);
        let mut points = Vec::new();

        for step in 0..steps {
            let distance = step as f32 / steps as f32 * perimeter;
            points.push(perimeter_position(distance, WORLD_WIDTH, WORLD_HEIGHT));
        }

        points
    }

    #[test]
    fn every_point_around_the_perimeter_lands_on_the_border() {
        // The whole point of the feature above this module: a wave has to be visible *at
        // the edge*, so a point that drifted into the middle of the arena would be no
        // warning at all.
        let inset = WAVE_SPAWN_EDGE_INSET;

        for point in walk_the_border(600) {
            let on_vertical_edge =
                (point.x - inset).abs() < 1e-3 || (point.x - (WORLD_WIDTH - inset)).abs() < 1e-3;
            let on_horizontal_edge =
                (point.y - inset).abs() < 1e-3 || (point.y - (WORLD_HEIGHT - inset)).abs() < 1e-3;

            assert!(
                on_vertical_edge || on_horizontal_edge,
                "{point:?} left the border"
            );
        }
    }

    #[test]
    fn every_point_around_the_perimeter_stays_inside_the_world() {
        for point in walk_the_border(600) {
            assert!(point.x >= 0.0 && point.x <= WORLD_WIDTH, "x: {}", point.x);
            assert!(point.y >= 0.0 && point.y <= WORLD_HEIGHT, "y: {}", point.y);
        }
    }

    #[test]
    fn walking_the_perimeter_visits_all_four_edges() {
        // A mapping that folded two edges together would still satisfy the two tests
        // above while leaving half the border unreachable.
        let mut saw_top = false;
        let mut saw_bottom = false;
        let mut saw_left = false;
        let mut saw_right = false;

        for point in walk_the_border(600) {
            if point.y <= WAVE_SPAWN_EDGE_INSET {
                saw_top = true;
            }
            if point.y >= WORLD_HEIGHT - WAVE_SPAWN_EDGE_INSET {
                saw_bottom = true;
            }
            if point.x <= WAVE_SPAWN_EDGE_INSET {
                saw_left = true;
            }
            if point.x >= WORLD_WIDTH - WAVE_SPAWN_EDGE_INSET {
                saw_right = true;
            }
        }

        assert!(saw_top && saw_bottom && saw_left && saw_right);
    }

    #[test]
    fn a_distance_beyond_one_trip_wraps_back_onto_the_same_point() {
        // Load-bearing rather than defensive: the nudge in `gate_perimeter_offset` adds to
        // an offset without ever bringing it back into range.
        let perimeter = world_perimeter(WORLD_WIDTH, WORLD_HEIGHT);
        let once = perimeter_position(300.0, WORLD_WIDTH, WORLD_HEIGHT);
        let again = perimeter_position(300.0 + perimeter * 3.0, WORLD_WIDTH, WORLD_HEIGHT);

        assert!((once.x - again.x).abs() < 1e-2);
        assert!((once.y - again.y).abs() < 1e-2);
    }

    #[test]
    fn a_degenerate_world_does_not_panic() {
        let point = perimeter_position(7.0, 1.0, 1.0);

        assert!(point.x.is_finite() && point.y.is_finite());
    }

    #[test]
    fn the_safe_distance_never_swallows_the_whole_world() {
        // A distance larger than the arena would reject every placement, which is how the
        // obstacle field once ended up permanently empty.
        for extent in [200.0_f32, 800.0, 1080.0, 2160.0] {
            assert!(safe_spawn_distance(extent, extent) < extent);
        }
    }

    #[test]
    fn the_safe_distance_grows_with_the_world() {
        assert!(safe_spawn_distance(1920.0, 1080.0) > safe_spawn_distance(800.0, 600.0));
    }
}
