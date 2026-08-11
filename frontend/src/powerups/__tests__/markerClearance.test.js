import { describe, expect, it } from 'vitest';

import { OBSTACLE_STRIDE, PLAYER_VISUAL_RADIUS } from '../../gameConfig.js';
import { PICKUP_RADIUS } from '../../renderer/powerupMarkerLayer.js';
import {
  distanceToSegment,
  isTooCloseToAnObstacle,
  MIN_OBSTACLE_CLEARANCE,
} from '../markerClearance.js';

/** One capsule obstacle in the engine's flat layout, so a spawn has something to avoid. */
function frameWithObstacle(startX, startY, endX, endY, radius) {
  const obstacles = new Float32Array(OBSTACLE_STRIDE);
  obstacles[0] = startX;
  obstacles[1] = startY;
  obstacles[2] = endX;
  obstacles[3] = endY;
  obstacles[4] = radius;

  return { obstacles, obstacleCount: 1 };
}

describe('distanceToSegment', () => {
  it('measures the perpendicular when the foot lies on the segment', () => {
    expect(distanceToSegment(50, 30, 0, 0, 100, 0)).toBe(30);
  });

  it('measures against the nearer end when the foot lies beyond it', () => {
    expect(distanceToSegment(-40, 0, 0, 0, 100, 0)).toBe(40);
    expect(distanceToSegment(140, 0, 0, 0, 100, 0)).toBe(40);
  });

  it('falls back to the point distance for a segment of no length', () => {
    expect(distanceToSegment(3, 4, 0, 0, 0, 0)).toBe(5);
  });
});

describe('isTooCloseToAnObstacle', () => {
  it('accepts every spot when the frame carries no obstacles at all', () => {
    expect(isTooCloseToAnObstacle(100, 100, undefined)).toBe(false);
    expect(isTooCloseToAnObstacle(100, 100, {})).toBe(false);
  });

  it('measures against the capsule surface rather than its centre line', () => {
    const radius = 40;
    const frame = frameWithObstacle(0, 0, 200, 0, radius);
    // Just inside and just outside the clearance, measured from the surface both times.
    const tooClose = radius + MIN_OBSTACLE_CLEARANCE - 1;
    const farEnough = radius + MIN_OBSTACLE_CLEARANCE + 1;

    expect(isTooCloseToAnObstacle(100, tooClose, frame)).toBe(true);
    expect(isTooCloseToAnObstacle(100, farEnough, frame)).toBe(false);
  });

  it('measures against whatever clearance the caller asks for', () => {
    const radius = 40;
    const frame = frameWithObstacle(0, 0, 200, 0, radius);
    // A spot 30 px clear of the surface: too close to *place* a marker, but nowhere near close
    // enough to take one back that is already lying there. One question, two thresholds.
    const surfaceGap = 30;

    expect(isTooCloseToAnObstacle(100, radius + surfaceGap, frame)).toBe(true);
    expect(isTooCloseToAnObstacle(100, radius + surfaceGap, frame, 10)).toBe(false);
  });

  it('ignores buffer entries past the reported count', () => {
    const frame = frameWithObstacle(0, 0, 200, 0, 40);
    // The buffer is reused across frames, so a stale entry must not be able to block a spawn.
    frame.obstacleCount = 0;

    expect(isTooCloseToAnObstacle(0, 0, frame)).toBe(false);
  });
});

// The clearance is only meaningful next to a number in another module: it exists so the whole
// glyph plus the player's body fit outside the hazard, which is what keeps a marker from being
// bait that costs a life to reach. Read rather than written down, so resizing the marker moves
// the assertion with it.
describe('the clearance against the drawn marker', () => {
  it('keeps a marker far enough from an obstacle to be stood on', () => {
    expect(MIN_OBSTACLE_CLEARANCE).toBeGreaterThanOrEqual(PICKUP_RADIUS + PLAYER_VISUAL_RADIUS);
  });
});
