use super::boid::Boid;
use super::obstacle::Obstacle;
use super::rules::{alignment, avoid_obstacles, cohesion, seek_target, separation};
use crate::math::vector::Vec2;

// How the steering rules are weighed against each other. The rules themselves return
// unweighted forces and know nothing about priority; the flock loop knows nothing about
// which rules exist. This module is the one place that decides both, which is why it is
// separate from either.
//
// Deliberately without tests of its own: every rule is asserted on individually in
// `rules.rs`, and what this file adds is a weighting policy whose effect is only visible
// in behaviour — a boid getting round an obstacle, a dasher breaking out of the swarm.
// Those are the integration tests in `flock.rs`.

/// The normal steering, used whenever a boid is not dashing.
pub fn flocking_steering(
    boid: &Boid,
    snapshot: &[Boid],
    player_position: Vec2,
    obstacles: &[Obstacle],
) -> Vec2 {
    // Read all steering rules from the same snapshot so every boid reacts to the
    // previous frame, not to neighbours that were already updated.
    let separation_force = separation(boid, snapshot).scale(boid.properties.separation_weight);
    let alignment_force = alignment(boid, snapshot).scale(boid.properties.alignment_weight);
    let cohesion_force = cohesion(boid, snapshot).scale(boid.properties.cohesion_weight);
    let target_force = seek_target(boid, player_position).scale(boid.properties.target_seek_weight);
    // Weighted well above the pull towards the player, or a boid would press into an
    // obstacle rather than going round it: the chase would simply win the tug of war.
    let obstacle_force =
        avoid_obstacles(boid, obstacles).scale(boid.properties.obstacle_avoid_weight);

    separation_force
        .add(alignment_force)
        .add(cohesion_force)
        .add(target_force)
        .add(obstacle_force)
}

/// Steering for a dashing boid: cohesion, alignment and seeking the player are all
/// switched off, leaving only separation. That is what makes a dasher visibly break out
/// of the swarm — and why cohesion pulls it back once the dash is over.
///
/// Obstacle avoidance is off as well. A dash is a committed straight line, and bending it
/// would both make the lunge unpredictable and rob the charge-up pulse of its meaning as
/// a warning. Getting stuck is impossible anyway, because a dash lasts a fixed number of
/// steps.
///
/// Off *steering* around obstacles is not the same as passing through them: a dashing
/// boid that runs into one is stopped and bounced by `obstacle_bounce.rs`, the same way
/// the player is. The dash aims where it aims and takes the consequences.
pub fn dash_steering(boid: &Boid, snapshot: &[Boid]) -> Vec2 {
    separation(boid, snapshot).scale(boid.properties.separation_weight)
}
