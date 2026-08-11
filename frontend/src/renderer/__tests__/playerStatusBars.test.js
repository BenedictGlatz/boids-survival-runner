import { describe, expect, it } from 'vitest';

import { PLAYER_VISUAL_RADIUS, WORLD_HEIGHT, WORLD_WIDTH } from '../../gameConfig.js';
import {
  drawPlayerStatusBars,
  healthSegmentWidth,
  statusStackLayout,
} from '../playerStatusBars.js';

/**
 * A stand-in for the canvas context that records what was filled, in order. Only the four
 * members the module touches are implemented; anything else would be a test of the mock.
 */
function fakeContext() {
  const rects = [];

  return {
    rects,
    set fillStyle(color) {
      this._fillStyle = color;
    },
    get fillStyle() {
      return this._fillStyle;
    },
    fillRect(x, y, width, height) {
      rects.push({ x, y, width, height, color: this._fillStyle });
    },
  };
}

const CENTER = { x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.5 };

describe('statusStackLayout', () => {
  it('centres the stack on the player', () => {
    const stack = statusStackLayout(CENTER);

    expect(stack.x + stack.width * 0.5).toBeCloseTo(CENTER.x, 6);
  });

  it('places the stack below the player', () => {
    const stack = statusStackLayout(CENTER);

    expect(stack.y).toBeGreaterThan(CENTER.y + PLAYER_VISUAL_RADIUS);
  });

  it('holds the stack inside the world at the left edge', () => {
    const stack = statusStackLayout({ x: 0, y: CENTER.y });

    expect(stack.x).toBeGreaterThanOrEqual(0);
  });

  it('holds the stack inside the world at the right edge', () => {
    const stack = statusStackLayout({ x: WORLD_WIDTH, y: CENTER.y });

    expect(stack.x + stack.width).toBeLessThanOrEqual(WORLD_WIDTH);
  });

  it('pushes the stack up off the bottom edge instead of hanging over it', () => {
    const stack = statusStackLayout({ x: CENTER.x, y: WORLD_HEIGHT });
    const highest = statusStackLayout(CENTER);

    // Both bars plus their gap have to fit, so the stack ends strictly inside the world.
    expect(stack.y).toBeLessThan(WORLD_HEIGHT);
    expect(stack.y).toBeGreaterThan(highest.y);
  });
});

describe('healthSegmentWidth', () => {
  it('fills the bar exactly with one segment', () => {
    expect(healthSegmentWidth(1)).toBe(statusStackLayout(CENTER).width);
  });

  it('leaves room for the gaps between several segments', () => {
    const width = statusStackLayout(CENTER).width;
    const segments = 3;
    const segmentWidth = healthSegmentWidth(segments);
    const gaps = width - segmentWidth * segments;

    expect(segmentWidth).toBeLessThan(width / segments);
    expect(gaps).toBeGreaterThan(0);
  });
});

describe('drawPlayerStatusBars', () => {
  it('draws nothing without a player', () => {
    const ctx = fakeContext();
    drawPlayerStatusBars(ctx, undefined, { lives: 3, maxLives: 3 });

    expect(ctx.rects).toHaveLength(0);
  });

  it('draws nothing when the state carries no lives', () => {
    const ctx = fakeContext();
    drawPlayerStatusBars(ctx, CENTER, {});

    expect(ctx.rects).toHaveLength(0);
  });

  it('draws a backdrop, one rect per life and the dash track plus its fill', () => {
    const ctx = fakeContext();
    drawPlayerStatusBars(ctx, CENTER, { lives: 2, maxLives: 3, dashCooldownProgress: 0.5 });

    expect(ctx.rects).toHaveLength(1 + 3 + 2);
  });

  it('leaves the dash bar out when the state carries no cooldown', () => {
    const ctx = fakeContext();
    drawPlayerStatusBars(ctx, CENTER, { lives: 3, maxLives: 3 });

    expect(ctx.rects).toHaveLength(1 + 3);
  });

  it('fills the dash bar in proportion to the cooldown', () => {
    const ctx = fakeContext();
    drawPlayerStatusBars(ctx, CENTER, { lives: 1, maxLives: 1, dashCooldownProgress: 0.25 });

    const [track, fill] = ctx.rects.slice(-2);
    expect(fill.width).toBeCloseTo(track.width * 0.25, 6);
  });

  it('clamps a cooldown outside 0..1 to the bar', () => {
    const ctx = fakeContext();
    drawPlayerStatusBars(ctx, CENTER, { lives: 1, maxLives: 1, dashCooldownProgress: 4 });

    const [track, fill] = ctx.rects.slice(-2);
    expect(fill.width).toBe(track.width);
  });

  it('marks a recharged dash in a different colour than a recovering one', () => {
    const ready = fakeContext();
    const recovering = fakeContext();
    drawPlayerStatusBars(ready, CENTER, { lives: 1, maxLives: 1, dashCooldownProgress: 1 });
    drawPlayerStatusBars(recovering, CENTER, { lives: 1, maxLives: 1, dashCooldownProgress: 0.9 });

    expect(ready.rects.at(-1).color).not.toBe(recovering.rects.at(-1).color);
  });

  it('keeps the dash bar clear of the life segments', () => {
    const ctx = fakeContext();
    drawPlayerStatusBars(ctx, CENTER, { lives: 3, maxLives: 3, dashCooldownProgress: 1 });

    const lifeSegment = ctx.rects[1];
    const dashTrack = ctx.rects.at(-2);
    expect(dashTrack.y).toBeGreaterThanOrEqual(lifeSegment.y + lifeSegment.height);
  });

  it('treats a missing maxLives as the current lives', () => {
    const ctx = fakeContext();
    drawPlayerStatusBars(ctx, CENTER, { lives: 2 });

    // Backdrop plus two segments — no empty ones, because nothing has been lost yet.
    expect(ctx.rects).toHaveLength(1 + 2);
  });
});
