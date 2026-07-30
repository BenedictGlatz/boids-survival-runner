/**
 * The boid swarm behind the main menu.
 *
 * Presentation only: no engine, no steering rules, no collision. The boids drift with a
 * sine angular noise and wrap at the edges — this is about movement behind the text, not
 * about flocking behaviour. That keeps the project invariant "the frontend contains no
 * simulation maths" intact, and it means the menu needs no WASM module to look alive.
 *
 * Draws onto its own canvas below the menu overlay rather than onto `#game-canvas`: that
 * one belongs to the renderer, and a shared canvas would have to be cleaned up at the
 * start of a round.
 *
 * Usage:
 *   const backdrop = new MenuBackdrop();
 *   backdrop.start();   // when the menu opens
 *   backdrop.stop();    // when a round starts
 */

const BACKGROUND_COLOR = '#0b0d12';
const GRID_COLOR = 'rgba(255, 255, 255, 0.05)';
const GRID_MAJOR_COLOR = 'rgba(255, 255, 255, 0.085)';
const GRID_SIZE = 56;
const GRID_MAJOR_SIZE = 280;

const BOID_COLORS = ['#f03a5f', '#fb7185', '#f97316'];
const BOID_OUTLINE_COLOR = 'rgba(255, 255, 255, 0.2)';
const BOID_LENGTH = 15;
const BOID_WIDTH = 11;
const BOID_TAIL_INSET = 4;

const BOID_COUNT = 72;
const BOID_ALPHA = 0.35;
const BOID_MIN_SPEED = 26;
const BOID_SPEED_RANGE = 34;
/** Strength and pace of the angular noise that bends the paths. */
const DRIFT_FORCE = 9;
const DRIFT_RATE = 0.7;
const DRIFT_LATERAL_RATE = 1.3;

/** Safety net against a jump after a tab switch, and the delta of the very first frame. */
const MAX_DELTA_SECONDS = 0.05;
const FIRST_FRAME_SECONDS = 0.016;

const OBSTACLE_BODY_COLOR = '#2a313f';
const OBSTACLE_EDGE_COLOR = 'rgba(240, 90, 110, 0.55)';
const OBSTACLE_EDGE_WIDTH = 1.5;
const OBSTACLE_ALPHA = 0.7;

/**
 * The two decorative obstacles, as fractions of the viewport: one circle low on the text
 * side, one bar high on the right. Fractions rather than pixels, so they land in the same
 * place on any window size.
 */
const OBSTACLE_LAYOUT = [
  { x: 0.18, y: 0.74, length: 0, radius: 30 },
  { x: 0.62, y: 0.2, length: 0.16, radius: 12 },
];

/** Seed of the integer hash below. Any fixed value will do; this one just has to be fixed. */
const RANDOM_SEED = 7;

/** The swarm drawn behind the menu. Pure presentation — it never touches the engine. */
export class MenuBackdrop {
  /**
   * @param {HTMLElement} [root] - Element the canvas is inserted into.
   */
  constructor(root = document.body) {
    this._canvas = document.createElement('canvas');
    this._canvas.id = 'menu-backdrop';
    this._canvas.setAttribute('aria-hidden', 'true');
    root.insertBefore(this._canvas, root.firstChild);

    this._ctx = this._canvas.getContext('2d');
    this._boids = [];
    this._obstacles = [];
    this._width = 0;
    this._height = 0;
    this._frame = 0;
    this._lastTime = 0;
    this._seed = RANDOM_SEED;

    this._onResize = () => this._resize();
    this._tick = (now) => this._step(now);
  }

  /**
   * Starts the animation. Calling it again while it runs does nothing.
   * @returns {void}
   */
  start() {
    if (this._frame) {
      return;
    }

    this._resize();
    window.addEventListener('resize', this._onResize);
    this._canvas.style.display = 'block';
    this._lastTime = 0;
    this._frame = requestAnimationFrame(this._tick);
  }

  /**
   * Stops the animation and hides the canvas.
   * @returns {void}
   */
  stop() {
    if (this._frame) {
      cancelAnimationFrame(this._frame);
      this._frame = 0;
    }

    window.removeEventListener('resize', this._onResize);
    this._canvas.style.display = 'none';
  }

  // -- internal -------------------------------------------------------------

  _resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;

