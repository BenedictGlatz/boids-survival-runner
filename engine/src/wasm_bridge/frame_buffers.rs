//! How one frame is packed for the frontend: the strides, and the single function that
//! fills every buffer.
//!
//! Split out of `wasm_bridge/mod.rs` when the dash warning lines pushed that file past the
//! project's length limit, along the same seam `boid_factory.rs` was: `mod.rs` owns the
//! `#[wasm_bindgen]` surface and the engine's life cycle, this file owns the buffer contract
//! that crosses the boundary. It is an `impl GameEngine` block rather than a set of free
//! functions because the buffers it fills are the engine's own, kept from frame to frame so
//! that a frame costs no allocation.
//!
//! The contract itself is documented where it is read rather than here — every getter on
//! `FrameResponse` spells out the layout of the buffer it returns. What this file adds is
//! the *order* the values are pushed in, which is the half a stride cannot express.

use super::response::FrameResponse;
use super::GameEngine;
use crate::simulation::dash::{dash_render_phase, is_charging};
use crate::simulation::dash_aim::dash_aim_end;
use crate::simulation::obstacle_arming::obstacle_render_phase;
use crate::simulation::wave_spawn::wave_spawn_warning_progress;

/// Values per obstacle in the obstacle buffer. Kept in step with the frontend's
/// OBSTACLE_STRIDE, and asserted on in the WASM boundary tests.
const OBSTACLE_STRIDE: usize = 7;

/// Values per announced spawn in the spawn-marker buffer. Kept in step with the
/// frontend's SPAWN_MARKER_STRIDE, and asserted on in the WASM boundary tests.
const SPAWN_MARKER_STRIDE: usize = 3;

/// Values per charging boid in the dash-aim buffer. Kept in step with the frontend's
/// DASH_AIM_STRIDE, and asserted on in the WASM boundary tests.
const DASH_AIM_STRIDE: usize = 5;

impl GameEngine {
    /// Packs the current state of the world into the buffers the frontend reads.
    ///
    /// Advances nothing. `tick()` calls it after the step is done and then patches the four
    /// values only a move can produce onto the result; `snapshot()` calls it on its own.
    pub(super) fn build_frame_response(&mut self, hit_count: u32) -> FrameResponse {
        self.positions_buffer.clear();
        self.velocities_buffer.clear();
        self.tiers_buffer.clear();
        self.dash_phases_buffer.clear();
        self.obstacles_buffer.clear();
        self.spawn_markers_buffer.clear();
        // No reserve for the dash aims: clearing keeps the capacity, so after the first few
        // dashes of a round the buffer already holds the high-water mark. Counting the
        // charging boids first just to reserve for them would be a second pass over the
        // whole flock every frame for an allocation that has long since happened.
        self.dash_aims_buffer.clear();
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

        // DASH_AIM_STRIDE values each: the warning line the frontend draws in front of a
        // boid that is about to lunge, from the boid to where that lunge would end.
        //
        // A pass of its own rather than a branch inside the boid loop above, because this
        // buffer is deliberately *not* index-aligned with the four that loop fills: only a
        // handful of boids charge at once, so each entry carries its own position and its
        // own copy of the charge progress.
        //
        // Charging boids only. The line exists exactly as long as the pulse does: a boid
        // that has launched is no longer announcing a dash, it is flying it — and the
        // trail the frontend draws behind it takes over from there.
        for boid in &self.flock.boids {
            if !is_charging(boid) {
                continue;
            }

            let aim_end = dash_aim_end(boid, self.last_player_position);
            self.dash_aims_buffer.push(boid.position.x);
            self.dash_aims_buffer.push(boid.position.y);
            self.dash_aims_buffer.push(aim_end.x);
            self.dash_aims_buffer.push(aim_end.y);
            self.dash_aims_buffer.push(dash_render_phase(boid));
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
            dash_aim_count: (self.dash_aims_buffer.len() / DASH_AIM_STRIDE) as u32,
            dash_aims: self.dash_aims_buffer.clone(),
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
