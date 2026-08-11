import { describe, expect, it } from 'vitest';

import { spawnLevelForWave, spawnTierForWave } from '../waveTier.js';
import { BOID_COLORS } from '../../renderer/entityPalette.js';
import { MAX_BOID_DIFFICULTY_TIER } from '../../gameConfig.js';

describe('spawnTierForWave', () => {
  it('starts the first wave at the baseline tier', () => {
    expect(spawnTierForWave(1)).toBe(0);
  });

  it('climbs one tier per wave', () => {
    expect(spawnTierForWave(2)).toBe(1);
    expect(spawnTierForWave(3)).toBe(2);
    expect(spawnTierForWave(4)).toBe(3);
  });

  it('stops climbing at the highest variant', () => {
    expect(spawnTierForWave(5)).toBe(MAX_BOID_DIFFICULTY_TIER);
    expect(spawnTierForWave(40)).toBe(MAX_BOID_DIFFICULTY_TIER);
  });

  // The HUD reads the wave straight out of the round state, which is 1 before the first step
  // runs — but a broken or missing value must not produce a negative colour index.
  it('never returns a tier below the baseline', () => {
    expect(spawnTierForWave(0)).toBe(0);
    expect(spawnTierForWave(-7)).toBe(0);
    expect(spawnTierForWave(undefined)).toBe(0);
  });

  it('rounds a fractional wave down rather than landing between tiers', () => {
    expect(spawnTierForWave(2.9)).toBe(1);
  });

  // The whole point of the clamp: the HUD paints the value in BOID_COLORS[tier] without a
  // second bounds check, so the palette has to be exactly as long as the ramp is high.
  it('never leaves the boid palette', () => {
    expect(BOID_COLORS).toHaveLength(MAX_BOID_DIFFICULTY_TIER + 1);

    for (let wave = 1; wave <= 20; wave += 1) {
      expect(BOID_COLORS[spawnTierForWave(wave)]).toBeDefined();
    }
  });
});

describe('spawnLevelForWave', () => {
  it('counts from one, the way a player reads it', () => {
    expect(spawnLevelForWave(1)).toBe(1);
    expect(spawnLevelForWave(3)).toBe(3);
  });

  it('freezes at the last level once the ramp is done', () => {
    expect(spawnLevelForWave(5)).toBe(MAX_BOID_DIFFICULTY_TIER + 1);
    expect(spawnLevelForWave(12)).toBe(MAX_BOID_DIFFICULTY_TIER + 1);
  });
});
