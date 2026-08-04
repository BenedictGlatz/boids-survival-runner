/**
 * The one geometric question a marker spawn asks: is this spot far enough from a hazard?
 *
 * Split out of `powerups.js` when Mend arrived and that file reached the 400-line limit. The
 * seam is a real one rather than a convenience: everything here is plain geometry over the
 * engine's obstacle buffer, with no notion of markers, kinds, buffs or the simulation clock —
 * which is also why it is the half that can be tested by handing it six numbers.
 */

import { OBSTACLE_STRIDE } from '../gameConfig.js';

/**
 * Spawn clearance from an obstacle: marker radius 27 plus the player's 16 plus a little.
 *
 * Without it a marker can land inside a hazard capsule, and that is worse than unreachable —
 * the player is pushed out of an obstacle and loses a life doing it, so the marker would be
 * bait rather than a reward. It grew with the marker, and it has to: the slack over those two
 * radii is what the number is for, and leaving it at 60 would have spent all of it.
 */
export const MIN_OBSTACLE_CLEARANCE = 70;

/**
 * Distance from a point to a line segment.
 *
 * A zero-length segment falls back to the plain point distance on its own, which is what
 * makes a circular obstacle need no case of its own: it is a capsule whose line has no length.
 * @param {number} pointX - The point to measure from.
 * @param {number} pointY - The point to measure from.
 * @param {number} startX - One end of the segment.
 * @param {number} startY - One end of the segment.
 * @param {number} endX - The other end of the segment.
 * @param {number} endY - The other end of the segment.
 * @returns {number} The shortest distance between the point and the segment.
 */
export function distanceToSegment(pointX, pointY, startX, startY, endX, endY) {
  const spanX = endX - startX;
  const spanY = endY - startY;
  const spanLengthSquared = spanX * spanX + spanY * spanY;

  if (spanLengthSquared === 0) {
    return Math.hypot(pointX - startX, pointY - startY);
  }

  // How far along the segment the perpendicular foot sits, clamped to the segment itself so
  // a point beyond either end measures against that end rather than against the infinite line.
  const alongTheSegment =
    ((pointX - startX) * spanX + (pointY - startY) * spanY) / spanLengthSquared;
  const clamped = Math.min(Math.max(alongTheSegment, 0), 1);

  return Math.hypot(pointX - (startX + clamped * spanX), pointY - (startY + clamped * spanY));
}

/**
 * Whether a candidate spawn spot is too close to any obstacle in the arena.
 *
 * An obstacle is a capsule — a line segment with a radius — packed as
 * `startX, startY, endX, endY, radius, ...` in the engine's flat buffer.
 * @param {number} x - The candidate spot.
 * @param {number} y - The candidate spot.
 * @param {object} [frame] - The engine's frame, read for `obstacles` and `obstacleCount`. May
 *   be absent, in which case there is nothing to keep clear of and the spot is accepted.
 * @returns {boolean} True when the spot has to be rejected.
 */
export function isTooCloseToAnObstacle(x, y, frame) {
  const obstacles = frame?.obstacles;
  if (!obstacles) return false;

  const obstacleCount = frame.obstacleCount ?? obstacles.length / OBSTACLE_STRIDE;

  for (let index = 0; index < obstacleCount; index += 1) {
    const offset = index * OBSTACLE_STRIDE;
    const distanceToTheSurface =
      distanceToSegment(
        x,
        y,
        obstacles[offset],
        obstacles[offset + 1],
        obstacles[offset + 2],
        obstacles[offset + 3],
      ) - obstacles[offset + 4];

    if (distanceToTheSurface < MIN_OBSTACLE_CLEARANCE) {
      return true;
    }
  }

  return false;
}
