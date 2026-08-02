/**
 * Draws the two power-ups — the hexagon vocabulary of `design-system.md` §11.
 *
 * Three things live here: the marker lying in the arena, the shell and time arcs that sit on
 * the player while a buff runs, and the shatter the shield leaves behind when it eats a hit.
 *
 * Purely presentational, like `trailLayer.js`: spawning, collision and the actual effects are
 * gameplay and belong to the engine. Nothing in this file decides anything — it is handed a
 * list of markers and a buff state and draws them.
 */

/** Marker radius. Smaller than an obstacle, larger than a boid — reads as an item. */
export const PICKUP_RADIUS = 18;

/**
 * Pick-up distance, deliberately larger than the marker looks. A player brushing past at dash
 * speed covers 18 px in a single simulation step, so a hitbox the size of the drawing would
 * make grazes feel stolen.
 */
export const PICKUP_COLLECT_RADIUS = 26;

export const AEGIS_COLOR = '#FBBF24';
export const OVERDRIVE_COLOR = '#38BDF8';

/** Shell radius, clear of the player's own 16 px body and its glow. */
const SHELL_RADIUS = 30;

/** Aegis inside, Overdrive outside, so both buffs can run at once and stay apart. */
const AEGIS_ARC_RADIUS = 36;
const OVERDRIVE_ARC_RADIUS = 42;

const BOB_AMPLITUDE = 3;
const BOB_SECONDS = 2.2;
const SPIN_TURNS_PER_SECOND = 0.25;
const BREATHE_SECONDS = 1.6;

/** Below this fraction the time arc blinks — the only warning a buff is about to end. */
const ARC_BLINK_BELOW = 0.17;
const ARC_BLINK_HZ = 4;

const SHATTER_SECONDS = 0.35;
const SHARD_COUNT = 6;

/**
 * Colour of a power-up kind.
 * @param {'aegis'|'overdrive'} kind - Which power-up.
 * @returns {string} Hex colour.
 */
export function powerupColor(kind) {
  return kind === 'aegis' ? AEGIS_COLOR : OVERDRIVE_COLOR;
}

/**
 * Traces a hexagon. Never fills or strokes itself — the caller decides, usually doing both.
 * @param {CanvasRenderingContext2D} ctx - Canvas context.
 * @param {number} x - Centre.
 * @param {number} y - Centre.
 * @param {number} radius - Centre to vertex.
 * @param {number} rotation - Radians.
 * @returns {void}
 */
export function hexPath(ctx, x, y, radius, rotation) {
  ctx.beginPath();

  for (let corner = 0; corner < 6; corner += 1) {
    const angle = rotation + (corner / 6) * Math.PI * 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;

    if (corner === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }

  ctx.closePath();
}

/**
 * One marker lying in the arena.
 *
 * The shell turns and the marker bobs, both off wall-clock time — this is the only rotating
 * thing in the arena, which is what makes a pickup findable in a field of 90 boids without
 * being brighter than anything else.
 *
 * The glyph inside does **not** turn with the shell: a rotating icon reads as debris.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {'aegis'|'overdrive'} kind - Which power-up.
 * @param {number} x - World position.
 * @param {number} y - World position.
 * @param {number} seconds - Wall-clock seconds, for spin and bob.
 * @param {number} [scale] - `0`..`1` spawn-in scale.
 * @returns {void}
 */
export function drawPowerupMarker(ctx, kind, x, y, seconds, scale = 1) {
  if (scale <= 0) return;

  const color = powerupColor(kind);
  const radius = PICKUP_RADIUS * scale;
  const bobY = y + Math.sin((seconds * Math.PI * 2) / BOB_SECONDS) * BOB_AMPLITUDE;
  const rotation = seconds * SPIN_TURNS_PER_SECOND * Math.PI * 2;
  const breathe = 0.5 + 0.5 * Math.sin((seconds * Math.PI * 2) / BREATHE_SECONDS);

  ctx.save();

  // Opaque core first, or the grid runs straight through the glyph and it stops reading.
  ctx.fillStyle = 'rgba(11, 13, 18, 0.85)';
  hexPath(ctx, x, bobY, radius, rotation);
  ctx.fill();

  ctx.shadowColor = color;
  ctx.shadowBlur = 12 + breathe * 10;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  hexPath(ctx, x, bobY, radius, rotation);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (kind === 'aegis') {
    // A shell around a core — the same thing the buff does, at glyph size.
    hexPath(ctx, x, bobY, radius * 0.46, 0);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, bobY, radius * 0.13, 0, Math.PI * 2);
    ctx.fill();
  } else {
    drawChevrons(ctx, x, bobY, radius * 0.3);
  }

  ctx.restore();
}

function drawChevrons(ctx, x, y, size) {
  for (const offset of [-size * 0.75, size * 0.55]) {
    ctx.beginPath();
    ctx.moveTo(x + offset - size * 0.4, y - size);
    ctx.lineTo(x + offset + size * 0.45, y);
    ctx.lineTo(x + offset - size * 0.4, y + size);
    ctx.stroke();
  }
}

/**
 * The Aegis shell on the player: the marker's own hexagon, now around you. The pickup
 * animating onto the player is the entire explanation the effect needs — no icon, no text.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {number} x - Player position.
 * @param {number} y - Player position.
 * @param {number} seconds - Wall-clock seconds, for spin and breathing.
 * @param {number} remaining - Fraction of the buff left, `1`..`0`.
 * @returns {void}
 */
