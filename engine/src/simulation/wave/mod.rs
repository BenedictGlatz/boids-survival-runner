//! Everything about a wave arriving: when it is announced, where it enters the
//! arena, and how the world border is measured to answer that.
//!
//! The three modules split the question into its parts. `queue` is the waiting
//! room — it holds boids for the warning window and knows nothing about where
//! they will appear. `placement` is the geometry of the gates. `world_edge` is
//! the border itself, walked as one number, which the placement rides on.

pub mod placement;
pub mod queue;
pub mod world_edge;

// Re-exported so everything about a wave's arrival is reachable through this one
// module path, the same facade `dash` has always had. Callers outside this folder
// use the short form; the submodules stay public for the tests beside them.
pub use placement::{gate_perimeter_offset, gate_spawn_position, inward_velocity};
pub use queue::{wave_spawn_warning_progress, PendingSpawn, WaveSpawnQueue};
pub use world_edge::safe_spawn_distance;
