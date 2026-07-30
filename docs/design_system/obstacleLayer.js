/**
 * Hindernis-Rendering — Optik „Hazard Tape" (SIGNAL-Designsystem).
 *
 * Drop-in-Ersatz für das bisherige `obstacleLayer.js`: gleiche Signatur, gleicher
 * Buffer-Vertrag (`OBSTACLE_STRIDE`, `life_fraction`, `hit_flash`), gleicher einziger
 * Renderpfad — eine Kapsel ist ein round-capped Stroke, ein Kreis ist die Spine der
 * Länge 0. Keine Engine-Änderung.
 *
 * Neu gegenüber der Vorversion:
 *  - Schraffierter Körper und rote Gefahrenkante statt eines neutralen Slate-Rands.
 *  - Ein Halo-Ring beim Erscheinen und eine amberfarbene Kante beim Ablaufen, beides
 *    allein aus `life_fraction` abgeleitet — kein zusätzlicher Buffer.
 *  - Weiße Treffer-Kante, weil ein roter Flash auf einer roten Kante unsichtbar wäre.
 *
 * Die Farbstring-Tabellen bleiben wie im Original: die Opacity eines Hindernisses ändert
 * sich pro Frame, also darf pro Frame kein `rgba(...)` gebaut werden. Jede Farbe, die ein
 * Hindernis je haben kann, existiert vor dem ersten Frame.
 */

import { OBSTACLE_FADE_SHARE, OBSTACLE_STRIDE } from '../gameConfig.js';
import { obstacleFadeLevel } from './obstacleFade.js';

/** Slate — der Hindernis-Körper liest als Welt, nicht als Entität. */
const BODY_COLOR = '#2A313F';

/** Breite der scharfen Außenkante. Sie trägt das Gefahrensignal. */
const EDGE_WIDTH = 1.5;

/**
 * Ab welchem Radius die Mitte abgedunkelt wird, und wie weit die Schraffur als Rand-Band
 * stehen bleibt. Unter dieser Schwelle ist ein Hindernis so dünn, dass ein Kern es
 * auffressen würde.
 */
const CORE_MIN_RADIUS = 8;
const CORE_BAND_WIDTH = 7;

/** Deckkraft des abgedunkelten Kerns, als Stufe der Alpha-Tabelle. */
const CORE_ALPHA = 0.42;

/** Wie weit der Spawn-Ring über die Oberfläche hinausläuft, in Pixeln. */
const SPAWN_RING_REACH = 34;
const SPAWN_RING_ALPHA = 0.09;
const SPAWN_RING_EDGE_ALPHA = 0.5;

/** Farbvorlagen — ALPHA wird von `buildAlphaTable` ersetzt. */
const T_CORE = 'rgba(14, 17, 24, ALPHA)';
const T_EDGE_DANGER = 'rgba(240, 90, 110, ALPHA)';
const T_EDGE_WARNING = 'rgba(251, 191, 36, ALPHA)';
const T_HALO = 'rgba(240, 58, 95, ALPHA)';
const T_HIT_FILL = 'rgba(220, 38, 38, ALPHA)';
const T_HIT_EDGE = 'rgba(255, 255, 255, ALPHA)';

const FADE_STEPS = 12;
const CORE = buildAlphaTable(T_CORE, FADE_STEPS);
const EDGE_DANGER = buildAlphaTable(T_EDGE_DANGER, FADE_STEPS);
const EDGE_WARNING = buildAlphaTable(T_EDGE_WARNING, FADE_STEPS);
const HALO = buildAlphaTable(T_HALO, FADE_STEPS);
const HIT_FILL = buildAlphaTable(T_HIT_FILL, FADE_STEPS);
const HIT_EDGE = buildAlphaTable(T_HIT_EDGE, FADE_STEPS);

/**
 * Warnschraffur als Canvas-Pattern. Einmal gebaut und danach wiederverwendet — ein
 * `createPattern` pro Frame wäre eine Allokation auf dem heißen Pfad.
 *
 * Das Tile ist 10×10 mit zwei diagonalen Strichen, damit das Muster über die Kachelgrenze
 * hinweg durchläuft; ein einzelner Strich pro Tile reißt an der Naht auf.
 */
let hatchPattern = null;

function hatch(ctx) {
  if (hatchPattern) {
    return hatchPattern;
  }

  const tile = document.createElement('canvas');
  tile.width = 10;
  tile.height = 10;

  const tileCtx = tile.getContext('2d');
  tileCtx.fillStyle = BODY_COLOR;
  tileCtx.fillRect(0, 0, 10, 10);
  tileCtx.strokeStyle = 'rgba(240, 58, 95, 0.30)';
  tileCtx.lineWidth = 3.5;
  tileCtx.beginPath();
  tileCtx.moveTo(-2, 12);
  tileCtx.lineTo(12, -2);
  tileCtx.moveTo(3, 17);
  tileCtx.lineTo(17, 3);
  tileCtx.stroke();

  hatchPattern = ctx.createPattern(tile, 'repeat');
  return hatchPattern;
}

/**
 * Zeichnet alle Hindernisse des Frames.
 * @param {CanvasRenderingContext2D} ctx - Der Ziel-Kontext.
 * @param {object} frame - Engine-Frame, wie von `engine-bridge.js` normalisiert.
 * @returns {void}
 */
