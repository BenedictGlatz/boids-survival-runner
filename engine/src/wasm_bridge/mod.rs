pub mod response;

use self::response::FrameResponse;
use crate::constants::{
    DEFAULT_ALIGNMENT_WEIGHT, DEFAULT_COHESION_WEIGHT, DEFAULT_MAX_ACCELERATION, DEFAULT_MAX_SPEED,
    DEFAULT_PERCEPTION_RADIUS, DEFAULT_SEPARATION_WEIGHT, DEFAULT_TARGET_SEEK_WEIGHT,
    INITIAL_BOID_COUNT, MAX_BOID_DIFFICULTY_TIER, WAVE_BOID_INCREMENT,
};
use crate::math::vector::Vec2;
use crate::simulation::boid::{Boid, BoidProperties};
use crate::simulation::dash::{dash_properties_for_difficulty_tier, dash_render_phase};
use crate::simulation::flock::Flock;
use wasm_bindgen::prelude::*;

const GOLDEN_ANGLE: f32 = 2.399_963_1;

/// Browser-facing simulation engine.
#[wasm_bindgen]
pub struct GameEngine {
    flock: Flock,
    world_width: f32,
    world_height: f32,
    initial_boid_count: u32,
    current_wave: u32,
    positions_buffer: Vec<f32>,
    velocities_buffer: Vec<f32>,
    tiers_buffer: Vec<u32>,
    dash_phases_buffer: Vec<f32>,
}

#[wasm_bindgen]
impl GameEngine {
    /// Creates a new simulation with deterministic starting positions.
    #[wasm_bindgen(constructor)]
    pub fn new(width: u32, height: u32, boid_count: u32, player_x: f32, player_y: f32) -> Self {
        let world_width = width.max(1) as f32;
        let world_height = height.max(1) as f32;
        let spawn_count = if boid_count == 0 {
            INITIAL_BOID_COUNT
        } else {
            boid_count
        };
        let player_position = Vec2::new(player_x, player_y);

        let mut flock = Flock::new();

        for index in 0..spawn_count {
            flock.add(create_boid_for_wave(
                index,
                1,
                world_width,
                world_height,
                player_position,
            ));
        }

        Self {
            flock,
            world_width,
            world_height,
            initial_boid_count: spawn_count,
            current_wave: 1,
            positions_buffer: Vec::with_capacity(spawn_count as usize * 2),
            velocities_buffer: Vec::with_capacity(spawn_count as usize * 2),
            tiers_buffer: Vec::with_capacity(spawn_count as usize),
            dash_phases_buffer: Vec::with_capacity(spawn_count as usize),
        }
    }

    /// Updates the simulation by one frame and returns render data for JavaScript.
    pub fn tick(&mut self, player_x: f32, player_y: f32) -> FrameResponse {
        let player_position = Vec2::new(player_x, player_y);
        let hit_count = self
            .flock
            .update(player_position, self.world_width, self.world_height);

        self.build_frame_response(hit_count)
    }

    /// Returns render data for the current frame without advancing the simulation.
    pub fn snapshot(&mut self) -> FrameResponse {
        self.build_frame_response(0)
    }

    /// Ensures all boids for the requested wave have been spawned.
    pub fn set_wave(&mut self, wave: u32, player_x: f32, player_y: f32) {
        if wave <= self.current_wave {
            return;
        }

        let player_position = Vec2::new(player_x, player_y);

        while self.current_wave < wave {
            self.current_wave += 1;
            self.spawn_wave_boids(self.current_wave, player_position);
        }
    }

    /// Updates the simulation bounds after the browser viewport changes size.
    pub fn resize(&mut self, width: u32, height: u32) {
        self.world_width = width.max(1) as f32;
        self.world_height = height.max(1) as f32;
    }
}

