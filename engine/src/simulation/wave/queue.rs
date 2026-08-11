//! The waiting room between a wave being announced and its boids joining the flock.
//!
//! A wave used to appear the instant the round clock reached it. Nothing announced it,
//! and "far enough from the player" was measured at that same instant — so a player
//! already moving towards the spot met a boid that had materialised in front of them.
//! A wave now spends `WAVE_SPAWN_WARNING_STEPS` in here first: the gates it will come
//! through are already drawn at the world edge, and nothing is in the world yet.
//!
//! Only the timing lives here. *Where* a gate opens is `wave_spawn_placement.rs`, and
//! what a boid is made of stays in `wasm_bridge`, which owns the per-tier properties.
//! This module therefore knows nothing about boids at all — it holds the three values a
//! boid is built from and hands them back when the warning has run out.

use crate::math::vector::Vec2;

/// One boid that has been announced but has not entered the world yet.
pub struct PendingSpawn {
    pub position: Vec2,
    pub velocity: Vec2,
    pub difficulty_tier: u32,
    /// The full warning window, kept so the progress below can be a fraction of it.
    pub warning_steps: u32,
    pub remaining_warning_steps: u32,
}

impl PendingSpawn {
    /// Announces a boid at `position`, to arrive `warning_steps` simulation steps later.
    ///
    /// A window of zero arrives on the very next step, which is what the tests that are
    /// not about the warning itself use.
    pub fn new(position: Vec2, velocity: Vec2, difficulty_tier: u32, warning_steps: u32) -> Self {
        Self {
            position,
            velocity,
            difficulty_tier,
            warning_steps,
            remaining_warning_steps: warning_steps,
        }
    }
}

/// Every boid currently announced, and how much of its warning is left.
///
/// Modelled on `ObstacleField`: a list plus a one-step advance, with the rule that
/// nothing enters the world without passing through it. The queue belongs to the engine
/// rather than to the flock, because the flock has no concept of an entity that does not
/// exist yet.
pub struct WaveSpawnQueue {
    pub pending: Vec<PendingSpawn>,
}

impl WaveSpawnQueue {
    pub fn new() -> Self {
        Self {
            pending: Vec::new(),
        }
    }

    pub fn len(&self) -> usize {
        self.pending.len()
    }

    /// Whether nothing at all is announced, which is what most steps of a round see.
    pub fn is_empty(&self) -> bool {
        self.pending.is_empty()
    }

    /// Puts one announced boid into the queue.
    pub fn announce(&mut self, spawn: PendingSpawn) {
        self.pending.push(spawn);
    }

    /// Advances every announcement by one simulation step.
    ///
    /// Ageing and handing out are two calls rather than one, because the caller has to
    /// be able to age the queue once and then take however many boids that step made
    /// due. Folding them together would need a return value, and a `Vec` handed back
    /// every step would be an allocation on the hot path for the many steps where
    /// nothing is due.
    pub fn advance_one_step(&mut self) {
        for spawn in &mut self.pending {
            if spawn.remaining_warning_steps > 0 {
                spawn.remaining_warning_steps -= 1;
            }
        }
    }

    /// Takes the next boid whose warning has run out, or `None` while none has.
    ///
    /// Called in a loop after `advance_one_step`, so a step where several gates open at
    /// once hands out all of them. The order announcements were made in is preserved,
    /// which is what keeps the flock's boid indices — and therefore the whole simulation
    /// — reproducible from the same wave numbers.
    pub fn take_next_due(&mut self) -> Option<PendingSpawn> {
        let due_index = self
            .pending
            .iter()
            .position(|spawn| spawn.remaining_warning_steps == 0)?;

        Some(self.pending.remove(due_index))
    }
}

/// How far through its warning an announced boid is, for the gate the frontend draws.
///
/// `0.0` the step it is announced, climbing towards `1.0` as the arrival approaches.
/// Unlike `dash_render_phase` and `obstacle_render_phase` there is no "nothing to draw"
/// value and no sign trick: an entry only exists in the buffer while it is pending, so
/// the count already says how many gates there are and every value in it is real.
///
/// Exactly `1.0` never reaches the frontend — a boid with no warning left is taken out
/// of the queue in the same step — so the frontend draws the range `[0, 1)`.
pub fn wave_spawn_warning_progress(spawn: &PendingSpawn) -> f32 {
    if spawn.warning_steps == 0 {
        return 1.0;
    }

    1.0 - spawn.remaining_warning_steps as f32 / spawn.warning_steps as f32
}

#[cfg(test)]
mod tests {
    use super::*;

    const WARNING: u32 = 120;

    fn announced_spawn() -> PendingSpawn {
        PendingSpawn::new(Vec2::new(10.0, 500.0), Vec2::new(3.0, 0.0), 2, WARNING)
    }

