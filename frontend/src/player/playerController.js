import {
  PLAYER_ACCELERATION,
  PLAYER_DASH_SPEED,
  PLAYER_DASH_SPEED_DECAY,
  PLAYER_DECELERATION,
  PLAYER_MAX_DELTA_SECONDS,
  PLAYER_MAX_SPEED,
  PLAYER_OBSTACLE_BOUNCE,
  PLAYER_VISUAL_RADIUS,
} from '../gameConfig.js';

/** Integrates the player's position and velocity, including the dash. */
export class PlayerController {
  constructor() {
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    // Normally the same as PLAYER_MAX_SPEED. A dash raises it for a moment and it
    // then falls back on its own, which is the whole of the dash mechanic.
    this._speedLimit = PLAYER_MAX_SPEED;
  }

  /**
   * @param {number} x - Starting position.
   * @param {number} y - Starting position.
   */
  reset(x, y) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };
    this._speedLimit = PLAYER_MAX_SPEED;
  }

  /**
   * Integrates the player for one simulation step.
   *
   * `controls` carries the movement direction and whether a dash starts on this
   * step. A dash only happens with a direction held: dashing on the spot has no
   * meaningful direction, so the caller keeps its cooldown in that case.
   * @param {{direction: {x: number, y: number}, dash: boolean}} controls - This step's input.
   * @param {number} deltaSeconds - Wall-clock time since the previous step.
   * @param {{width: number, height: number}} bounds - Current world size.
   * @returns {{x: number, y: number}} The player's position after integration.
   */
  update(controls, deltaSeconds, bounds) {
    const safeDeltaSeconds = Math.min(Math.max(deltaSeconds, 0), PLAYER_MAX_DELTA_SECONDS);
    const direction = controls.direction;
    const isMoving = direction.x !== 0 || direction.y !== 0;

    if (controls.dash === true && isMoving) {
      this._startDash(direction);
    } else if (isMoving) {
      this.velocity.x += direction.x * PLAYER_ACCELERATION * safeDeltaSeconds;
      this.velocity.y += direction.y * PLAYER_ACCELERATION * safeDeltaSeconds;
    } else {
      this.velocity.x = moveTowardZero(this.velocity.x, PLAYER_DECELERATION * safeDeltaSeconds);
      this.velocity.y = moveTowardZero(this.velocity.y, PLAYER_DECELERATION * safeDeltaSeconds);
    }

    // The extra speed of a dash bleeds off over the next few steps, so the dash
    // eases out as if slowed by friction instead of stopping dead. Without the
    // raised limit the impulse would be clamped away in the same step it started.
    this._speedLimit = Math.max(
      PLAYER_MAX_SPEED,
      this._speedLimit - PLAYER_DASH_SPEED_DECAY * safeDeltaSeconds,
    );
    limitVelocity(this.velocity, this._speedLimit);

    this.position.x += this.velocity.x * safeDeltaSeconds;
    this.position.y += this.velocity.y * safeDeltaSeconds;
    this.clampToBounds(bounds);

    return this.getPosition();
  }

  _startDash(direction) {
    this.velocity.x = direction.x * PLAYER_DASH_SPEED;
    this.velocity.y = direction.y * PLAYER_DASH_SPEED;
    this._speedLimit = PLAYER_DASH_SPEED;
  }

  /** @param {{width: number, height: number}} bounds - Current world size. */
  clampToBounds(bounds) {
    const minX = PLAYER_VISUAL_RADIUS;
    const minY = PLAYER_VISUAL_RADIUS;
    const maxX = Math.max(minX, bounds.width - PLAYER_VISUAL_RADIUS);
    const maxY = Math.max(minY, bounds.height - PLAYER_VISUAL_RADIUS);

    const nextX = clamp(this.position.x, minX, maxX);
    const nextY = clamp(this.position.y, minY, maxY);
    const hitAWall = nextX !== this.position.x || nextY !== this.position.y;

    if (nextX !== this.position.x) {
      this.velocity.x = 0;
      this.position.x = nextX;
    }

    if (nextY !== this.position.y) {
      this.velocity.y = 0;
      this.position.y = nextY;
    }

    // A dash into the edge of the world ends there. Leaving the raised limit in
    // place would let ordinary movement run above the top speed for the rest of
    // the dash window.
    if (hitAWall) {
      this._speedLimit = PLAYER_MAX_SPEED;
    }
  }

  /**
   * Accepts the engine's correction after the player ran into an obstacle.
   *
   * The engine owns the obstacle geometry and has already worked out where the player
   * actually ends up — a little way clear of the obstacle, on the side they came from.
   * All that is left here is the velocity: the component pointing into the surface is
   * turned around at a fraction of its strength and the one running along it is kept,
   * so a collision knocks the player back a little and still lets them slide along the
   * obstacle rather than stopping dead against it.
   *
   * A dash ends here too, for the reason it ends at a wall: leaving the raised speed
   * limit in place would let ordinary movement run above the top speed for the rest of
   * the dash window.
   * @param {{x: number, y: number}} position - The corrected position from the engine.
   * @param {{x: number, y: number}} surfaceNormal - Unit normal at the point of contact.
   * @returns {void}
   */
  applyObstacleBlock(position, surfaceNormal) {
    this.position.x = position.x;
    this.position.y = position.y;

    // How much of the velocity runs into the surface. Positive would mean the player
    // is already moving away from it, in which case there is nothing to take away.
    const intoTheSurface = this.velocity.x * surfaceNormal.x + this.velocity.y * surfaceNormal.y;

    if (intoTheSurface < 0) {
      // Removing it once cancels the movement into the obstacle; the extra share
      // reverses part of it, which is the knockback.
      const removedAndReversed = intoTheSurface * (1 + PLAYER_OBSTACLE_BOUNCE);
      this.velocity.x -= surfaceNormal.x * removedAndReversed;
      this.velocity.y -= surfaceNormal.y * removedAndReversed;
    }

    this._speedLimit = PLAYER_MAX_SPEED;
  }

  /** @returns {{x: number, y: number}} A copy of the current position. */
  getPosition() {
    return {
      x: this.position.x,
      y: this.position.y,
    };
  }
}

function moveTowardZero(value, amount) {
  if (Math.abs(value) <= amount) {
    return 0;
  }

  return value > 0 ? value - amount : value + amount;
}

function limitVelocity(velocity, maxSpeed) {
  const speed = Math.hypot(velocity.x, velocity.y);
  if (speed <= maxSpeed || speed === 0) {
    return;
  }

  const scale = maxSpeed / speed;
  velocity.x *= scale;
  velocity.y *= scale;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
