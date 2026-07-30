/**
 * The colours of the two things that move in the arena — the player and the boids — and the
 * precomputed brightness ramp a boid wears while it charges a dash.
 *
 * Split out of `canvasRenderer.js` when the dash trail arrived and needed the same colours:
 * a trail is drawn in the colour of whoever it belongs to, so its owner's colour can no
 * longer be a private constant of the module that draws the owner. The colours of the HUD-ish
 * things drawn on the canvas — the health bar, the countdown — deliberately stayed behind,
 * because nothing outside the renderer asks for those.
 */

import { dashGlowLevel } from './dashPulse.js';
import { PLAYER_TRAIL_TIER } from './dashTrail.js';

export const PLAYER_COLOR = '#38bdf8';

/**
 * Amber while invulnerable — the colour of a temporary state change, the same one an
 * expiring obstacle wears. A player learns the meaning in one place and can read it
 * everywhere.
 */
export const PLAYER_HIT_COLOR = '#fbbf24';
export const PLAYER_OUTLINE_COLOR = 'rgba(255, 255, 255, 0.72)';

/**
 * One colour per difficulty tier. Five tiers need five colours that stay apart at arrow
 * size, so they cannot all live in the red family — the tier a boid belongs to has to be
 * readable in a moving crowd of ninety.
 *
 * What did change is the fourth tier: it used to be amber, and amber now means "this is
 * temporary" on its own (invulnerability, an expiring obstacle). A permanently amber boid
 * would say the wrong thing, so that tier moved to fuchsia, which carries no other
 * meaning in the system. Going brighter instead was not an option either: the dash
 * warning already ramps a boid towards white.
 */
export const BOID_COLORS = ['#f03a5f', '#fb7185', '#f97316', '#d946ef', '#a855f7'];

/**
 * How many brightness steps a boid colour is precomputed in, from the plain
 * colour up to nearly white.
 *
 * Blending a colour per boid per frame would build a new string on every one of
 * them, which the coding standards rule out on the hot path. Quantising the glow
 * to a fixed number of steps means every colour a boid can ever have is already
 * in memory before the first frame is drawn.
 */
const GLOW_STEPS = 6;

/**
 * Picks the precomputed colour for a boid's tier and current glow.
 * @param {number} tier - The boid's difficulty tier, already clamped to a known colour.
 * @param {number} dashPhase - The engine's `dash_phases[i]`; `0` means nothing to draw.
 * @returns {string} A canvas colour string, never built on the fly.
 */
export function glowColorForBoid(tier, dashPhase) {
  if (dashPhase === 0) {
    return BOID_COLORS[tier];
  }

  const level = dashGlowLevel(dashPhase);
  const step = Math.min(Math.round(level * (GLOW_STEPS - 1)), GLOW_STEPS - 1);

  return BOID_GLOW_COLORS[tier][step];
}

/**
 * Owner colour of a dash trail: the player's cyan, or the boid's tier colour.
 *
 * A function on module level rather than a closure built per frame — `drawDashTrails` calls it
 * for every trail on every frame, and building the closure there would be an allocation on the
 * hot path for no gain.
 * @param {number} tier - A difficulty tier, or `PLAYER_TRAIL_TIER` for the player.
 * @returns {string} A canvas colour string.
 */
export function trailColorForTier(tier) {
  if (tier === PLAYER_TRAIL_TIER) return PLAYER_COLOR;

  return BOID_COLORS[Math.min(tier, BOID_COLORS.length - 1)];
}

/**
 * Precomputes, for every boid colour, a short ramp from the plain colour toward
 * white. Index `0` is the colour itself, the last index is the brightest.
 */
function buildGlowColorTable(colors, steps) {
  const table = [];

  for (const color of colors) {
    const shades = [];

    for (let step = 0; step < steps; step += 1) {
      shades.push(brighten(color, step / (steps - 1)));
    }

    table.push(shades);
  }

  return table;
}

/** Mixes a `#rrggbb` colour toward white, with `amount` between 0 and 1. */
function brighten(color, amount) {
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);

  return `rgb(${mixToWhite(red, amount)}, ${mixToWhite(green, amount)}, ${mixToWhite(blue, amount)})`;
}

function mixToWhite(channel, amount) {
  return Math.round(channel + (255 - channel) * amount);
}

const BOID_GLOW_COLORS = buildGlowColorTable(BOID_COLORS, GLOW_STEPS);
