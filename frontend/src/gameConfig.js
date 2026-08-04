/**
 * Shown in the menu header. Kept in sync with `package.json` by hand — the same kind of
 * duplication `INITIAL_BOID_COUNT` carries, and for the same reason: reading it from the
 * package at build time would need a `vite.config.js`, which the project does not have yet.
 */
export const APP_VERSION = '0.1.0';

// ---------------------------------------------------------------------------
// The game world
// ---------------------------------------------------------------------------

/**
 * The logical game world, in world units. Fixed on purpose: it used to be
 * `window.innerWidth × window.innerHeight`, which let the monitor decide how much arena a
 * player got. A 4K screen saw more than four times the world a laptop did, and because the
 * engine derives its safe spawn distance from the shorter world edge while the obstacle
 * count is fixed, no balance value meant the same thing on two machines and no two scores
 * were comparable.
 *
 * One world unit is still one pixel at a render scale of 1, so every length in this file
 * and in `engine/src/constants.rs` keeps the meaning it was tuned with. 16:9 because that
 * is what the overwhelming majority of displays are, so the letterbox margins the renderer
 * falls back to are usually zero pixels wide.
 *
 * Deliberately *not* mirrored into `engine/src/constants.rs`: the engine receives its world
 * size through `GameEngine::new()`, so this is a caller-supplied bound rather than a tuning
 * default, and a second copy would be a second hand-sync obligation like the one
 * `INITIAL_BOID_COUNT` already carries.
 */
export const WORLD_WIDTH = 1920;
export const WORLD_HEIGHT = 1080;

/**
 * The same two numbers as the bounds object `playerController.update()` expects. Built once
 * and frozen because that call happens on every simulation step, and building a fresh
 * object sixty times a second is the kind of hot-path allocation the coding standards rule
 * out.
 */
export const WORLD_BOUNDS = Object.freeze({ width: WORLD_WIDTH, height: WORLD_HEIGHT });

export const INITIAL_BOID_COUNT = 24;
export const PLAYER_STARTING_LIVES = 3;
export const HIT_COOLDOWN_MS = 900;
export const WAVE_DURATION_SECONDS = 30;

/**
 * The highest boid variant the difficulty ramp ever reaches. Duplicated from
 * `MAX_BOID_DIFFICULTY_TIER` in `engine/src/constants.rs` — keep the two in sync, the same
 * hand-sync obligation `INITIAL_BOID_COUNT` already carries.
 *
 * The frontend needs it because it owns the wave counter and therefore the only place that
 * can say which variant is arriving right now. It is also the highest index
 * `BOID_COLORS` in `renderer/entityPalette.js` may be asked for, which is what
 * `round/waveTier.test.js` asserts.
 */
export const MAX_BOID_DIFFICULTY_TIER = 4;

export const START_COUNTDOWN_SECONDS = 3;
export const PLAYER_VISUAL_RADIUS = 16;
/**
 * The drawn boid dart, in world units. Kept close to twice the engine's
 * `BOID_COLLISION_RADIUS` (6), which is the distance the overlap relaxation holds
 * between two boid centres: at that ratio neighbours at rest almost touch, so the
 * swarm reads as one dense cloud instead of a field of separate darts. Shrinking
 * these without shrinking the collision radius would only leave visible gaps.
 */
export const BOID_VISUAL_LENGTH = 11;
export const BOID_VISUAL_WIDTH = 8;
export const BOID_TAIL_INSET = 3;
export const PLAYER_MAX_SPEED = 360;

/**
 * How hard the player builds speed in the direction they are holding, in px/s².
 *
 * Reaches the top speed from a standstill in `360 / 2000` = 0,18 s. Deliberately not the lever
 * that makes a turn feel sharp — that is `PLAYER_TURN_DECELERATION` below, because acceleration
 * can only ever *add*, and a turn is mostly a matter of getting rid of the old velocity.
 */
export const PLAYER_ACCELERATION = 2000;

/**
 * How hard the player slows once no direction is held at all, in px/s².
 *
 * Higher than the acceleration on purpose: letting go is a decision and should land quickly,
 * whereas building up to full tilt is meant to be felt. From top speed to a full stop in
 * `360 / 2600` = 0,14 s, and it snaps the last sliver to exactly zero rather than drifting.
 */