export function drawObstacles(ctx, frame) {
  const obstacles = frame.obstacles;
  if (!obstacles || !frame.obstacleCount) {
    return;
  }

  ctx.save();
  ctx.lineCap = 'round';

  for (let index = 0; index < frame.obstacleCount; index += 1) {
    const offset = index * OBSTACLE_STRIDE;
    const startX = obstacles[offset];
    const startY = obstacles[offset + 1];
    const endX = obstacles[offset + 2];
    const endY = obstacles[offset + 3];
    const radius = obstacles[offset + 4];
    const lifeFraction = obstacles[offset + 5];
    const hitFlash = obstacles[offset + 6];

    const fade = obstacleFadeLevel(lifeFraction, OBSTACLE_FADE_SHARE);
    if (fade <= 0) {
      continue;
    }

    // `life_fraction` ist die Restlebensdauer in (0, 1]: nahe 1 heißt gerade erschienen,
    // nahe 0 heißt läuft ab. Beide Phasen sind genau die Fade-Fenster, also braucht die
    // Phasenerkennung keinen weiteren Wert und keine eigene Zustandshaltung.
    const isSpawning = lifeFraction > 1 - OBSTACLE_FADE_SHARE;
    const isExpiring = lifeFraction < OBSTACLE_FADE_SHARE;
    const shade = shadeFor(fade);

    if (isSpawning) {
      drawSpawnRing(ctx, startX, startY, endX, endY, radius, fade);
    }

    drawBody(ctx, startX, startY, endX, endY, radius, fade);

    ctx.strokeStyle = isExpiring ? EDGE_WARNING[shade] : EDGE_DANGER[shade];
    ctx.lineWidth = EDGE_WIDTH;
    strokeSpine(ctx, startX, startY, endX, endY);

    if (hitFlash > 0) {
      // Die eigene Deckkraft ist eingerechnet, damit ein verschwindendes Hindernis nicht
      // mit voller Stärke aufblitzen kann.
      drawHitFlash(ctx, startX, startY, endX, endY, radius, hitFlash * fade);
    }
  }

  ctx.restore();
}

/**
 * Körper: Schraffur über die volle Breite, darüber ein abgedunkelter Kern, sodass die
 * Schraffur nur als Band am Rand wirkt und die Boids über der Mitte lesbar bleiben.
 *
 * Das Pattern kennt keine Deckkraft, also übernimmt `globalAlpha` das Ein- und Ausblenden
 * für diesen einen Stroke. Der Kern kommt danach wieder aus der Alpha-Tabelle.
 */
function drawBody(ctx, startX, startY, endX, endY, radius, fade) {
  ctx.globalAlpha = fade;
  ctx.strokeStyle = hatch(ctx);
  ctx.lineWidth = radius * 2;
  strokeSpine(ctx, startX, startY, endX, endY);
  ctx.globalAlpha = 1;

  if (radius <= CORE_MIN_RADIUS) {
    return;
  }

  ctx.strokeStyle = CORE[shadeFor(fade * CORE_ALPHA)];
  ctx.lineWidth = radius * 2 - CORE_BAND_WIDTH;
  strokeSpine(ctx, startX, startY, endX, endY);
}

/**
 * Ring, der beim Erscheinen nach außen läuft: das Hindernis landet, statt einzublenden.
 * Ein Stroke der Breite `(radius + reach) * 2` bei sehr niedriger Deckkraft — dieselbe
 * Kapsel-Geometrie, nur dicker, also kein zweiter Pfadtyp.
 */
function drawSpawnRing(ctx, startX, startY, endX, endY, radius, fade) {
  const grow = 1 - fade; // fade läuft 0 → 1, der Ring also von außen nach innen

  ctx.strokeStyle = HALO[shadeFor(fade * SPAWN_RING_ALPHA)];
  ctx.lineWidth = (radius + 6 + grow * SPAWN_RING_REACH) * 2;
  strokeSpine(ctx, startX, startY, endX, endY);

  ctx.strokeStyle = EDGE_DANGER[shadeFor(fade * SPAWN_RING_EDGE_ALPHA)];
  ctx.lineWidth = EDGE_WIDTH;
  strokeSpine(ctx, startX, startY, endX, endY);
}

/**
 * Treffer-Flash: die Fläche rot wie gebaut, die Kante aber **weiß** — die Normalkante ist
 * hier schon rot, ein roter Rand wäre darauf unsichtbar.
 */
function drawHitFlash(ctx, startX, startY, endX, endY, radius, level) {
  const shade = shadeFor(level);

  ctx.strokeStyle = HIT_FILL[shade];
  ctx.lineWidth = radius * 2;
  strokeSpine(ctx, startX, startY, endX, endY);

  ctx.strokeStyle = HIT_EDGE[shade];
  ctx.lineWidth = 2;
  strokeSpine(ctx, startX, startY, endX, endY);
}

/**
 * Strokes an obstacle's centre line. A zero-length line still paints, because the round
 * cap gives it a circle, but only if both endpoints are handed over — some canvas
 * implementations skip a `lineTo` back to the same point, so the tiny offset below keeps
 * the circle case reliable.
 */
function strokeSpine(ctx, startX, startY, endX, endY) {
  ctx.beginPath();
  ctx.moveTo(startX, startY);

  if (startX === endX && startY === endY) {
    ctx.lineTo(endX + 0.01, endY);
  } else {
    ctx.lineTo(endX, endY);
  }

  ctx.stroke();
}

/** Which precomputed opacity step a level between 0 and 1 rounds to. */
function shadeFor(level) {
  return Math.min(FADE_STEPS - 1, Math.max(0, Math.round(level * (FADE_STEPS - 1))));
}

/** Precomputes one colour string per opacity step from a template. */
function buildAlphaTable(template, steps) {
  const table = [];

  for (let step = 0; step < steps; step += 1) {
    const alpha = (step + 1) / steps;
    table.push(template.replace('ALPHA', alpha.toFixed(3)));
  }

  return table;
}
