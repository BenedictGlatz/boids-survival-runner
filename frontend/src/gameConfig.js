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

export const INITIAL_BOID_COUNT = 12;
export const PLAYER_STARTING_LIVES = 3;
export const HIT_COOLDOWN_MS = 900;
export const WAVE_DURATION_SECONDS = 30;
export const START_COUNTDOWN_SECONDS = 3;
export const PLAYER_VISUAL_RADIUS = 16;
export const BOID_VISUAL_LENGTH = 15;
export const BOID_VISUAL_WIDTH = 11;
export const BOID_TAIL_INSET = 4;
export const PLAYER_MAX_SPEED = 360;
export const PLAYER_ACCELERATION = 1200;
export const PLAYER_DECELERATION = 1500;

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
 * `[spineStartX, spineStartY, spineEndX, spineEndY, radius, lifeFraction, hitFlash]`.
 *
 * Duplicated in `engine/src/wasm_bridge/mod.rs` and asserted on by the WASM boundary
 * tests, the same way `INITIAL_BOID_COUNT` is duplicated — keep the two in sync.
 */
export const OBSTACLE_STRIDE = 7;

/**
 * Share of an obstacle's life spent fading in when it appears, and again fading out
 * before it goes. It has to be long enough to read as a warning rather than a pop,
 * and short enough that the obstacle is solid for most of its time on screen.
 */
export const OBSTACLE_FADE_SHARE = 0.06;

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
export const FRAME_GRAPH_HEIGHT = 96;
export const FRAME_GRAPH_PADDING = 6;

/** Vertical space above the plot reserved for the two text rows. */
export const FRAME_GRAPH_TEXT_HEIGHT = 30;

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
