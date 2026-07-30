use super::vector::Vec2;

// Distance helpers for line segments. Everything an obstacle needs geometrically
// reduces to one of these, because an obstacle is a segment with a radius: the
// distance to its surface is the distance to its centre line minus that radius.
//
// A segment of length zero is a legal input everywhere in this module and stands
// for a single point. That is what makes a circular obstacle the same code path as
// a bar-shaped one instead of a second case to keep in sync.

/// The point on the segment `start`–`end` that lies closest to `point`.
///
/// A segment of length zero returns its own start, which is the circle case.
pub fn closest_point_on_segment(point: Vec2, start: Vec2, end: Vec2) -> Vec2 {
    let spine = end.sub(start);
    let spine_length_squared = spine.length_squared();

    // A segment of length zero has exactly one point to offer.
    if spine_length_squared == 0.0 {
        return start;
    }

    // How far along the segment the perpendicular from the point lands, measured in
    // fractions of the segment: 0 is the start, 1 is the end. Clamping is what turns
    // the infinite line into a segment — without it a point past the end would be
    // projected onto empty space beyond the segment.
    let travel = point.sub(start).dot(spine) / spine_length_squared;
    let clamped_travel = travel.clamp(0.0, 1.0);

    start.add(spine.scale(clamped_travel))
}

/// The shortest distance from a point to the segment `start`–`end`.
pub fn distance_from_point_to_segment(point: Vec2, start: Vec2, end: Vec2) -> f32 {
    closest_point_on_segment(point, start, end).distance_to(point)
}

/// Whether the two segments cross each other.
///
/// The test asks, for each segment, whether the two endpoints of the other lie on
/// opposite sides of it. Only if that holds for both segments do they cross. Sitting
/// exactly on the line counts as crossing, which is the safe answer here: a
/// clearance check that treats touching as crossing rejects a candidate obstacle
/// rather than letting a zero-width gap through.
///
/// A segment of length zero never counts as crossing anything. It has no side for
/// the other segment's endpoints to straddle, so the side test degenerates to
/// comparing zero against zero and would answer "yes" to everything — including two
/// circular obstacles on opposite ends of the world.
pub fn segments_intersect(a_start: Vec2, a_end: Vec2, b_start: Vec2, b_end: Vec2) -> bool {
    let a_direction = a_end.sub(a_start);
    let b_direction = b_end.sub(b_start);

    if a_direction.length_squared() == 0.0 || b_direction.length_squared() == 0.0 {
        return false;
    }

    let b_start_side = a_direction.cross(b_start.sub(a_start));
    let b_end_side = a_direction.cross(b_end.sub(a_start));
    let a_start_side = b_direction.cross(a_start.sub(b_start));
    let a_end_side = b_direction.cross(a_end.sub(b_start));

    // Opposite signs mean the two points straddle the line. Multiplying and asking
    // for a non-positive product says the same thing and also covers a point that
    // sits exactly on the line, where one of the two values is zero.
    b_start_side * b_end_side <= 0.0 && a_start_side * a_end_side <= 0.0
}

/// The shortest distance between two segments.
///
/// If they cross, the distance is zero. Otherwise the closest pair always involves
/// at least one endpoint, so checking all four endpoints against the opposite
/// segment finds it. That shortcut only holds in the plane, which is all this engine
/// ever works in.
pub fn distance_between_segments(a_start: Vec2, a_end: Vec2, b_start: Vec2, b_end: Vec2) -> f32 {
    if segments_intersect(a_start, a_end, b_start, b_end) {
        return 0.0;
    }

    let candidates = [
        distance_from_point_to_segment(a_start, b_start, b_end),
        distance_from_point_to_segment(a_end, b_start, b_end),
        distance_from_point_to_segment(b_start, a_start, a_end),
        distance_from_point_to_segment(b_end, a_start, a_end),
    ];

    let mut shortest = candidates[0];
    for candidate in candidates {
        if candidate < shortest {
            shortest = candidate;
        }
    }

    shortest
}

#[cfg(test)]
mod tests {
    use super::*;

    const ORIGIN: Vec2 = Vec2 { x: 0.0, y: 0.0 };
    const TEN_RIGHT: Vec2 = Vec2 { x: 10.0, y: 0.0 };

    #[test]
    fn closest_point_lands_between_the_endpoints() {
        let point = Vec2::new(4.0, 3.0);

        let closest = closest_point_on_segment(point, ORIGIN, TEN_RIGHT);

        assert_eq!(closest, Vec2::new(4.0, 0.0));
    }

