mod boid_factory;
pub mod response;

use self::boid_factory::{build_boid, create_boid_for_wave, difficulty_tier_for_wave};
use self::response::FrameResponse;
use crate::constants::{
    DEFAULT_MAX_SPEED, INITIAL_BOID_COUNT, PLAYER_COLLISION_RADIUS, WAVE_BOID_INCREMENT,
    WAVE_SPAWN_GATE_COUNT, WAVE_SPAWN_WARNING_STEPS,
};
use crate::math::vector::Vec2;
use crate::simulation::dash::dash_render_phase;
use crate::simulation::flock::Flock;
use crate::simulation::obstacle_arming::obstacle_render_phase;
use crate::simulation::obstacle_collision::resolve_movement_against_obstacles;
use crate::simulation::obstacle_field::ObstacleField;
use crate::simulation::wave_spawn::{wave_spawn_warning_progress, PendingSpawn, WaveSpawnQueue};
use crate::simulation::wave_spawn_placement::{
    gate_perimeter_offset, gate_spawn_position, inward_velocity,
};
use wasm_bindgen::prelude::*;

/// Values per obstacle in the obstacle buffer. Kept in step with the frontend's
/// OBSTACLE_STRIDE, and asserted on in the WASM boundary tests.
const OBSTACLE_STRIDE: usize = 7;

/// Values per announced spawn in the spawn-marker buffer. Kept in step with the
/// frontend's SPAWN_MARKER_STRIDE, and asserted on in the WASM boundary tests.
const SPAWN_MARKER_STRIDE: usize = 3;

/// Browser-facing simulation engine.
#[wasm_bindgen]
pub struct GameEngine {
    flock: Flock,
    obstacle_field: ObstacleField,
    wave_spawns: WaveSpawnQueue,
    world_width: f32,
    world_height: f32,
    initial_boid_count: u32,
    current_wave: u32,
    positions_buffer: Vec<f32>,
    velocities_buffer: Vec<f32>,
    tiers_buffer: Vec<u32>,
    dash_phases_buffer: Vec<f32>,
    obstacles_buffer: Vec<f32>,
    spawn_markers_buffer: Vec<f32>,
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

