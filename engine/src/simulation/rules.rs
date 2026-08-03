use super::boid::Boid;
use super::obstacle::Obstacle;
use super::obstacle_arming::is_armed;
use crate::constants::{OBSTACLE_LOOK_AHEAD_SHARE, OBSTACLE_TANGENT_SHARE};
use crate::math::vector::Vec2;

/// Separation: steers a boid away from overly close neighbours.
pub fn separation(boid: &Boid, neighbours: &[Boid]) -> Vec2 {
    let mut steering = Vec2::zero();
    let mut count = 0;
    let close_neighbour_radius = boid.close_neighbour_radius();

    for other in neighbours {
        let dist = boid.position.distance_to(other.position);
        if dist > 0.0 && dist < close_neighbour_radius {
            // Nearby boids should push away harder the closer they get. This keeps
            // the swarm readable instead of letting every boid collapse into the
            // same chase line toward the player.
            let closeness = (close_neighbour_radius - dist) / close_neighbour_radius;
            let inverse_distance_strength = close_neighbour_radius / dist;
            // position - other.position = opposite direction
            // normalize() -> calculates the direction
            // scale -> scalar to calculate how far the movement goes
            let diff = boid
                .position
                .sub(other.position)
                .normalize()
                .scale(closeness + inverse_distance_strength);
            steering = steering.add(diff);
            count += 1;
        }
    }

    if count > 0 {
        steering = steering.scale(1.0 / count as f32);
    }

    // last value without a ";" gets returned in RUST
    steering
}

/// Alignment: steers a boid to match the average velocity of its neighbours.
pub fn alignment(boid: &Boid, neighbours: &[Boid]) -> Vec2 {
    let mut avg_vel = Vec2::zero();
    let mut count = 0;
    let perception_radius = boid.properties.perception_radius;

    // velocity of neighbouring boids is added up
    for other in neighbours {
        let dist = boid.position.distance_to(other.position);
        if dist > 0.0 && dist < perception_radius {
            avg_vel = avg_vel.add(other.velocity);
            count += 1;
        }
    }

    // calculate vector based on the average velcoty of neighbouring boids (velocity sum / count)
    if count > 0 {
        avg_vel = avg_vel
            .scale(1.0 / count as f32)
            .normalize()
            .scale(boid.properties.max_speed);
        // Difference compared to the existing velocity
        // last value without a ";" gets returned in RUST
        avg_vel.sub(boid.velocity)
    } else {
        // last value without a ";" gets returned in RUST
        Vec2::zero()
    }
}

/// Cohesion: steers a boid toward the centre of mass of its neighbours.
pub fn cohesion(boid: &Boid, neighbours: &[Boid]) -> Vec2 {
    let mut centre = Vec2::zero();
    let mut count = 0;
    let perception_radius = boid.properties.perception_radius;

    // adds up the positions of all neighbours
    for other in neighbours {
        let dist = boid.position.distance_to(other.position);
        if dist > 0.0 && dist < perception_radius {
            centre = centre.add(other.position);
            count += 1;
        }
    }

    if count > 0 {
        // calculates the average position of all neighbours
        centre = centre.scale(1.0 / count as f32);
        let desired = centre
            // vector from boid to center
            .sub(boid.position)
            // just the direction
            .normalize()
            // scale to max_speed
            // desired speed - current speed = steering
            .scale(boid.properties.max_speed);
        desired.sub(boid.velocity)
    } else {
        Vec2::zero()
    }
}

/// Target seeking: steers a boid toward a specific point, such as the player.
pub fn seek_target(boid: &Boid, target: Vec2) -> Vec2 {
    let desired = target
        .sub(boid.position)
        .normalize()
        .scale(boid.properties.max_speed);

    // last value without a ";" gets returned in RUST
    desired.sub(boid.velocity)
}