    #[test]
    fn closest_point_clamps_beyond_the_endpoints() {
        // Without the clamp the projection would run off the end of the segment and
        // report a distance to a point that is not part of the obstacle at all.
        let past_the_end = Vec2::new(25.0, 5.0);
        let before_the_start = Vec2::new(-25.0, 5.0);

        assert_eq!(
            closest_point_on_segment(past_the_end, ORIGIN, TEN_RIGHT),
            TEN_RIGHT
        );
        assert_eq!(
            closest_point_on_segment(before_the_start, ORIGIN, TEN_RIGHT),
            ORIGIN
        );
    }

    #[test]
    fn a_zero_length_segment_returns_its_start() {
        // This is the circle case. Every distance function in this module relies on
        // it, which is why a circular obstacle needs no branch of its own anywhere.
        let centre = Vec2::new(7.0, 7.0);

        assert_eq!(
            closest_point_on_segment(Vec2::new(20.0, 7.0), centre, centre),
            centre
        );
        assert_eq!(
            distance_from_point_to_segment(Vec2::new(20.0, 7.0), centre, centre),
            13.0
        );
    }

    #[test]
    fn distance_to_a_segment_is_measured_perpendicular_where_possible() {
        assert_eq!(
            distance_from_point_to_segment(Vec2::new(5.0, 4.0), ORIGIN, TEN_RIGHT),
            4.0
        );
        // Past the end it becomes the distance to the endpoint instead.
        assert_eq!(
            distance_from_point_to_segment(Vec2::new(13.0, 4.0), ORIGIN, TEN_RIGHT),
            5.0
        );
    }

    #[test]
    fn crossing_segments_are_detected_and_have_zero_distance() {
        let vertical_start = Vec2::new(5.0, -5.0);
        let vertical_end = Vec2::new(5.0, 5.0);

        assert!(segments_intersect(
            ORIGIN,
            TEN_RIGHT,
            vertical_start,
            vertical_end
        ));
        assert_eq!(
            distance_between_segments(ORIGIN, TEN_RIGHT, vertical_start, vertical_end),
            0.0
        );
    }

    #[test]
    fn segments_whose_infinite_lines_cross_outside_them_do_not_intersect() {
        // The classic false positive: treating the segments as infinite lines would
        // report a crossing far off the end of both, and two obstacles a long way
        // apart would be rejected as overlapping.
        let far_away_start = Vec2::new(50.0, -5.0);
        let far_away_end = Vec2::new(50.0, 5.0);

        assert!(!segments_intersect(
            ORIGIN,
            TEN_RIGHT,
            far_away_start,
            far_away_end
        ));
        assert_eq!(
            distance_between_segments(ORIGIN, TEN_RIGHT, far_away_start, far_away_end),
            40.0
        );
    }

    #[test]
    fn parallel_segments_keep_their_gap() {
        let above_start = Vec2::new(2.0, 6.0);
        let above_end = Vec2::new(8.0, 6.0);

        assert_eq!(
            distance_between_segments(ORIGIN, TEN_RIGHT, above_start, above_end),
            6.0
        );
    }

    #[test]
    fn the_distance_between_two_points_is_the_plain_distance() {
        // Two circular obstacles are two zero-length segments, and their clearance
        // check has to come out as the ordinary distance between their centres.
        let first = Vec2::new(1.0, 1.0);
        let second = Vec2::new(4.0, 5.0);

        assert_eq!(distance_between_segments(first, first, second, second), 5.0);
    }

    #[test]
    fn a_point_beside_a_segment_is_not_a_crossing() {
        // A degenerate segment has no side for anything to straddle. Left to the
        // ordinary side test, every point on the segment's infinite line would count
        // as a crossing — including one far past both of its endpoints.
        let point = Vec2::new(40.0, 0.0);

        assert!(!segments_intersect(point, point, ORIGIN, TEN_RIGHT));
        assert_eq!(
            distance_between_segments(point, point, ORIGIN, TEN_RIGHT),
            30.0
        );
    }

    #[test]
    fn touching_endpoints_have_zero_distance() {
        let touching_start = TEN_RIGHT;
        let touching_end = Vec2::new(10.0, 10.0);

        assert_eq!(
            distance_between_segments(ORIGIN, TEN_RIGHT, touching_start, touching_end),
            0.0
        );
    }
}