    fn queue_with_one() -> WaveSpawnQueue {
        let mut queue = WaveSpawnQueue::new();
        queue.announce(announced_spawn());

        queue
    }

    #[test]
    fn a_new_queue_is_empty() {
        assert!(WaveSpawnQueue::new().is_empty());
    }

    #[test]
    fn an_announced_boid_is_not_handed_out_yet() {
        // The whole guarantee in one assertion: announcing must not put anything into
        // the world, or the warning would be decoration on top of the old behaviour.
        let mut queue = queue_with_one();

        assert_eq!(queue.len(), 1);
        assert!(queue.take_next_due().is_none());
    }

    #[test]
    fn a_boid_arrives_after_exactly_its_warning_window() {
        // The window is the player's reaction time, so it must be neither a step short
        // nor a step long.
        let mut queue = queue_with_one();

        for _ in 0..WARNING - 1 {
            queue.advance_one_step();
            assert!(queue.take_next_due().is_none());
        }

        queue.advance_one_step();
        assert!(queue.take_next_due().is_some());
        assert!(queue.is_empty());
    }

    #[test]
    fn an_empty_warning_window_arrives_on_the_first_step() {
        let mut queue = WaveSpawnQueue::new();
        queue.announce(PendingSpawn::new(Vec2::zero(), Vec2::zero(), 0, 0));

        assert!(queue.take_next_due().is_some());
    }

    #[test]
    fn a_step_that_opens_several_gates_hands_out_all_of_them() {
        // A whole wave shares one warning window, so this is the ordinary case rather
        // than an edge case: every boid of the wave becomes due on the same step.
        let mut queue = WaveSpawnQueue::new();

        for _ in 0..12 {
            queue.announce(announced_spawn());
        }

        for _ in 0..WARNING {
            queue.advance_one_step();
        }

        let mut handed_out = 0;
        while queue.take_next_due().is_some() {
            handed_out += 1;
        }

        assert_eq!(handed_out, 12);
        assert!(queue.is_empty());
    }

    #[test]
    fn what_was_announced_is_what_comes_out() {
        let mut queue = WaveSpawnQueue::new();
        let position = Vec2::new(1910.0, 700.0);
        let velocity = Vec2::new(-2.0, 1.0);
        queue.announce(PendingSpawn::new(position, velocity, 3, 0));

        let arrived = queue.take_next_due().expect("the boid was due");

        assert_eq!(arrived.position, position);
        assert_eq!(arrived.velocity, velocity);
        assert_eq!(arrived.difficulty_tier, 3);
    }

    #[test]
    fn announcements_are_handed_out_in_the_order_they_were_made() {
        // Boid indices are handed out in this order, and the dash selection derives who
        // lunges from them — so a queue that reordered would make the simulation depend
        // on something other than the wave number.
        let mut queue = WaveSpawnQueue::new();

        for tier in 0..4 {
            queue.announce(PendingSpawn::new(Vec2::zero(), Vec2::zero(), tier, 0));
        }

        for expected_tier in 0..4 {
            let arrived = queue.take_next_due().expect("all four were due");
            assert_eq!(arrived.difficulty_tier, expected_tier);
        }
    }

    #[test]
    fn the_warning_progress_starts_at_zero_and_climbs() {
        // What the gate's intensity is drawn from. Starting at zero is what makes a gate
        // appear faintly rather than at full strength.
        let mut queue = queue_with_one();

        assert_eq!(wave_spawn_warning_progress(&queue.pending[0]), 0.0);

        for _ in 0..WARNING / 2 {
            queue.advance_one_step();
        }

        assert!((wave_spawn_warning_progress(&queue.pending[0]) - 0.5).abs() < 1e-5);
    }

    #[test]
    fn the_warning_progress_stays_inside_the_range_the_renderer_expects() {
        let mut queue = queue_with_one();

        for _ in 0..WARNING - 1 {
            let progress = wave_spawn_warning_progress(&queue.pending[0]);
            assert!((0.0..1.0).contains(&progress), "progress {progress}");
            queue.advance_one_step();
        }

        let progress = wave_spawn_warning_progress(&queue.pending[0]);
        assert!((0.0..1.0).contains(&progress), "progress {progress}");
    }

    #[test]
    fn ageing_a_boid_past_its_window_cannot_underflow() {
        // The queue is aged on every simulation step, and a caller that forgets to take
        // a due boid must not bring the engine down on the next one.
        let mut queue = queue_with_one();

        for _ in 0..WARNING * 2 {
            queue.advance_one_step();
        }

        assert_eq!(queue.pending[0].remaining_warning_steps, 0);
    }
}