/// Obstacle avoidance: steers a boid *past* an obstacle rather than away from it.
///
/// The obvious version of this rule pushes straight out along the surface normal,
/// and it does not work: a boid flying head-on at an obstacle gets a force pointing
/// back the way it came, which cancels its approach and leaves it hovering in front
/// of the surface. That is the "getting stuck on obstacles" the flock has to avoid.
///
/// So the escape direction mixes the outward normal with the **tangent** — the
/// direction along the surface — and picks whichever of the two tangents already
/// agrees with where the boid is flying. The result curves around the obstacle
/// instead of bouncing off it. The force grows as the surface gets closer, so a boid
/// far away is barely deflected and one about to touch turns hard.
///
/// Returned unweighted, like the other four rules; the flock applies the weight.
pub fn avoid_obstacles(boid: &Boid, obstacles: &[Obstacle]) -> Vec2 {
    let mut steering = Vec2::zero();
    let look_ahead = boid.properties.perception_radius * OBSTACLE_LOOK_AHEAD_SHARE;

    if look_ahead <= 0.0 {
        return steering;
    }

    for obstacle in obstacles {
        // An obstacle that is still materialising is not in the world yet. Steering
        // around it early would have the flock part in front of empty space, and it
        // would tell the player the thing is solid before it is.
        if !is_armed(obstacle) {
            continue;
        }

        let contact = obstacle.contact_with_point(boid.position, 0.0);

        if contact.surface_distance >= look_ahead {
            continue;
        }

        // 0 at the edge of the look-ahead range, 1 at the surface, and above 1 for a
        // boid that is already inside — which is exactly when it should turn hardest.
        let urgency = (look_ahead - contact.surface_distance) / look_ahead;

        // Of the two tangents, take the one the boid is already heading towards, so
        // it carries on around the obstacle rather than doubling back.
        let mut tangent = contact.outward_normal.perp();
        if tangent.dot(boid.velocity) < 0.0 {
            tangent = tangent.scale(-1.0);
        }

        let escape = contact
            .outward_normal
            .add(tangent.scale(OBSTACLE_TANGENT_SHARE))
            .normalize();
        let desired = escape.scale(boid.properties.max_speed);

        steering = steering.add(desired.sub(boid.velocity).scale(urgency));
    }

    steering
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::simulation::boid::BoidProperties;
    use crate::simulation::obstacle_arming::begin_arming;

    #[test]
    fn separation_uses_the_current_boids_perception_radius() {
        let boid = Boid::with_properties(
            Vec2::zero(),
            Vec2::zero(),
            BoidProperties {
                perception_radius: 10.0,
                ..BoidProperties::default()
            },
        );
        let neighbour = Boid::new(Vec2::new(8.0, 0.0), Vec2::zero());

        assert_eq!(separation(&boid, &[neighbour]), Vec2::zero());
    }

    #[test]
    fn alignment_uses_the_current_boids_max_speed() {
        let boid = Boid::with_properties(
            Vec2::zero(),
            Vec2::zero(),
            BoidProperties {
                max_speed: 2.0,
                perception_radius: 20.0,
                ..BoidProperties::default()
            },
        );
        let neighbour = Boid::new(Vec2::new(5.0, 0.0), Vec2::new(9.0, 0.0));

        assert_eq!(alignment(&boid, &[neighbour]), Vec2::new(2.0, 0.0));
    }

    #[test]
    fn cohesion_uses_the_current_boids_max_speed() {
        let boid = Boid::with_properties(
            Vec2::zero(),
            Vec2::zero(),
            BoidProperties {
                max_speed: 3.0,
                perception_radius: 20.0,
                ..BoidProperties::default()
            },
        );
        let neighbour = Boid::new(Vec2::new(5.0, 0.0), Vec2::zero());

        assert_eq!(cohesion(&boid, &[neighbour]), Vec2::new(3.0, 0.0));
    }

    #[test]
    fn seek_target_uses_the_current_boids_max_speed() {
        let boid = Boid::with_properties(
            Vec2::zero(),
            Vec2::zero(),
            BoidProperties {
                max_speed: 5.0,
                ..BoidProperties::default()
            },
        );

        assert_eq!(
            seek_target(&boid, Vec2::new(10.0, 0.0)),
            Vec2::new(5.0, 0.0)
        );
    }

    /// A boid flying to the right, with a perception radius of 100 so the look-ahead
    /// range is a round 90.
    fn boid_flying_right(position: Vec2) -> Boid {
        Boid::with_properties(
            position,
            Vec2::new(4.0, 0.0),
            BoidProperties {
                max_speed: 4.0,
                perception_radius: 100.0,
                ..BoidProperties::default()
            },
        )
    }

    fn wall_at(x: f32) -> Obstacle {
        Obstacle::new(Vec2::new(x, -500.0), Vec2::new(x, 500.0), 10.0, 1800)
    }

    #[test]
    fn avoid_obstacles_is_zero_with_nothing_to_avoid() {
        let boid = boid_flying_right(Vec2::zero());

        assert_eq!(avoid_obstacles(&boid, &[]), Vec2::zero());
    }

    #[test]
    fn avoid_obstacles_ignores_an_obstacle_beyond_the_look_ahead_range() {
        // Otherwise every boid would react to every obstacle in the world and the
        // flock would drift around the arena instead of chasing the player.
        let boid = boid_flying_right(Vec2::zero());

        assert_eq!(avoid_obstacles(&boid, &[wall_at(400.0)]), Vec2::zero());
    }

    #[test]
    fn avoid_obstacles_ignores_an_obstacle_that_is_still_materialising() {
        // It is not in the world yet, so the flock must not part in front of it.
        let boid = boid_flying_right(Vec2::zero());
        let mut appearing = wall_at(60.0);
        begin_arming(&mut appearing, 90);

        assert_eq!(avoid_obstacles(&boid, &[appearing]), Vec2::zero());
    }

    #[test]
    fn avoid_obstacles_pushes_away_from_the_surface() {
        let boid = boid_flying_right(Vec2::zero());

        let steering = avoid_obstacles(&boid, &[wall_at(60.0)]);

        // The wall is to the right, so the force must have a leftward component.
        assert!(steering.x < 0.0);
    }

    #[test]
    fn avoid_obstacles_adds_a_sideways_component_on_a_head_on_approach() {
        // The point of the rule. A purely outward force would be exactly opposite to
        // the boid's heading and would stall it in front of the wall rather than
        // taking it round, which is the "hanging on obstacles" this has to prevent.
        let boid = boid_flying_right(Vec2::zero());

        let steering = avoid_obstacles(&boid, &[wall_at(60.0)]);

        assert!(steering.y.abs() > 0.0);
    }

    #[test]
    fn avoid_obstacles_turns_the_way_the_boid_is_already_drifting() {
        // Two boids on opposite sides of a bar's centre have to go round opposite
        // ends. Always taking the same tangent would send one of them the long way.
        let bar = Obstacle::new(Vec2::new(60.0, -500.0), Vec2::new(60.0, 500.0), 10.0, 1800);
        let mut drifting_up = boid_flying_right(Vec2::zero());
        drifting_up.velocity = Vec2::new(4.0, -1.0);
        let mut drifting_down = boid_flying_right(Vec2::zero());
        drifting_down.velocity = Vec2::new(4.0, 1.0);

        let up = avoid_obstacles(&drifting_up, &[bar]);
        let down = avoid_obstacles(&drifting_down, &[bar]);

        assert!(up.y < 0.0);
        assert!(down.y > 0.0);
    }

    #[test]
    fn avoid_obstacles_gets_stronger_the_closer_the_surface_is() {
        let far = boid_flying_right(Vec2::new(0.0, 0.0));
        let near = boid_flying_right(Vec2::new(40.0, 0.0));

        let far_steering = avoid_obstacles(&far, &[wall_at(90.0)]);
        let near_steering = avoid_obstacles(&near, &[wall_at(90.0)]);

        assert!(near_steering.length() > far_steering.length());
    }

    #[test]
    fn avoid_obstacles_sums_the_pull_of_several_obstacles() {
        let boid = boid_flying_right(Vec2::zero());
        let ahead = wall_at(60.0);
        let below = Obstacle::circle(Vec2::new(0.0, 50.0), 10.0, 1800);

        let one = avoid_obstacles(&boid, &[ahead]);
        let both = avoid_obstacles(&boid, &[ahead, below]);

        assert_ne!(one, both);
    }
}
