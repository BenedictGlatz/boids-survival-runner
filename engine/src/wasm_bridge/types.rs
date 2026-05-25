use wasm_bindgen::prelude::*;

/// Flat representation of a single entity for the JS boundary.
/// Uses plain f32 fields so the data can be packed into a `Float32Array`.
#[wasm_bindgen]
#[derive(Debug, Clone, Copy)]
pub struct EntityData {
    pub x: f32,
    pub y: f32,
    pub vx: f32,
    pub vy: f32,
}

/// Player state passed from JavaScript each frame.
#[wasm_bindgen]
#[derive(Debug, Clone, Copy)]
pub struct PlayerState {
    pub x: f32,
    pub y: f32,
}
