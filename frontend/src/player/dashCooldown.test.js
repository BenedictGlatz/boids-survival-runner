import { describe, expect, it } from 'vitest';
import { dashCooldownProgress, isDashReady } from './dashCooldown.js';

// Mirrors PLAYER_DASH_COOLDOWN_MS without importing the config, the way
// frameGraphScale.test.js does: the test pins the behaviour, not the tuning.
const COOLDOWN = 1400;

describe('isDashReady', () => {
  it('reports the dash as available at the very start of a round', () => {
    // index.js seeds the timestamp a whole cooldown into the past so the player
    // does not have to wait out a cooldown they never used.
    expect(isDashReady(0, -COOLDOWN, COOLDOWN)).toBe(true);
  });

  it('blocks a second dash immediately after the first one', () => {
    expect(isDashReady(1000, 1000, COOLDOWN)).toBe(false);
  });

  it('still blocks the dash one millisecond before the cooldown is over', () => {
    expect(isDashReady(1000 + COOLDOWN - 1, 1000, COOLDOWN)).toBe(false);
  });

  it('releases the dash exactly when the cooldown has elapsed', () => {
    expect(isDashReady(1000 + COOLDOWN, 1000, COOLDOWN)).toBe(true);
  });
});

describe('dashCooldownProgress', () => {
  it('is empty in the step the dash was used', () => {
    expect(dashCooldownProgress(1000, 1000, COOLDOWN)).toBe(0);
  });

  it('is half full halfway through the cooldown', () => {
    expect(dashCooldownProgress(1000 + COOLDOWN / 2, 1000, COOLDOWN)).toBeCloseTo(0.5, 6);
  });

  it('grows without ever going backwards while the cooldown runs', () => {
    let previous = -1;

    for (let elapsedMs = 0; elapsedMs <= COOLDOWN; elapsedMs += 100) {
      const progress = dashCooldownProgress(elapsedMs, 0, COOLDOWN);

      expect(progress).toBeGreaterThanOrEqual(previous);
      previous = progress;
    }
  });

  it('stops at a full bar instead of overflowing once the dash is ready again', () => {
    // The bar is drawn from this value, so a value above 1 would paint outside it.
    expect(dashCooldownProgress(COOLDOWN * 5, 0, COOLDOWN)).toBe(1);
  });

  it('never reports a negative bar for the seeded start-of-round timestamp', () => {
    expect(dashCooldownProgress(0, -COOLDOWN, COOLDOWN)).toBe(1);
  });

  it('reports a full bar for a cooldown of zero instead of dividing by it', () => {
    expect(dashCooldownProgress(0, 0, 0)).toBe(1);
  });
});