impl GameEngine {
    fn spawn_wave_boids(&mut self, wave: u32, player_position: Vec2) {
        let target_count = self.initial_boid_count + (wave - 1) * WAVE_BOID_INCREMENT;

        while self.flock.len() < target_count as usize {
            let index = self.flock.len() as u32;
            self.flock.add(create_boid_for_wave(
                index,
                wave,
                self.world_width,
                self.world_height,
                player_position,
            ));
        }
    }

    fn build_frame_response(&mut self, hit_count: u32) -> FrameResponse {
        self.positions_buffer.clear();
        self.velocities_buffer.clear();
        self.tiers_buffer.clear();
        self.dash_phases_buffer.clear();

        for boid in &self.flock.boids {
            self.positions_buffer.push(boid.position.x);
            self.positions_buffer.push(boid.position.y);
            self.velocities_buffer.push(boid.velocity.x);
            self.velocities_buffer.push(boid.velocity.y);
            self.tiers_buffer.push(boid.difficulty_tier);
            self.dash_phases_buffer.push(dash_render_phase(boid));
        }

        FrameResponse::new(
            self.flock.len() as u32,
            hit_count,
            self.positions_buffer.clone(),
            self.velocities_buffer.clone(),
            self.tiers_buffer.clone(),
            self.dash_phases_buffer.clone(),
        )
    }
}

fn create_boid_for_wave(
    index: u32,
    wave: u32,
    world_width: f32,
    world_height: f32,
    player_position: Vec2,
) -> Boid {
    let difficulty_tier = difficulty_tier_for_wave(wave);
    let position = find_spawn_position(index, wave, world_width, world_height, player_position);
    let angle = (index as f32 + wave as f32 * 11.0) * GOLDEN_ANGLE;
    let velocity = Vec2::new(angle.cos(), angle.sin()).scale(DEFAULT_MAX_SPEED * 0.5);

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
        dash: dash_properties_for_difficulty_tier(difficulty_tier),
    }
}

fn difficulty_tier_for_wave(wave: u32) -> u32 {
    wave.saturating_sub(1).min(MAX_BOID_DIFFICULTY_TIER)
}

fn find_spawn_position(
    index: u32,
    wave: u32,
    world_width: f32,
    world_height: f32,
    player_position: Vec2,
) -> Vec2 {
    let safe_distance = safe_spawn_distance(world_width, world_height);

    for attempt in 0..32 {
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

fn safe_spawn_distance(world_width: f32, world_height: f32) -> f32 {
    let minimum_dimension = world_width.min(world_height);
    let desired_distance = (minimum_dimension * 0.34).max(180.0);
    let maximum_reasonable_distance = (minimum_dimension * 0.48).max(80.0);

    desired_distance.min(maximum_reasonable_distance)
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

    #[test]
    fn starting_boids_spawn_away_from_the_player() {
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
        let player_position = Vec2::new(500.0, 400.0);
        let first_wave_boid = create_boid_for_wave(0, 1, 1000.0, 800.0, player_position);
        let later_wave_boid = create_boid_for_wave(0, 5, 1000.0, 800.0, player_position);

        assert!(later_wave_boid.difficulty_tier > first_wave_boid.difficulty_tier);
        assert!(later_wave_boid.properties.max_speed > first_wave_boid.properties.max_speed);
        assert!(
            later_wave_boid.properties.max_acceleration
                > first_wave_boid.properties.max_acceleration
        );
    }

    #[test]
    fn boids_from_the_first_two_waves_cannot_dash() {
        let player_position = Vec2::new(500.0, 400.0);

        for wave in 1..=2 {
            let boid = create_boid_for_wave(0, wave, 1000.0, 800.0, player_position);
            assert!(!boid.properties.dash.can_dash);
        }
    }

    #[test]
    fn boids_from_the_third_wave_onward_can_dash() {
        let player_position = Vec2::new(500.0, 400.0);
        let boid = create_boid_for_wave(0, 3, 1000.0, 800.0, player_position);

        assert!(boid.properties.dash.can_dash);
    }
}
