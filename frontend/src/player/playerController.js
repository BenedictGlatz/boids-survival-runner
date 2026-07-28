import {
  PLAYER_ACCELERATION,
  PLAYER_DECELERATION,
  PLAYER_MAX_DELTA_SECONDS,
  PLAYER_MAX_SPEED,
  PLAYER_VISUAL_RADIUS,
} from '../gameConfig.js';

export class PlayerController {
  constructor() {
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
  }

  reset(x, y) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };
  }

  update(direction, deltaSeconds, bounds) {
    const safeDeltaSeconds = Math.min(Math.max(deltaSeconds, 0), PLAYER_MAX_DELTA_SECONDS);

    if (direction.x !== 0 || direction.y !== 0) {
      this.velocity.x += direction.x * PLAYER_ACCELERATION * safeDeltaSeconds;
      this.velocity.y += direction.y * PLAYER_ACCELERATION * safeDeltaSeconds;
    } else {
      this.velocity.x = moveTowardZero(
        this.velocity.x,
        PLAYER_DECELERATION * safeDeltaSeconds,
      );
      this.velocity.y = moveTowardZero(
        this.velocity.y,
        PLAYER_DECELERATION * safeDeltaSeconds,
      );
    }

    limitVelocity(this.velocity, PLAYER_MAX_SPEED);

    this.position.x += this.velocity.x * safeDeltaSeconds;
    this.position.y += this.velocity.y * safeDeltaSeconds;
    this.clampToBounds(bounds);

    return this.getPosition();
  }

  clampToBounds(bounds) {
    const minX = PLAYER_VISUAL_RADIUS;
    const minY = PLAYER_VISUAL_RADIUS;
    const maxX = Math.max(minX, bounds.width - PLAYER_VISUAL_RADIUS);
    const maxY = Math.max(minY, bounds.height - PLAYER_VISUAL_RADIUS);

    const nextX = clamp(this.position.x, minX, maxX);
    const nextY = clamp(this.position.y, minY, maxY);

    if (nextX !== this.position.x) {
      this.velocity.x = 0;
      this.position.x = nextX;
    }

    if (nextY !== this.position.y) {
      this.velocity.y = 0;
      this.position.y = nextY;
    }
  }

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