    this._width = width;
    this._height = height;
    this._canvas.width = Math.floor(width * pixelRatio);
    this._canvas.height = Math.floor(height * pixelRatio);
    this._canvas.style.width = `${width}px`;
    this._canvas.style.height = `${height}px`;
    this._ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    this._populate();
  }

  /**
   * Rebuilds boids and obstacles. The same integer hash the rest of the project uses, so
   * the backdrop looks the same for the same window size and no `rand` dependency joins
   * the project through the back door.
   */
  _populate() {
    this._seed = RANDOM_SEED;
    this._boids = [];

    for (let index = 0; index < BOID_COUNT; index += 1) {
      const angle = this._random() * Math.PI * 2;
      const speed = BOID_MIN_SPEED + this._random() * BOID_SPEED_RANGE;

      this._boids.push({
        x: this._random() * this._width,
        y: this._random() * this._height,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        color: BOID_COLORS[Math.floor(this._random() * BOID_COLORS.length)],
        drift: this._random() * Math.PI * 2,
      });
    }

    this._obstacles = OBSTACLE_LAYOUT.map((obstacle) => ({
      x: this._width * obstacle.x,
      y: this._height * obstacle.y,
      length: this._width * obstacle.length,
      radius: obstacle.radius,
    }));
  }

  _random() {
    this._seed = (this._seed * 1103515245 + 12345) % 2147483648;

    return this._seed / 2147483648;
  }

  _step(now) {
    const seconds = now / 1000;
    const delta = this._lastTime
      ? Math.min(MAX_DELTA_SECONDS, seconds - this._lastTime)
      : FIRST_FRAME_SECONDS;
    this._lastTime = seconds;

    this._drawGrid();
    this._drawObstacles();
    this._drawBoids(delta);

    this._frame = requestAnimationFrame(this._tick);
  }

  _drawGrid() {
    const ctx = this._ctx;
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, this._width, this._height);

    strokeLattice(ctx, this._width, this._height, GRID_SIZE, GRID_COLOR);
    strokeLattice(ctx, this._width, this._height, GRID_MAJOR_SIZE, GRID_MAJOR_COLOR);
  }

  _drawObstacles() {
    const ctx = this._ctx;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.globalAlpha = OBSTACLE_ALPHA;

    for (const obstacle of this._obstacles) {
      const endX = obstacle.x + obstacle.length;

      ctx.strokeStyle = OBSTACLE_BODY_COLOR;
      ctx.lineWidth = obstacle.radius * 2;
      ctx.beginPath();
      ctx.moveTo(obstacle.x, obstacle.y);
      // The same zero-length trick the obstacle layer uses, for the same reason.
      ctx.lineTo(obstacle.length === 0 ? endX + 0.01 : endX, obstacle.y);
      ctx.stroke();

      ctx.strokeStyle = OBSTACLE_EDGE_COLOR;
      ctx.lineWidth = OBSTACLE_EDGE_WIDTH;
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawBoids(delta) {
    const ctx = this._ctx;
    ctx.save();
    ctx.globalAlpha = BOID_ALPHA;
    ctx.strokeStyle = BOID_OUTLINE_COLOR;
    ctx.lineWidth = 1.2;

    for (const boid of this._boids) {
      boid.drift += delta * DRIFT_RATE;
      boid.velocityX += Math.cos(boid.drift) * DRIFT_FORCE * delta;
      boid.velocityY += Math.sin(boid.drift * DRIFT_LATERAL_RATE) * DRIFT_FORCE * delta;
      boid.x = (boid.x + boid.velocityX * delta + this._width) % this._width;
      boid.y = (boid.y + boid.velocityY * delta + this._height) % this._height;

      const speed = Math.hypot(boid.velocityX, boid.velocityY) || 1;
      drawArrow(ctx, boid.x, boid.y, boid.velocityX / speed, boid.velocityY / speed, boid.color);
    }

    ctx.restore();
  }
}

function strokeLattice(ctx, width, height, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = 0; x <= width; x += size) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
  }

  for (let y = 0; y <= height; y += size) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
  }

  ctx.stroke();
}

/**
 * The same dart silhouette the game draws. The heading unit vectors are the rotation
 * matrix themselves, so the arrow is built directly in world coordinates — a `ctx.rotate()`
 * per boid would touch the device-pixel-ratio transform.
 */
function drawArrow(ctx, x, y, headingX, headingY, color) {
  const corners = [
    [BOID_LENGTH * 0.5, 0],
    [-BOID_LENGTH * 0.5, BOID_WIDTH * 0.5],
    [-BOID_LENGTH * 0.5 + BOID_TAIL_INSET, 0],
    [-BOID_LENGTH * 0.5, -BOID_WIDTH * 0.5],
  ];

  ctx.fillStyle = color;
  ctx.beginPath();

  for (let index = 0; index < corners.length; index += 1) {
    const [forward, lateral] = corners[index];
    const pointX = x + forward * headingX - lateral * headingY;
    const pointY = y + forward * headingY + lateral * headingX;

    if (index === 0) {
      ctx.moveTo(pointX, pointY);
    } else {
      ctx.lineTo(pointX, pointY);
    }
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
