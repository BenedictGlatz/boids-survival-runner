//! The boid dash: who does it, what it costs, where it goes, and how far.
//!
//! Four modules along the life of one lunge. `properties` is the tuning per
//! difficulty tier. `selection` decides who is offered the next dash, derived
//! from the step counter rather than from a random number generator, so a run
//! replays identically. `state` is the machine every chosen boid then walks
//! through, `Idle -> Charging -> Dashing -> Cooling`. `aim` answers where the
//! lunge would go and how far it carries -- the single source the launch and
//! the drawn warning line both read, so the line cannot promise a direction
//! the launch will not take.

pub mod aim;
pub mod properties;
pub mod selection;
pub mod state;

// Re-exported so everything about the dash can be reached through this one
// module path. This facade is older than the folder: `dash.rs` carried it for
// `dash_properties` alone, and the folder only widened it to all four files.
pub use aim::dash_aim_end;
pub use properties::{dash_properties_for_difficulty_tier, DashProperties};
pub use selection::select_dash_group;
pub use state::{
    advance_dash_state, begin_dash_charge, dash_render_phase, is_charging, is_dashing,
    step_speed_limit, DashState,
};