export const PLAYER_DECELERATION = 2600;

/**
 * How hard the player brakes the part of their velocity that is *not* going where they point,
 * in px/s².
 *
 * This is what a fast direction change actually costs, and it used to cost nothing: while a
 * direction was held there was no braking at all, so the only thing working against the old
 * momentum was the acceleration itself. A full reversal therefore took twice as long as reaching
 * top speed did (`2 × 360 / 1200` = 0,6 s) and a ninety-degree turn was a wide drift with no
 * force acting on the sideways component at all.
 *
 * The highest of the three because it is the most deliberate: a player pushing a direction that
 * disagrees with where they are going is actively steering, not coasting. It clears a full
 * sideways `PLAYER_MAX_SPEED` in `360 / 3600` = 0,1 s, which reads as grip rather than as a
 * teleport — the knob to turn down first if the player ever feels twitchy instead of responsive.
 */
export const PLAYER_TURN_DECELERATION = 3600;

/** Safety net for the player integrator. Must stay above SIMULATION_STEP_SECONDS. */
export const PLAYER_MAX_DELTA_SECONDS = 0.05;

// ---------------------------------------------------------------------------
// Player dash (space bar)
// ---------------------------------------------------------------------------

/** Speed the dash starts at — roughly three times the normal top speed. */
export const PLAYER_DASH_SPEED = 1100;

/**
 * How quickly the raised speed limit falls back to `PLAYER_MAX_SPEED`, in
 * pixels per second squared. Together with the dash speed this is what sets the
 * dash distance, and it is the only lever that changes that distance without
 * touching how hard the dash feels at the moment it starts.
 *
 * The surplus travel is the area under the decaying ramp above the normal top
 * speed: (1100 - 360)^2 / (2 * 1533), about 179 pixels on top of the ~79 the
 * player would have covered at top speed anyway. The ramp lasts
 * (1100 - 360) / 1533, so just under half a second.
 */
export const PLAYER_DASH_SPEED_DECAY = 1533;

/** How long the player has to wait before dashing again. */
export const PLAYER_DASH_COOLDOWN_MS = 1400;

// ---------------------------------------------------------------------------
// Temporary obstacles
//
// The obstacles themselves live entirely in the engine — their shape, placement and
// lifetime are simulation, not presentation. What is left here is only what the
// renderer needs to decode and draw them.
// ---------------------------------------------------------------------------

/**
 * Values per obstacle in the engine's obstacle buffer:
 * `[spineStartX, spineStartY, spineEndX, spineEndY, radius, renderPhase, hitFlash]`.
 *
 * Duplicated in `engine/src/wasm_bridge/frame_buffers.rs` and asserted on by the WASM
 * boundary tests, the same way `INITIAL_BOID_COUNT` is duplicated — keep the two in sync.
 */
export const OBSTACLE_STRIDE = 7;

/**
 * Share of an obstacle's life spent fading out before it goes, so it warns instead of
 * vanishing between two frames.
 *
 * The opening fade has no constant here on purpose: it runs over the engine's arming
 * window (`OBSTACLE_ARMING_STEPS`) and is read straight off the sign of the render
 * phase. A share chosen on this side could disagree with that window, and the obstacle
 * would become solid before it looks solid — which is the whole thing the window
 * prevents.
 */
export const OBSTACLE_FADE_SHARE = 0.06;

// ---------------------------------------------------------------------------
// Wave spawn markers
//
// Every wave after the first is announced at the world edge before it arrives, and the
// engine owns all of that: where a gate opens, how long the warning lasts, and when the
// boids are let in. What is left here is only what the renderer needs to decode and draw
// the announcement.
//
// The look is a placeholder — a plain red glow, deliberately not a SIGNAL design-system
// component yet. It is here to make the mechanic visible and testable; the final graphic
// replaces the drawing in `renderer/spawnMarkerLayer.js` without touching anything else.
// ---------------------------------------------------------------------------

