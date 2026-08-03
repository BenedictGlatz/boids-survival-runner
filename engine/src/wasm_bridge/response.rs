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
    pub(crate) obstacle_count: u32,
    pub(crate) obstacles: Vec<f32>,
    pub(crate) spawn_marker_count: u32,
    pub(crate) spawn_markers: Vec<f32>,
    pub(crate) player_x: f32,
    pub(crate) player_y: f32,
    pub(crate) obstacle_hit: bool,
    pub(crate) block_normal_x: f32,
    pub(crate) block_normal_y: f32,
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

    /// Number of obstacles packed into the obstacles buffer.
    #[wasm_bindgen(getter)]
    pub fn obstacle_count(&self) -> u32 {
        self.obstacle_count
    }

    /// Returns the obstacles as a flat buffer of seven values each:
    /// `[spine_start_x, spine_start_y, spine_end_x, spine_end_y, radius, render_phase,
    /// hit_flash]`.
    ///
    /// An obstacle is a capsule — a centre line swept by a circle of that radius —
    /// and a circular obstacle is the one whose two spine points coincide. There is
    /// deliberately no shape field: drawing a zero-length line with a round cap
    /// produces the circle, so both shapes are one drawing call rather than two.
    ///
    /// `render_phase` carries the whole life cycle in one signed number, exactly as
    /// `dash_phases` does for the boids. A value between `-1` and `0` means the obstacle
    /// is still materialising and how much of that window is left, and it is **not solid
    /// yet**: the renderer fades it in over this range, and the engine lets the player
    /// and the flock pass straight through it. A value between `0` and `1` is the
    /// remaining life of a solid obstacle, which the closing fade is drawn from. Exactly
    /// `0.0` never occurs, so the sign is always meaningful.
    ///
    /// `hit_flash` packs its own state the same way: `1.0` right after the player ran
    /// into this obstacle, down to `0.0`, and `0.0` whenever there is nothing to
    /// highlight.
    pub fn obstacles(&self) -> Float32Array {
        Float32Array::from(self.obstacles.as_slice())
    }

    /// Number of spawn markers packed into the spawn-marker buffer.
    #[wasm_bindgen(getter)]
    pub fn spawn_marker_count(&self) -> u32 {
        self.spawn_marker_count
    }

    /// Returns the announced spawns as a flat buffer of three values each:
    /// `[x, y, warning_progress]`.
    ///
    /// One entry per boid of the next wave that has been announced but has **not entered
    /// the world yet**: this buffer is the warning, and while an entry is in it there is
    /// nothing at that position to collide with. The entry disappears on the step the
    /// boid appears in the position buffer instead.
    ///
    /// `warning_progress` runs from `0.0` the step the wave is announced towards `1.0` as
    /// the arrival approaches, and the frontend scales the marker's intensity by it. There
    /// is deliberately no "nothing to draw" value and no sign trick as in `dash_phases` or
    /// an obstacle's `render_phase`: an entry only exists while it is pending, so
    /// `spawn_marker_count` already says how many markers there are and every value in the
    /// buffer is a real one. Exactly `1.0` never arrives here, because a boid with no
    /// warning left joins the flock in the same step it would have reached it.
    pub fn spawn_markers(&self) -> Float32Array {
        Float32Array::from(self.spawn_markers.as_slice())
    }

    /// The player's position after the engine resolved the move against the
    /// obstacles. Equal to the attempted position unless something was in the way.
    #[wasm_bindgen(getter)]
    pub fn player_x(&self) -> f32 {
        self.player_x
    }

    /// The player's resolved y position. See `player_x`.
    #[wasm_bindgen(getter)]
    pub fn player_y(&self) -> f32 {
        self.player_y
    }

    /// Whether the player ran into an obstacle during this step and should lose a life.
    #[wasm_bindgen(getter)]
    pub fn obstacle_hit(&self) -> bool {
        self.obstacle_hit
    }

    /// The x component of the surface normal at the point of contact.
    ///
    /// Zero when nothing was hit. It points back at the side the player came from, so
    /// the caller can turn the part of its velocity that ran into the obstacle around
    /// and keep the part running along it: the collision becomes a small knockback plus
    /// a slide rather than a full stop.
    #[wasm_bindgen(getter)]
    pub fn block_normal_x(&self) -> f32 {
        self.block_normal_x
    }

    /// The y component of the contact surface normal. See `block_normal_x`.
    #[wasm_bindgen(getter)]
    pub fn block_normal_y(&self) -> f32 {
        self.block_normal_y
    }
}
