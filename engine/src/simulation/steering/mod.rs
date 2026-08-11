//! How a boid decides where to go.
//!
//! The split is between the rules and their weighting. `rules` holds the five
//! steering forces as pure functions, each answering one question and returning
//! an unweighted force. `weights` is the policy that says how much each of them
//! counts -- and that a dashing boid listens to separation only, which is what
//! makes it break out of the swarm.

pub mod rules;
pub mod weights;

// Re-exported so `flock` asks this module for a steering force without needing
// to know that the weighting lives one file further down.
pub use weights::{dash_steering, flocking_steering};