/**
 * Values per marker in the engine's spawn-marker buffer: `[x, y, warningProgress]`.
 *
 * Duplicated in `engine/src/wasm_bridge/frame_buffers.rs` and asserted on by the WASM
 * boundary tests, the same way `OBSTACLE_STRIDE` is — keep the two in sync.
 */
export const SPAWN_MARKER_STRIDE = 3;

/**
 * How far the glow of one marker reaches, in world units.
 *
 * Chosen against the engine's `WAVE_SPAWN_GATE_SPREAD` (84) and the four boids a gate
 * usually holds: at roughly 28 units apart, glows this wide overlap into a single arc
 * along the edge, which is what makes a gate read as one arrival rather than as four
 * separate dots. It is therefore the one value here that must not be lowered without
 * looking at that spread again.
 */
export const SPAWN_MARKER_RADIUS = 34;

/**
 * How much of the glow is already there when a wave is announced.
 *
 * A marker that started at nothing would be invisible for the first half of exactly the
 * window it exists to fill. It ramps from here to full over the warning instead, so the
 * arrival still reads as approaching.
 */
export const SPAWN_MARKER_MINIMUM_INTENSITY = 0.35;

/**
 * How much larger the marker's outer ring is than the glow at the moment of announcement,
 * and how far it has closed in by the time the boids arrive.
 *
 * The ring collapsing onto the spawn point is the part that carries *when*: a glow alone
 * brightens, which reads as intensity rather than as a countdown.
 */
export const SPAWN_MARKER_RING_START_SCALE = 2.2;
export const SPAWN_MARKER_RING_END_SCALE = 1;

/**
 * Beats per second of the marker's flicker, and how much of its brightness that flicker
 * takes away at the trough.
 *
 * Presentation rather than simulation, so it runs on wall time like the power-up spin —
 * the warning's actual timing is the ring, which comes from the engine.
 */
export const SPAWN_MARKER_PULSE_HZ = 2.4;
export const SPAWN_MARKER_PULSE_DEPTH = 0.22;

/**
 * Values per warning line in the engine's dash-aim buffer:
 * `[startX, startY, endX, endY, chargeProgress]`.
 *
 * One entry per boid that is charging up a dash, and only for as long as it charges. Not
 * index-aligned with the boid buffers — hence the start point inside the entry.
 *
 * Duplicated in `engine/src/wasm_bridge/frame_buffers.rs` and asserted on by the WASM
 * boundary tests, the same way `SPAWN_MARKER_STRIDE` is — keep the two in sync.
 *
 * The look of the line is not configured here but in `renderer/dashAimLayer.js`, next to the
 * drawing it belongs to, the way the pulse keeps its own numbers in `renderer/dashPulse.js`.
 * What crosses the language boundary is only this stride.
 */
export const DASH_AIM_STRIDE = 5;

/**
 * How much of the velocity that ran into an obstacle comes back the other way when the
 * player hits it.
 *
 * Zero would only strip that velocity, which is a dead stop against the surface; one
 * would be a perfect bounce and would fling a dashing player back across the world.
 * A small fraction reads as being knocked back without taking control away — the
 * engine has already moved the player clear of the obstacle, so this is only the
 * feel of it.
 */
export const PLAYER_OBSTACLE_BOUNCE = 0.35;

// The Rust engine advances exactly one fixed step per tick() call and does not
// scale by delta time, so the simulation must run at a constant rate no matter
// how often the canvas is redrawn.
export const SIMULATION_STEPS_PER_SECOND = 60;
export const SIMULATION_STEP_MS = 1000 / SIMULATION_STEPS_PER_SECOND;
export const SIMULATION_STEP_SECONDS = 1 / SIMULATION_STEPS_PER_SECOND;

/**
 * Upper bound on catch-up work after a stall (~83 ms). A simulation step is
 * O(n²) in the boid count, so raising this trades a freeze for a stutter.
 */
export const MAX_SIMULATION_STEPS_PER_FRAME = 5;

/**
 * Every rate the menu knows about. Which of them are actually offered depends on
 * the display: `loop/refreshRate.js` drops the ones it cannot show.
 */
