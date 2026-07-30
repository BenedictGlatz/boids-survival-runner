use js_sys::{Float32Array, Uint32Array};
use wasm_bindgen::prelude::*;

/// The structured response returned to JavaScript after each frame tick.
///
/// The fields are crate-visible and the struct is built with a struct literal
/// rather than a constructor function. A positional constructor was already at six
/// arguments, and every one of them is a buffer or a count of the same few types —
/// so a caller that swapped two of them would still compile. Naming each field at
/// the one place that fills it makes that mistake impossible instead.
#[wasm_bindgen]
pub struct FrameResponse {
    pub(crate) entity_count: u32,
    pub(crate) hit_count: u32,
    pub(crate) positions: Vec<f32>,
    pub(crate) velocities: Vec<f32>,
    pub(crate) tiers: Vec<u32>,
    pub(crate) dash_phases: Vec<f32>,
}

#[wasm_bindgen]
impl FrameResponse {
    /// Number of boids represented in the positions buffer.
    #[wasm_bindgen(getter)]
    pub fn entity_count(&self) -> u32 {
        self.entity_count
    }

    /// Number of player collisions detected during this frame.
    #[wasm_bindgen(getter)]
    pub fn hit_count(&self) -> u32 {
        self.hit_count
    }

    /// Whether the player was hit during this frame.
    #[wasm_bindgen(getter)]
    pub fn hit(&self) -> bool {
        self.hit_count > 0
    }

    /// Returns a flat positions buffer: [x0, y0, x1, y1, ...].
    pub fn positions(&self) -> Float32Array {
        Float32Array::from(self.positions.as_slice())
    }

    /// Returns a flat velocities buffer: [vx0, vy0, vx1, vy1, ...].
    /// Lets the renderer orient each boid along its heading.
    pub fn velocities(&self) -> Float32Array {
        Float32Array::from(self.velocities.as_slice())
    }

    /// Returns one difficulty tier for each boid in the positions buffer.
    pub fn tiers(&self) -> Uint32Array {
        Uint32Array::from(self.tiers.as_slice())
    }

    /// Returns one dash phase for each boid in the positions buffer, so the
    /// renderer can warn the player about a boid that is about to lunge.
    ///
    /// `0.0` means there is nothing to draw. A value between `0` and `1` means the
    /// boid is charging up and how far through that charge it is. A value between
    /// `-1` and `0` means the boid is dashing and how much of the dash is left.
    pub fn dash_phases(&self) -> Float32Array {
        Float32Array::from(self.dash_phases.as_slice())
    }
}