export function drawAegisShell(ctx, x, y, seconds, remaining) {
  ctx.save();
  ctx.strokeStyle = AEGIS_COLOR;
  ctx.lineWidth = 2;
  ctx.shadowColor = AEGIS_COLOR;
  ctx.shadowBlur = 9;
  ctx.globalAlpha = 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(seconds * 3));
  hexPath(ctx, x, y, SHELL_RADIUS, seconds * 0.5 * Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  drawTimeArc(ctx, x, y, AEGIS_ARC_RADIUS, remaining, AEGIS_COLOR);
}

/**
 * The Overdrive ring. There is no shell and no new effect: Overdrive shows itself through the
 * Ion Streak trail (`trailLayer.js`) running continuously instead of only during a dash.
 * Speed already has a language in this game — Overdrive just switches it on.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {number} x - Player position.
 * @param {number} y - Player position.
 * @param {number} remaining - Fraction of the buff left, `1`..`0`.
 * @returns {void}
 */
export function drawOverdriveRing(ctx, x, y, remaining) {
  drawTimeArc(ctx, x, y, OVERDRIVE_ARC_RADIUS, remaining, OVERDRIVE_COLOR);
}

/**
 * The remaining-time motif both buffs share: a 2 px arc draining clockwise from twelve.
 *
 * It sits on the player and not in the HUD on purpose — in wave 5 nobody looks at the edge of
 * the screen. The HUD gets the buffs too, but as the second place to look.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {number} x - Centre.
 * @param {number} y - Centre.
 * @param {number} radius - Arc radius.
 * @param {number} remaining - Fraction left, `1`..`0`.
 * @param {string} color - Buff colour.
 * @returns {void}
 */
export function drawTimeArc(ctx, x, y, radius, remaining, color) {
  if (remaining <= 0) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'butt';

  // Blinks off the wall clock, not off `remaining`, so the rate is a steady 4 Hz whatever a
  // buff's total duration happens to be.
  const blinkPhase = Math.sin((performance.now() / 1000) * ARC_BLINK_HZ * Math.PI * 2);
  ctx.globalAlpha = remaining < ARC_BLINK_BELOW && blinkPhase < 0 ? 0.14 : 0.9;

  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.min(1, remaining) * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * The shield giving its life for you: a white flash, then the hexagon breaking into six shards
 * that drift outward. It has to look expensive, or nobody notices the shield is spent and the
 * next hit comes as a surprise.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {number} x - Where the hit landed.
 * @param {number} y - Where the hit landed.
 * @param {number} age - Seconds since the absorb; past `SHATTER_SECONDS` nothing is drawn.
 * @returns {void}
 */
export function drawAegisShatter(ctx, x, y, age) {
  if (age < 0 || age > SHATTER_SECONDS) return;

  const progress = age / SHATTER_SECONDS;

  ctx.save();
  ctx.globalAlpha = 1 - progress;
  ctx.strokeStyle = AEGIS_COLOR;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  for (let shard = 0; shard < SHARD_COUNT; shard += 1) {
    const angle = (shard / SHARD_COUNT) * Math.PI * 2 + 0.5;
    const distance = SHELL_RADIUS + progress * 30;
    const cx = x + Math.cos(angle) * distance;
    const cy = y + Math.sin(angle) * distance;
    const halfX = -Math.sin(angle) * 9 * (1 - progress);
    const halfY = Math.cos(angle) * 9 * (1 - progress);

    ctx.beginPath();
    ctx.moveTo(cx - halfX, cy - halfY);
    ctx.lineTo(cx + halfX, cy + halfY);
    ctx.stroke();
  }

  ctx.globalAlpha = (1 - progress) * 0.9;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  hexPath(ctx, x, y, SHELL_RADIUS + progress * 26, 0.5);
  ctx.stroke();
  ctx.restore();
}

/**
 * The collection pop: the dash launch ring again, in the power-up's colour. Reusing it keeps
 * "something just happened at this spot" a single visual idea instead of two.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in world space.
 * @param {number} x - Where it was collected.
 * @param {number} y - Where it was collected.
 * @param {number} age - Seconds since collection.
 * @param {'aegis'|'overdrive'} kind - Which power-up.
 * @returns {void}
 */
export function drawCollectRing(ctx, x, y, age, kind) {
  if (age < 0 || age > 0.3) return;

  const progress = age / 0.3;

  ctx.save();
  ctx.globalAlpha = (1 - progress) * 0.75;
  ctx.strokeStyle = powerupColor(kind);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 10 + progress * 80, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * One HUD row: the kind's hexagon plus a draining bar. Stacked upward above the dash bar.
 * @param {CanvasRenderingContext2D} ctx - Canvas context, in **screen** space.
 * @param {number} x - Left edge of the row.
 * @param {number} y - Top edge of the row.
 * @param {'aegis'|'overdrive'} kind - Which power-up.
 * @param {number} remaining - Fraction left, `1`..`0`.
 * @returns {void}
 */
export function drawHudBuff(ctx, x, y, kind, remaining) {
  const color = powerupColor(kind);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  hexPath(ctx, x + 8, y + 7, 7, 0);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.fillRect(x + 21, y + 5, 62, 4);
  ctx.fillStyle = color;
  ctx.fillRect(x + 21, y + 5, 62 * Math.min(1, Math.max(0, remaining)), 4);
  ctx.restore();
}
