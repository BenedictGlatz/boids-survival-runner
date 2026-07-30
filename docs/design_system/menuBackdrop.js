/**
 * Boid-Schwarm hinter dem Hauptmenü.
 *
 * Reine Präsentation: keine Engine, keine Simulationsregeln, keine Kollision. Die Boids
 * driften mit Sinus-Winkelrauschen und wrappen an den Kanten — es geht um Bewegung im
 * Hintergrund, nicht um Schwarmverhalten. Damit bleibt die Projektinvariante „das Frontend
 * enthält keine Simulationsmathematik" unberührt, und das Menü braucht kein WASM.
 *
 * Zeichnet auf einen eigenen Canvas unter dem Menü-Overlay, nicht auf `#game-canvas` —
 * der gehört dem Renderer, und ein geteilter Canvas müsste beim Rundenstart aufgeräumt
 * werden.
 *
 * Verwendung:
 *   const backdrop = new MenuBackdrop();
 *   backdrop.start();   // beim Öffnen des Menüs
 *   backdrop.stop();    // beim Rundenstart
 */

const BACKGROUND_COLOR = '#0B0D12';
const GRID_COLOR = 'rgba(255, 255, 255, 0.05)';
const GRID_MAJOR_COLOR = 'rgba(255, 255, 255, 0.085)';
const GRID_SIZE = 56;
const GRID_MAJOR_SIZE = 280;

const BOID_COLORS = ['#F03A5F', '#FB7185', '#F97316'];
const BOID_OUTLINE_COLOR = 'rgba(255, 255, 255, 0.2)';
const BOID_LENGTH = 15;
const BOID_WIDTH = 11;
const BOID_TAIL_INSET = 4;

const BOID_COUNT = 72;
const BOID_ALPHA = 0.35;
const BOID_MIN_SPEED = 26;
const BOID_SPEED_RANGE = 34;
/** Stärke und Tempo des Winkelrauschens, das die Bahnen krümmen lässt. */
const DRIFT_FORCE = 9;
const DRIFT_RATE = 0.7;

/** Sicherheitsnetz gegen Sprünge nach einem Tab-Wechsel. */
const MAX_DELTA_SECONDS = 0.05;

const OBSTACLE_BODY_COLOR = '#2A313F';
const OBSTACLE_EDGE_COLOR = 'rgba(240, 90, 110, 0.55)';

export class MenuBackdrop {
  /**
   * @param {HTMLElement} [root] - Wohin der Canvas gehängt wird.
   */
  constructor(root = document.body) {
    this._canvas = document.createElement('canvas');
    this._canvas.id = 'menu-backdrop';
    this._canvas.setAttribute('aria-hidden', 'true');
    root.insertBefore(this._canvas, root.firstChild);

    this._ctx = this._canvas.getContext('2d');
    this._boids = [];
    this._obstacles = [];
    this._frame = 0;
    this._lastTime = 0;
    this._seed = 7;

    this._onResize = () => this._resize();
    this._tick = (now) => this._step(now);
  }

  /** Startet die Animation. Mehrfaches Aufrufen ist unschädlich. */
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

  /** Stoppt die Animation und blendet den Canvas aus. */
  stop() {
    if (this._frame) {
      cancelAnimationFrame(this._frame);
      this._frame = 0;
    }

    window.removeEventListener('resize', this._onResize);
    this._canvas.style.display = 'none';
  }

  // -- intern ---------------------------------------------------------------

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
   * Baut Boids und Hindernisse neu auf. Derselbe Integer-Hash wie im Rest des Projekts,
   * damit der Hintergrund bei gleicher Fenstergröße gleich aussieht und kein `rand`
   * dazukommt.
   */
  _populate() {
    this._seed = 7;
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

    this._obstacles = [
      { x: this._width * 0.18, y: this._height * 0.74, length: 0, radius: 30 },
      { x: this._width * 0.62, y: this._height * 0.2, length: this._width * 0.16, radius: 12 },
    ];
  }

  _random() {
    this._seed = (this._seed * 1103515245 + 12345) % 2147483648;
    return this._seed / 2147483648;
  }

  _step(now) {
    const seconds = now / 1000;
    const delta = this._lastTime ? Math.min(MAX_DELTA_SECONDS, seconds - this._lastTime) : 0.016;
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
    ctx.globalAlpha = 0.7;

    for (const obstacle of this._obstacles) {
      const endX = obstacle.x + obstacle.length;

      ctx.strokeStyle = OBSTACLE_BODY_COLOR;
      ctx.lineWidth = obstacle.radius * 2;
      ctx.beginPath();
      ctx.moveTo(obstacle.x, obstacle.y);
      ctx.lineTo(obstacle.length === 0 ? endX + 0.01 : endX, obstacle.y);
      ctx.stroke();

      ctx.strokeStyle = OBSTACLE_EDGE_COLOR;
      ctx.lineWidth = 1.5;
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
      boid.velocityY += Math.sin(boid.drift * 1.3) * DRIFT_FORCE * delta;
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
 * Dieselbe Dart-Silhouette wie im Spiel. Die Heading-Einheitsvektoren sind selbst die
 * Rotationsmatrix, der Pfeil wird also direkt in Weltkoordinaten gebaut — ein
 * `ctx.rotate()` pro Boid würde die Device-Pixel-Ratio-Transformation antasten.
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
