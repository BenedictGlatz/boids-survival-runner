//! The whole simulation. Knows nothing about the DOM, the canvas, or any browser
//! API — everything in here would run just as well in a terminal.
//!
//! Four of the eight entries are single files and form the core that everything
//! else is built on:
//!
//! - `boid` — what one boid *is*: position, velocity, and its own tuning values.
//!   Deliberately per boid rather than global, because several variants fly in
//!   one flock at the same time.
//! - `physics` — `integrate`, `clamp_force`, `aabb_overlap`. Three primitives,
//!   no state.
//! - `overlap` — unstacking the flock after a step, and the wrap at the world edge.
//! - `flock` — the one orchestrator. `Flock::update()` is a single simulation
//!   step and calls into every folder below.
//!
//! The other four are folders, one per system sitting on that core. Each has a
//! `mod.rs` that re-exports the names used from outside, so a caller writes
//! `obstacle::Obstacle` rather than `obstacle::shape::Obstacle`:
//!
//! - `steering` — where a boid wants to go: the rules and their weighting.
//! - `dash` — the lunge: tuning, who is picked, the state machine, the aim.
//! - `obstacle` — the hazards: the capsule, contact, and the placement life cycle.
//! - `wave` — how the next wave is announced and where it enters the arena.

pub mod boid;
pub mod dash;
pub mod flock;
pub mod obstacle;
pub mod overlap;
pub mod physics;
pub mod steering;
pub mod wave;
