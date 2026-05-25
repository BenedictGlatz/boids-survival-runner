use super::boid::Boid;
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

    steering
}

/// Alignment: steers a boid to match the average velocity of its neighbours.
pub fn alignment(boid: &Boid, neighbours: &[Boid]) -> Vec2 {
    let mut avg_vel = Vec2::zero();
    let mut count = 0;
    let perception_radius = boid.properties.perception_radius;

    for other in neighbours {
        let dist = boid.position.distance_to(other.position);
        if dist > 0.0 && dist < perception_radius {
            avg_vel = avg_vel.add(other.velocity);
            count += 1;
        }
    }

    if count > 0 {
        avg_vel = avg_vel
            .scale(1.0 / count as f32)
            .normalize()
            .scale(boid.properties.max_speed);
        avg_vel.sub(boid.velocity)
    } else {
        Vec2::zero()
    }
}

/// Cohesion: steers a boid toward the centre of mass of its neighbours.
pub fn cohesion(boid: &Boid, neighbours: &[Boid]) -> Vec2 {
    let mut centre = Vec2::zero();
    let mut count = 0;
    let perception_radius = boid.properties.perception_radius;

    for other in neighbours {
        let dist = boid.position.distance_to(other.position);
        if dist > 0.0 && dist < perception_radius {
            centre = centre.add(other.position);
            count += 1;
        }
    }

    if count > 0 {
        centre = centre.scale(1.0 / count as f32);
        let desired = centre
            .sub(boid.position)
            .normalize()
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

    desired.sub(boid.velocity)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::simulation::boid::BoidProperties;

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
}