        // The very first flock is placed straight into the world rather than announced at
        // the gates every later wave comes through. It is the one wave that needs no
        // warning: it is already there when the round's countdown starts, so the player
        // can see the whole arena before moving, and a gate would be announcing boids the
        // player is looking at.
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
            obstacle_field: ObstacleField::new(),
            wave_spawns: WaveSpawnQueue::new(),
            world_width,
            world_height,
            initial_boid_count: spawn_count,
            current_wave: 1,
            positions_buffer: Vec::with_capacity(spawn_count as usize * 2),
            velocities_buffer: Vec::with_capacity(spawn_count as usize * 2),
            tiers_buffer: Vec::with_capacity(spawn_count as usize),
            dash_phases_buffer: Vec::with_capacity(spawn_count as usize),
            obstacles_buffer: Vec::new(),
            spawn_markers_buffer: Vec::new(),
        }
    }

    /// Updates the simulation by one frame and returns render data for JavaScript.
    ///
    /// The player moved from the previous position to the attempted one during this
    /// step. Both are needed because an obstacle may have been in the way: the engine
    /// tests the whole move rather than only where it ended, pushes the player back
    /// clear of anything it ran into, and reports the surface normal so the caller can
    /// bounce its velocity off the obstacle instead of stopping dead.
    pub fn tick(
        &mut self,
        previous_x: f32,
        previous_y: f32,
        attempted_x: f32,
        attempted_y: f32,
    ) -> FrameResponse {
        let previous = Vec2::new(previous_x, previous_y);
        let attempted = Vec2::new(attempted_x, attempted_y);

        // Resolved before anything else moves, so the flock steers against and is
        // tested against the position the player really ends up in.
        let resolution = resolve_movement_against_obstacles(
            &self.obstacle_field.obstacles,
            previous,
            attempted,
            PLAYER_COLLISION_RADIUS,
        );
        let player_position = resolution.position;

        // Lighting up what was hit, while the index still refers to the obstacle it was
        // taken from — the field update below removes whatever expired this step and
        // would shift the rest along.
        if let Some(index) = resolution.hit_obstacle {
            self.obstacle_field.obstacles[index].mark_player_hit();
        }

        // Before the flock steps, so a boid that arrives this step is part of the swarm
        // its neighbours steer against straight away rather than a step later.
        self.release_due_wave_spawns();

        // Obstacles age and spawn before the flock steps, so a boid never steers
        // against an obstacle that has already gone.
        self.obstacle_field.update(
            self.flock.step_counter,
            self.current_wave,
            player_position,
            self.world_width,
            self.world_height,
        );

        let hit_count = self.flock.update(
            player_position,
            &self.obstacle_field.obstacles,
            self.world_width,
            self.world_height,
        );

        let mut response = self.build_frame_response(hit_count);
        response.player_x = player_position.x;
        response.player_y = player_position.y;
        response.obstacle_hit = resolution.blocked;
        response.block_normal_x = resolution.surface_normal.x;
        response.block_normal_y = resolution.surface_normal.y;

        response
    }

    /// Returns render data for the current frame without advancing the simulation.
    pub fn snapshot(&mut self) -> FrameResponse {
        self.build_frame_response(0)
    }

    /// Announces every boid the requested wave owes, at the gates it will arrive through.
    ///
    /// **This does not add anything to the world.** The boids enter
    /// `WAVE_SPAWN_WARNING_STEPS` later, one gate's worth at a time, as `tick()` works
    /// the queue down — until then they are only the markers in the spawn-marker buffer.
    /// A caller that wants them present has to keep ticking; `entity_count` deliberately
    /// lags the wave number for the length of the warning, because that is the truth
    /// about how many boids are actually in the arena.
    ///
    /// The player position decides where the gates open, so it is asked for here rather
    /// than when the boids arrive: the warning is only honest if it is drawn at the place
    /// the wave really comes from, which means the place has to be fixed up front.
    pub fn set_wave(&mut self, wave: u32, player_x: f32, player_y: f32) {
        if wave <= self.current_wave {
            return;
        }

        let player_position = Vec2::new(player_x, player_y);

        while self.current_wave < wave {
            self.current_wave += 1;
            self.announce_wave_boids(self.current_wave, player_position);
        }
    }

    /// Sets new simulation bounds and drops the obstacles the smaller world can no longer
    /// hold.
    ///
    /// The game does not call this any more: the world is a fixed logical size and the
    /// frontend letterboxes it into the window, so resizing the browser never changes the
    /// simulation. The method stays regardless, because the world bounds belong to the
    /// engine rather than to the browser — a caller that wants a different arena (a test, a
    /// future level size) needs a way to say so, and the guarantee that shrinking the world
    /// cannot pocket the player in is asserted on here and nowhere else. Do not remove it
    /// as dead code.
    pub fn resize(&mut self, width: u32, height: u32) {
        self.world_width = width.max(1) as f32;
        self.world_height = height.max(1) as f32;

        // A window that shrank can leave an obstacle outside the world or pressed
        // against a new edge, and an obstacle against a wall is the one arrangement
        // that could pocket the player in. Those obstacles disappear rather than being
        // moved, which keeps the guarantee unconditional at the cost of a visible pop.
        self.obstacle_field
            .drop_obstacles_outside(self.world_width, self.world_height);
    }
}

impl GameEngine {
    /// Splits a wave across its gates and announces every boid of it.
    ///
    /// The count is measured against the flock *plus* what is already announced. Reading
    /// the flock alone would announce the same wave again on the next call, because its
    /// boids have not arrived yet.
    fn announce_wave_boids(&mut self, wave: u32, player_position: Vec2) {
        let target_count = self.initial_boid_count + (wave - 1) * WAVE_BOID_INCREMENT;
        let accounted_for = (self.flock.len() + self.wave_spawns.len()) as u32;

        if accounted_for >= target_count {
            return;
        }

        let arriving = target_count - accounted_for;
        let difficulty_tier = difficulty_tier_for_wave(wave);
        let gate_count = WAVE_SPAWN_GATE_COUNT.max(1);
        // Half the default top speed, the same pace the very first flock is launched at.
        let launch_speed = DEFAULT_MAX_SPEED * 0.5;

        for gate_index in 0..gate_count {
            // The remainder is handed to the first gates one boid each, so a wave of ten
            // across three gates becomes 4/3/3 rather than 3/3/3 and a lost boid.
            let mut slots_in_gate = arriving / gate_count;
            if gate_index < arriving % gate_count {
                slots_in_gate += 1;
            }

            if slots_in_gate == 0 {
                continue;
            }

            let gate_offset = gate_perimeter_offset(
                wave,
                gate_index,
                self.world_width,
                self.world_height,
                player_position,
            );

            for slot in 0..slots_in_gate {
                let position = gate_spawn_position(
                    gate_offset,
                    slot,
                    slots_in_gate,
                    self.world_width,
                    self.world_height,
                );
                let velocity = inward_velocity(
                    position,
                    slot,
                    launch_speed,
                    self.world_width,
                    self.world_height,
                );

                self.wave_spawns.announce(PendingSpawn::new(
                    position,
                    velocity,
                    difficulty_tier,
                    WAVE_SPAWN_WARNING_STEPS,
                ));
            }
        }
    }

