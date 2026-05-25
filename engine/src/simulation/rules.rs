use crate::math::vector::Vec2;
use crate::constants::{MAX_SPEED, PERCEPTION_RADIUS};
use super::boid::Boid;

/// Separation: steers a boid away from overly close neighbours.
pub fn separation(boid: &Boid, neighbours: &[Boid]) -> Vec2 {
    let mut steering = Vec2::zero();
    let mut count = 0;

    for other in neighbours {
        let dist = boid.position.distance_to(other.position);
        if dist > 0.0 && dist < PERCEPTION_RADIUS / 2.0 {
            let diff = boid.position.sub(other.position).normalize().scale(1.0 / dist);
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

    for other in neighbours {
        let dist = boid.position.distance_to(other.position);
        if dist > 0.0 && dist < PERCEPTION_RADIUS {
            avg_vel = avg_vel.add(other.velocity);
            count += 1;
        }
    }

    if count > 0 {
        avg_vel = avg_vel.scale(1.0 / count as f32).normalize().scale(MAX_SPEED);
        avg_vel.sub(boid.velocity)
    } else {
        Vec2::zero()
    }
}

/// Cohesion: steers a boid toward the centre of mass of its neighbours.
pub fn cohesion(boid: &Boid, neighbours: &[Boid]) -> Vec2 {
    let mut centre = Vec2::zero();
    let mut count = 0;

    for other in neighbours {
        let dist = boid.position.distance_to(other.position);
        if dist > 0.0 && dist < PERCEPTION_RADIUS {
            centre = centre.add(other.position);
            count += 1;
        }
    }

    if count > 0 {
        centre = centre.scale(1.0 / count as f32);
        let desired = centre.sub(boid.position).normalize().scale(MAX_SPEED);
        desired.sub(boid.velocity)
    } else {
        Vec2::zero()
    }
}
