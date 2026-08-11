//! The hazards standing in the arena: what one is, when it counts, what it does
//! to something that runs into it, and how new ones are placed.
//!
//! Nine modules in three groups. `shape` is the capsule itself and its geometry,
//! with `arming` on top of it — an obstacle that is still materialising is drawn
//! but not yet solid, and `arming` is the only place that knows the difference.
//! `collision`, `bounce` and `pushout` are what happens on contact: one swept
//! movement test shared by the player and the boids, the boid-side reflection
//! built on it, and the safety net for a boid that was *displaced* into a hazard
//! rather than having moved there. `field`, `density`, `rules` and `spawn` are
//! the life cycle: which obstacles exist right now, how crowded the arena gets
//! per wave, the four placement rules that make dead ends impossible, and the
//! deterministic candidate generator they judge.

pub mod arming;
pub mod bounce;
pub mod collision;
pub mod density;
pub mod field;
pub mod pushout;
pub mod rules;
pub mod shape;
pub mod spawn;

// Re-exported so everything about a hazard is reachable through this one module
// path, the same facade `dash` has always had. The submodules stay public for
// the tests beside them; callers outside this folder use the short form.
pub use arming::{is_armed, obstacle_render_phase};
pub use bounce::bounce_boid_off_obstacles;
pub use collision::resolve_movement_against_obstacles;
pub use field::ObstacleField;
pub use pushout::push_boids_out_of_obstacles;
pub use shape::Obstacle;
