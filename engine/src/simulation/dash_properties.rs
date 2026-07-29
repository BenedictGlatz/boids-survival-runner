use crate::constants::{
    DASH_CHARGE_STEPS_PER_TIER_REDUCTION, DASH_COOLDOWN_STEPS_PER_TIER_REDUCTION,
    DASH_SPEED_MULTIPLIER_PER_TIER_BONUS, DASH_STEPS_PER_TIER_BONUS, DASH_UNLOCK_DIFFICULTY_TIER,
    DEFAULT_DASH_CHARGE_STEPS, DEFAULT_DASH_COOLDOWN_STEPS, DEFAULT_DASH_SPEED_MULTIPLIER,
    DEFAULT_DASH_STEPS, MINIMUM_DASH_CHARGE_STEPS,
};

/// Per-boid dash tuning.
///
/// This lives on the boid so different boid variants can dash differently;
/// `constants.rs` only holds the defaults these values are built from. Every
/// duration is counted in simulation steps, never in milliseconds.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct DashProperties {
    /// `false` for low difficulty tiers, which never dash at all.
    pub can_dash: bool,
    /// Length of the visible charge-up (the warning), in simulation steps.
    pub charge_steps: u32,
    /// Length of the dash itself, in simulation steps.
    pub dash_steps: u32,
    /// Steps the boid must wait after a dash before it may dash again.
    pub cooldown_steps: u32,
    /// Factor applied to the boid's maximum speed while it is dashing.
    pub speed_multiplier: f32,
}

impl Default for DashProperties {
    fn default() -> Self {
        Self {
            // Switched off by default: only high difficulty tiers turn this on.
            can_dash: false,
            charge_steps: DEFAULT_DASH_CHARGE_STEPS,
            dash_steps: DEFAULT_DASH_STEPS,
            cooldown_steps: DEFAULT_DASH_COOLDOWN_STEPS,
            speed_multiplier: DEFAULT_DASH_SPEED_MULTIPLIER,
        }
    }
}

/// Builds the dash tuning for one difficulty tier.
///
/// Tiers below the unlock tier keep the default tuning with `can_dash` switched
/// off, so the boids of the first two waves never dash. The flag is a separate
/// value on purpose: a charge-up of zero steps is a legitimate tuning value
/// ("dash without a warning") and must not double as the off switch.
pub fn dash_properties_for_difficulty_tier(difficulty_tier: u32) -> DashProperties {
    if difficulty_tier < DASH_UNLOCK_DIFFICULTY_TIER {
        return DashProperties::default();
    }

    let tier = difficulty_tier as f32;

    DashProperties {
        can_dash: true,
        // Higher tiers give a shorter warning, but never so short that the player
        // has no chance to read the pulse and step aside.
        charge_steps: DEFAULT_DASH_CHARGE_STEPS
            .saturating_sub(difficulty_tier * DASH_CHARGE_STEPS_PER_TIER_REDUCTION)
            .max(MINIMUM_DASH_CHARGE_STEPS),
        dash_steps: DEFAULT_DASH_STEPS + difficulty_tier * DASH_STEPS_PER_TIER_BONUS,
        cooldown_steps: DEFAULT_DASH_COOLDOWN_STEPS
            .saturating_sub(difficulty_tier * DASH_COOLDOWN_STEPS_PER_TIER_REDUCTION),
        speed_multiplier: DEFAULT_DASH_SPEED_MULTIPLIER
            + tier * DASH_SPEED_MULTIPLIER_PER_TIER_BONUS,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn boids_below_the_dash_tier_are_never_allowed_to_dash() {
        for tier in 0..DASH_UNLOCK_DIFFICULTY_TIER {
            assert!(!dash_properties_for_difficulty_tier(tier).can_dash);
        }
    }

    #[test]
    fn boids_at_the_dash_tier_are_allowed_to_dash() {
        let properties = dash_properties_for_difficulty_tier(DASH_UNLOCK_DIFFICULTY_TIER);

        assert!(properties.can_dash);
    }

    #[test]
    fn higher_tiers_charge_for_a_shorter_time_and_dash_faster() {
        let low = dash_properties_for_difficulty_tier(DASH_UNLOCK_DIFFICULTY_TIER);
        let high = dash_properties_for_difficulty_tier(DASH_UNLOCK_DIFFICULTY_TIER + 2);

        assert!(high.charge_steps < low.charge_steps);
        assert!(high.charge_steps >= MINIMUM_DASH_CHARGE_STEPS);
        assert!(high.speed_multiplier > low.speed_multiplier);
        assert!(high.cooldown_steps < low.cooldown_steps);
    }
}