export const TARGET_FPS_OPTIONS = Object.freeze([30, 60, 120]);

/**
 * Fallback target only. The menu preselects the highest option the display can
 * show, so this value is what the frametime graph falls back to when it is drawn
 * without being told the current target.
 */
export const DEFAULT_TARGET_FPS = 60;

/** Selecting this option disables render throttling entirely. */
export const UNCAPPED_TARGET_FPS = 120;

/**
 * Slack in the render gate. Without it, jitter around the 33.33 ms mark makes a
 * 30 fps target intermittently miss its slot and fall through to the next
 * display frame, producing alternating 33/50 ms frames (visible judder).
 */
export const RENDER_INTERVAL_TOLERANCE_MS = 2;

// ---------------------------------------------------------------------------
// Display refresh rate (measured once at start-up)
// ---------------------------------------------------------------------------

/**
 * How many animation frames the refresh-rate probe watches. Enough for a stable
 * median, short enough to finish while the locale file is still being fetched.
 */
export const REFRESH_RATE_SAMPLE_COUNT = 12;

/**
 * Headroom when comparing an option against the measured rate. A nominal 60 Hz
 * panel usually measures as 59.94 Hz, and without the headroom 60 fps would be
 * filtered off the very display that can show it.
 */
export const REFRESH_RATE_TOLERANCE = 0.05;

/**
 * Range a measurement has to fall into to be believed. A backgrounded tab
 * throttles requestAnimationFrame to about one call per second, which would
 * otherwise look like a 1 Hz display and leave the player with 30 fps only.
 */
export const MIN_PLAUSIBLE_REFRESH_RATE_HZ = 20;
export const MAX_PLAUSIBLE_REFRESH_RATE_HZ = 500;

// ---------------------------------------------------------------------------
// Frametime graph (opt-in performance overlay)
// ---------------------------------------------------------------------------

/** Off by default: the graph is a diagnostic tool, not part of the game. */
export const DEFAULT_FRAME_GRAPH_ENABLED = false;

/**
 * How many curves the graph plots. `SEPARATE` keeps simulation and draw time
 * apart, `COMBINED` plots their sum as a single line — easier to read when all
 * you want to know is whether the frame as a whole fits its budget.
 */
export const FRAME_GRAPH_MODE = Object.freeze({
  SEPARATE: 'separate',
  COMBINED: 'combined',
});

export const DEFAULT_FRAME_GRAPH_MODE = FRAME_GRAPH_MODE.SEPARATE;

/** Bars kept in the history — roughly two seconds of frames at 60 fps. */
export const FRAME_GRAPH_SAMPLE_COUNT = 120;

/** Panel size in CSS pixels. */
export const FRAME_GRAPH_WIDTH = 184;
export const FRAME_GRAPH_HEIGHT = 109;
export const FRAME_GRAPH_PADDING = 6;

/**
 * Vertical space above the plot reserved for the three text rows.
 *
 * The third row is the load row — drawn frames per second, drawing operations and backing
 * store pixels. The panel grew by exactly one row rather than the plot shrinking, because
 * the plot height is what makes a millisecond readable as a height.
 */
export const FRAME_GRAPH_TEXT_HEIGHT = 43;

/**
 * How much taller the vertical axis is than the frame budget of the selected
 * target framerate. A factor of 2 puts the dashed budget line exactly halfway up
 * the plot: curves below it fit the budget, and the free half above leaves room
 * to see how far a spike overshot instead of clipping it at the budget itself.
 */
export const FRAME_GRAPH_HEADROOM_FACTOR = 2;

/** Stroke width of a plotted curve, in CSS pixels. */
export const FRAME_GRAPH_LINE_WIDTH = 1.5;

/**
 * Opacity of the tinted area below a curve. Low enough to keep both readable
 *  where two curves overlap.
 */
export const FRAME_GRAPH_AREA_ALPHA = 0.16;

/** Width of the marker drawn where a sample ran past the top of the scale. */
export const FRAME_GRAPH_OVER_SCALE_MARK_WIDTH = 2;
export const FRAME_GRAPH_OVER_SCALE_MARK_HEIGHT = 2;
