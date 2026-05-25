use wasm_bindgen::prelude::*;

/// The structured response returned to JavaScript after each frame tick.
#[wasm_bindgen]
pub struct FrameResponse {
    /// Flat entity buffer: [x0, y0, vx0, vy0, x1, y1, vx1, vy1, …]
    pub entity_count: u32,
    /// Whether the player was hit this frame.
    pub hit: bool,
}

#[wasm_bindgen]
impl FrameResponse {
    /// Creates a new frame response.
    pub fn new(entity_count: u32, hit: bool) -> Self {
        Self { entity_count, hit }
    }
}