    /// Ages the announcements by one step and lets in whatever that made due.
    fn release_due_wave_spawns(&mut self) {
        // The ordinary case. A wave is only pending for two of the thirty seconds between
        // waves, so the vast majority of steps have nothing to age at all.
        if self.wave_spawns.is_empty() {
            return;
        }

        self.wave_spawns.advance_one_step();

        while let Some(spawn) = self.wave_spawns.take_next_due() {
            self.flock.add(build_boid(
                spawn.position,
                spawn.velocity,
                spawn.difficulty_tier,
            ));
        }
    }

    fn build_frame_response(&mut self, hit_count: u32) -> FrameResponse {
        self.positions_buffer.clear();
        self.velocities_buffer.clear();
        self.tiers_buffer.clear();
        self.dash_phases_buffer.clear();
        self.obstacles_buffer.clear();
        self.spawn_markers_buffer.clear();
        // Unlike the boid buffers these two cannot be sized once at construction: the
        // obstacle count changes as they come and go, and the marker count is zero for
        // most of a wave. Reserving here keeps them from regrowing on the frames where
        // something new appears.
        self.obstacles_buffer
            .reserve(self.obstacle_field.len() * OBSTACLE_STRIDE);
        self.spawn_markers_buffer
            .reserve(self.wave_spawns.len() * SPAWN_MARKER_STRIDE);

        for boid in &self.flock.boids {
            self.positions_buffer.push(boid.position.x);
            self.positions_buffer.push(boid.position.y);
            self.velocities_buffer.push(boid.velocity.x);
            self.velocities_buffer.push(boid.velocity.y);
            self.tiers_buffer.push(boid.difficulty_tier);
            self.dash_phases_buffer.push(dash_render_phase(boid));
        }

        // OBSTACLE_STRIDE values each, in this order. There is no shape flag: a
        // circular obstacle has both spine points in the same place, which the
        // frontend draws as a round line cap without a branch of its own. The last two
        // values are the render states an obstacle can be in — materialising, fading
        // out at the end of its life, and flashing red after a hit — one float each,
        // the first of them signed the way the dash phase is.
        for obstacle in &self.obstacle_field.obstacles {
            self.obstacles_buffer.push(obstacle.spine_start.x);
            self.obstacles_buffer.push(obstacle.spine_start.y);
            self.obstacles_buffer.push(obstacle.spine_end.x);
            self.obstacles_buffer.push(obstacle.spine_end.y);
            self.obstacles_buffer.push(obstacle.radius);
            self.obstacles_buffer.push(obstacle_render_phase(obstacle));
            self.obstacles_buffer.push(obstacle.hit_flash());
        }

        // SPAWN_MARKER_STRIDE values each: where a boid of the next wave will enter, and
        // how far through its warning that announcement is. One entry per announced boid
        // rather than one per gate — the boids of a gate stand close enough together that
        // the glows the frontend draws merge into a single arc, so the marker is literally
        // the spot each boid appears at and the gate needs no separate concept here.
        for spawn in &self.wave_spawns.pending {
            self.spawn_markers_buffer.push(spawn.position.x);
            self.spawn_markers_buffer.push(spawn.position.y);
            self.spawn_markers_buffer
                .push(wave_spawn_warning_progress(spawn));
        }

        FrameResponse {
            entity_count: self.flock.len() as u32,
            hit_count,
            positions: self.positions_buffer.clone(),
            velocities: self.velocities_buffer.clone(),
            tiers: self.tiers_buffer.clone(),
            dash_phases: self.dash_phases_buffer.clone(),
            obstacle_count: self.obstacle_field.len() as u32,
            obstacles: self.obstacles_buffer.clone(),
            spawn_marker_count: self.wave_spawns.len() as u32,
            spawn_markers: self.spawn_markers_buffer.clone(),
            // Filled in by tick(). A snapshot moves nobody, so there is nothing to
            // correct and nothing to report.
            player_x: 0.0,
            player_y: 0.0,
            obstacle_hit: false,
            block_normal_x: 0.0,
            block_normal_y: 0.0,
        }
    }
}
